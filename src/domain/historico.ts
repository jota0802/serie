import { tonelagem, umRepMaximo } from './forca';
import type { ItemDeTreino, SerieRegistrada, Treino } from './types';

/**
 * O histórico: as sessões já fechadas, e o que se deriva delas.
 *
 * É o que faz o app APRENDER. A `CAR-1` olha a última vez de cada exercício, a `CAR-7`
 * compara com a mesma letra da vez anterior e a `CAR-5` precisa do maior 1RM já visto —
 * tudo isso sai daqui, de funções puras sobre a lista de sessões. Nenhum número é
 * guardado à parte: guardar o recorde separado da série que o gerou é como o mock antigo
 * acabou com um recorde menor que a própria última sessão.
 */

export interface SessaoFechada {
  id: string;
  treinoId: string;
  inicioMs: number;
  fimMs: number;
  series: SerieRegistrada[];
}

/** Mais recente primeiro. Não muta a lista recebida. */
export function ordenarPorFim(sessoes: readonly SessaoFechada[]): SessaoFechada[] {
  return [...sessoes].sort((a, b) => b.fimMs - a.fimMs);
}

/** As séries da última sessão em que o exercício apareceu. Vazio se nunca foi feito. */
export function ultimasSeriesDe(sessoes: readonly SessaoFechada[], exercicioId: string): SerieRegistrada[] {
  for (const sessao of ordenarPorFim(sessoes)) {
    const series = sessao.series.filter((s) => s.exercicioId === exercicioId);
    if (series.length > 0) return series;
  }
  return [];
}

/** A última sessão em que o exercício apareceu (com a data, que `ultimasSeriesDe` não tem). */
export function ultimaSessaoCom(sessoes: readonly SessaoFechada[], exercicioId: string): SessaoFechada | undefined {
  return ordenarPorFim(sessoes).find((s) => s.series.some((x) => x.exercicioId === exercicioId));
}

/** RN-19 — a carga do plano vale quando foi mudada depois da última vez do exercício. */
export function cargaDoPlanoVale(item: ItemDeTreino, ultimaVezFimMs: number | undefined): boolean {
  return item.cargaDefinidaEmMs != null && (ultimaVezFimMs == null || item.cargaDefinidaEmMs > ultimaVezFimMs);
}

/** `CAR-7` — tonelagem da última sessão da MESMA letra. Zero se é a primeira vez. */
export function ultimaTonelagem(sessoes: readonly SessaoFechada[], treinoId: string): number {
  const anterior = ordenarPorFim(sessoes).find((s) => s.treinoId === treinoId);
  return anterior ? tonelagem(anterior.series) : 0;
}

/** `CAR-5` — o maior 1RM estimado já visto no exercício. */
export function recordeDe(sessoes: readonly SessaoFechada[], exercicioId: string): number {
  let recorde = 0;
  for (const sessao of sessoes) {
    for (const s of sessao.series) {
      if (s.exercicioId === exercicioId) recorde = Math.max(recorde, umRepMaximo(s.cargaKg, s.reps));
    }
  }
  return recorde;
}

/** A próxima letra do plano: a que vem depois da última sessão fechada, em ciclo. */
export function proximoTreino(sessoes: readonly SessaoFechada[], treinos: readonly Treino[]): Treino {
  const ordenados = [...treinos].sort((a, b) => a.ordem - b.ordem);
  const ultima = ordenarPorFim(sessoes)[0];
  if (!ultima) return ordenados[0];
  const i = ordenados.findIndex((t) => t.id === ultima.treinoId);
  return ordenados[(i + 1) % ordenados.length];
}

/** As sessões fechadas na semana corrente (de domingo 00:00 até agora, no fuso do aparelho). */
export function sessoesDaSemana(sessoes: readonly SessaoFechada[], agoraMs: number): SessaoFechada[] {
  const inicio = new Date(agoraMs);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - inicio.getDay());
  return sessoes.filter((s) => s.fimMs >= inicio.getTime() && s.fimMs <= agoraMs);
}

/**
 * Corrigir o histórico (RN-40 a RN-43, `docs/regras-do-app.md`).
 *
 * - RN-40 · um treino concluído pode ser corrigido ou apagado — errar um número no descanso não
 *   pode envenenar a progressão para sempre;
 * - RN-41 · a série corrigida perde o `foiAlvo`: o que ficou registrado não era o alvo confirmado;
 * - RN-42 · a última série de um treino não sai sozinha: para isso, apague o treino;
 * - RN-43 · recorde, volume e "a última vez" são derivados das séries (nada é guardado à parte),
 *   então a correção vale na hora em todo o app.
 */
export const LIMITES_DA_SERIE = { reps: { min: 0, max: 200 }, carga: { min: 0, max: 1000 } } as const;

export type CorrecaoDeSessao = { ok: true; sessao: SessaoFechada } | { ok: false; motivo: string };

export function corrigirSerie(
  sessao: SessaoFechada,
  posicao: number,
  correcao: { reps?: number; cargaKg?: number },
): CorrecaoDeSessao {
  const atual = sessao.series[posicao];
  if (!atual) return { ok: false, motivo: 'Essa série não existe mais.' };
  const reps = correcao.reps ?? atual.reps;
  const cargaKg = correcao.cargaKg ?? atual.cargaKg;
  if (!Number.isInteger(reps) || reps < LIMITES_DA_SERIE.reps.min || reps > LIMITES_DA_SERIE.reps.max) {
    return { ok: false, motivo: 'Repetições: um número inteiro de 0 a 200.' };
  }
  if (!Number.isFinite(cargaKg) || cargaKg < LIMITES_DA_SERIE.carga.min || cargaKg > LIMITES_DA_SERIE.carga.max) {
    return { ok: false, motivo: 'Carga: de 0 a 1000 kg.' };
  }
  const arredondada = Math.round(cargaKg * 100) / 100;
  if (reps === atual.reps && arredondada === atual.cargaKg) return { ok: true, sessao };
  const series = sessao.series.map((s, i) => (i === posicao ? { ...s, reps, cargaKg: arredondada, foiAlvo: false } : s));
  return { ok: true, sessao: { ...sessao, series } };
}

/** RN-42 — tira uma série registrada por engano e renumera as do mesmo exercício. */
export function removerSerie(sessao: SessaoFechada, posicao: number): CorrecaoDeSessao {
  const alvo = sessao.series[posicao];
  if (!alvo) return { ok: false, motivo: 'Essa série não existe mais.' };
  if (sessao.series.length <= 1) return { ok: false, motivo: 'É a única série do treino. Para tirá-la, apague o treino.' };
  const restantes = sessao.series.filter((_, i) => i !== posicao);
  let indice = 0;
  const series = restantes.map((s) => (s.exercicioId === alvo.exercicioId ? { ...s, indice: indice++ } : s));
  return { ok: true, sessao: { ...sessao, series } };
}
