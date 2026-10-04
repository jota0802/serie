import { tonelagem, umRepMaximo } from './forca';
import type { SerieRegistrada, Treino } from './types';

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
