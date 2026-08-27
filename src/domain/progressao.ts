import type { Alvo, Faixa, SerieRegistrada } from './types';

/**
 * `CAR-1` — Dupla progressão. É o cérebro do app.
 *
 * Você sobe repetições dentro da faixa; quando fecha o TOPO DA FAIXA EM TODAS AS
 * SÉRIES, na próxima sessão a carga sobe e o alvo de reps volta para o piso.
 *
 * É o método mais usado na musculação real, é auditável, e cabe numa função pura.
 * É também a única coisa do app que ninguém mais faz direito.
 */

/** Arredonda para o múltiplo de anilha mais próximo. A academia não tem meia anilha. */
export function arredondarParaAnilha(cargaKg: number, incrementoKg: number): number {
  if (incrementoKg <= 0) return cargaKg;
  return Math.round(cargaKg / incrementoKg) * incrementoKg;
}

/** Fechou o topo da faixa em todas as séries do exercício? */
export function fechouAFaixa(series: SerieRegistrada[], faixa: Faixa, seriesEsperadas: number): boolean {
  if (series.length < seriesEsperadas) return false;
  return series.slice(0, seriesEsperadas).every((s) => s.reps >= faixa.max);
}

/**
 * O alvo de cada série da próxima sessão.
 *
 * - Fechou a faixa inteira → carga sobe um incremento, reps voltam para o piso.
 * - Não fechou → mesma carga, e cada série mira UMA repetição a mais que da última vez
 *   (limitada ao topo da faixa). É assim que a progressão acontece dentro da faixa.
 * - Sem histórico → a carga do plano, mirando o piso da faixa.
 */
export function proximoAlvo(params: {
  ultimaSessao: SerieRegistrada[];
  faixa: Faixa;
  cargaAtualKg: number;
  incrementoKg: number;
  series: number;
}): Alvo[] {
  const { ultimaSessao, faixa, cargaAtualKg, incrementoKg, series } = params;

  if (ultimaSessao.length === 0) {
    return Array.from({ length: series }, () => ({
      cargaKg: cargaAtualKg,
      reps: faixa.min,
      origem: 'inicial' as const,
    }));
  }

  if (fechouAFaixa(ultimaSessao, faixa, series)) {
    const nova = arredondarParaAnilha(cargaAtualKg + incrementoKg, incrementoKg);
    return Array.from({ length: series }, () => ({
      cargaKg: nova,
      reps: faixa.min,
      origem: 'progressao' as const,
    }));
  }

  return Array.from({ length: series }, (_, i) => {
    const anterior = ultimaSessao[i];
    const reps = anterior ? Math.min(faixa.max, anterior.reps + 1) : faixa.min;
    return { cargaKg: cargaAtualKg, reps, origem: 'repetir' as const };
  });
}

/**
 * `CAR-3` — Regressão / deload.
 *
 * Duas sessões consecutivas falhando o PISO da faixa na mesma carga → o app
 * SUGERE −10% naquele exercício. Sugere, não impõe, e some se você recusar duas vezes.
 *
 * `CAR-3.1` Falhar não é vermelho. Um app que te pune por um dia ruim é
 * desinstalado num dia ruim.
 */
export function sugerirDeload(params: {
  /** Da mais recente para a mais antiga. */
  ultimasSessoes: SerieRegistrada[][];
  faixa: Faixa;
  cargaAtualKg: number;
  incrementoKg: number;
  recusas?: number;
}): Alvo | null {
  const { ultimasSessoes, faixa, cargaAtualKg, incrementoKg, recusas = 0 } = params;

  if (recusas >= 2) return null;
  if (ultimasSessoes.length < 2) return null;

  const falhouOPiso = (series: SerieRegistrada[]) =>
    series.length > 0 &&
    series.some((s) => s.reps < faixa.min) &&
    series.every((s) => s.cargaKg === cargaAtualKg);

  const duasSeguidas = ultimasSessoes.slice(0, 2).every(falhouOPiso);
  if (!duasSeguidas) return null;

  return {
    cargaKg: arredondarParaAnilha(cargaAtualKg * 0.9, incrementoKg),
    reps: faixa.min,
    origem: 'deload',
  };
}
