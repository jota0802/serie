import type { SerieRegistrada } from '@/domain/types';

/**
 * O que foi feito na última vez, por exercício. Mockado (CP5).
 *
 * É a entrada da `CAR-1`. O supino fechou 12 repetições nas QUATRO séries a 40 kg —
 * por isso, e só por isso, o app propõe 42,5 kg hoje. Nenhum número de tela é cravado:
 * todos saem daqui pela regra.
 */
const registro = (exercicioId: string, reps: number[], cargaKg: number): SerieRegistrada[] =>
  reps.map((r, indice) => ({ exercicioId, indice, reps: r, cargaKg, foiAlvo: true, duracaoSegundos: 38 }));

export const ULTIMA_SESSAO: Readonly<Record<string, SerieRegistrada[]>> = {
  // fechou a faixa nas quatro séries → a carga sobe sozinha
  'supino-reto-barra': registro('supino-reto-barra', [12, 12, 12, 12], 40),
  'supino-inclinado-halter': registro('supino-inclinado-halter', [11, 10, 10], 16),
  crossover: registro('crossover', [14, 13, 13], 12),
  'triceps-corda': registro('triceps-corda', [12, 11, 10], 25),
  'triceps-frances': registro('triceps-frances', [11, 10, 10], 14),
};

/** Tonelagem da última sessão de cada letra — o `CAR-7` compara com a MESMA letra. */
export const TONELAGEM_ANTERIOR: Readonly<Record<string, number>> = { A: 4120, B: 3980, C: 5240 };

/** Maior 1RM estimado já visto, por exercício (`CAR-5`). */
export const RECORDES: Readonly<Record<string, number>> = {
  'supino-reto-barra': 56,
  'supino-inclinado-halter': 22.4,
  crossover: 17.6,
  'triceps-corda': 34,
  'triceps-frances': 19.6,
};
