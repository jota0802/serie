import type { Treino } from '@/domain/types';

/**
 * Plano de exemplo — divisão ABC, o mesmo do protótipo.
 *
 * Dados mockados de propósito: o CP5 pede "protótipo funcional com dados mockados,
 * sem backend real". A montagem do plano pelo onboarding entra depois (telas 06–09).
 *
 * ⚠️ `cargaKg` aqui é a carga da ÚLTIMA vez, não o alvo de hoje. O alvo sai da `CAR-1`
 * cruzando isto com `historico.ts` — é isso que faz o supino aparecer como 42,5 kg na
 * tela sem ninguém ter digitado 42,5 em lugar nenhum.
 */
export const TREINOS: readonly Treino[] = [
  {
    id: 'A',
    nome: 'Peito e tríceps',
    ordem: 0,
    itens: [
      { exercicioId: 'supino-reto-barra', series: 4, faixa: { min: 8, max: 12 }, cargaKg: 40 },
      { exercicioId: 'supino-inclinado-halter', series: 3, faixa: { min: 10, max: 12 }, cargaKg: 16 },
      { exercicioId: 'crossover', series: 3, faixa: { min: 12, max: 15 }, cargaKg: 12 },
      { exercicioId: 'triceps-corda', series: 3, faixa: { min: 10, max: 12 }, cargaKg: 25 },
      { exercicioId: 'triceps-frances', series: 3, faixa: { min: 10, max: 12 }, cargaKg: 14 },
    ],
  },
  {
    id: 'B',
    nome: 'Costas e bíceps',
    ordem: 1,
    itens: [
      { exercicioId: 'barra-fixa', series: 4, faixa: { min: 6, max: 10 }, cargaKg: 0 },
      { exercicioId: 'remada-curvada', series: 4, faixa: { min: 8, max: 12 }, cargaKg: 50 },
      { exercicioId: 'puxada-frente', series: 3, faixa: { min: 10, max: 12 }, cargaKg: 55 },
      { exercicioId: 'rosca-direta', series: 3, faixa: { min: 10, max: 12 }, cargaKg: 25 },
      { exercicioId: 'rosca-martelo', series: 3, faixa: { min: 10, max: 12 }, cargaKg: 14 },
    ],
  },
  {
    id: 'C',
    nome: 'Pernas e ombro',
    ordem: 2,
    itens: [
      { exercicioId: 'agachamento-livre', series: 4, faixa: { min: 6, max: 10 }, cargaKg: 70 },
      { exercicioId: 'leg-press', series: 3, faixa: { min: 10, max: 15 }, cargaKg: 160 },
      { exercicioId: 'mesa-flexora', series: 3, faixa: { min: 10, max: 12 }, cargaKg: 35 },
      { exercicioId: 'desenvolvimento-halter', series: 3, faixa: { min: 8, max: 12 }, cargaKg: 18 },
      { exercicioId: 'elevacao-lateral', series: 3, faixa: { min: 12, max: 15 }, cargaKg: 8 },
    ],
  },
];

export const TREINOS_POR_ID: ReadonlyMap<string, Treino> = new Map(TREINOS.map((t) => [t.id, t]));

/** O plano: quais dias da semana, e qual letra cai em cada um. */
export const PLANO = {
  /** 0 = domingo. Segunda, terça, quinta e sexta. */
  dias: [1, 2, 4, 5],
  /** Qual treino é o de hoje. Mockado enquanto o plano não é montado de verdade. */
  treinoDeHoje: 'A',
  /** Posição da sessão na semana — alimenta o "2 de 4" do cabeçalho. */
  sessaoDaSemana: 2,
  totalNaSemana: 4,
  proximo: { treino: 'B', quando: 'quinta-feira' },
} as const;
