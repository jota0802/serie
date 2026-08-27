import type { SerieRegistrada } from './types';

/**
 * `CAR-5` — Recorde. 1RM estimado pela fórmula de Epley.
 *
 *   1RM = carga × (1 + reps / 30)
 *
 * Calculado por série; o recorde do exercício é o maior já visto.
 * Bater um recorde é O ÚNICO MOMENTO DO APP QUE TEM COR.
 */
export function umRepMaximo(cargaKg: number, reps: number): number {
  if (reps <= 0 || cargaKg <= 0) return 0;
  if (reps === 1) return cargaKg;
  return cargaKg * (1 + reps / 30);
}

/** O maior 1RM estimado de um conjunto de séries. */
export function melhor1RM(series: SerieRegistrada[]): number {
  return series.reduce((max, s) => Math.max(max, umRepMaximo(s.cargaKg, s.reps)), 0);
}

/** Bateu recorde? Compara o melhor da sessão com o recorde histórico. */
export function bateuRecorde(series: SerieRegistrada[], recordeAtual: number): boolean {
  return melhor1RM(series) > recordeAtual;
}

/**
 * `CAR-7` — Tonelagem: Σ (carga × reps) da sessão.
 *
 * É o número dominante do resumo. Compara-se sempre com a MESMA LETRA na vez
 * anterior — comparar A com B não significaria nada, então não se compara.
 */
export function tonelagem(series: SerieRegistrada[]): number {
  return series.reduce((total, s) => total + s.cargaKg * s.reps, 0);
}

/**
 * `CAR-11.1` — Métricas que caem de graça do cronômetro, sem sensor nenhum.
 * Tempo sob tensão = Σ das durações das séries.
 */
export function tempoSobTensao(series: SerieRegistrada[]): number {
  return series.reduce((total, s) => total + (s.duracaoSegundos ?? 0), 0);
}

export function duracaoMediaDaSerie(series: SerieRegistrada[]): number {
  const comDuracao = series.filter((s) => s.duracaoSegundos != null);
  if (comDuracao.length === 0) return 0;
  return tempoSobTensao(comDuracao) / comDuracao.length;
}
