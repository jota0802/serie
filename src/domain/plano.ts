import { arredondarParaAnilha } from './progressao';
import type { Exercicio, Faixa, ItemDeTreino, Treino } from './types';

/**
 * Telas 06–09 — a montagem do plano: três perguntas geram as letras A/B/C.
 *
 * É uma TABELA de templates, não um modelo: dá para auditar cada número lendo este arquivo
 * (ver `docs/escopo.md` §4, "IA gerando treino" está fora de propósito).
 *
 * - **dias por semana** → a divisão: 2 dias, corpo inteiro A/B; de 3 a 6, A/B/C em rodízio
 *   (com 5 ou 6 dias você passa duas vezes por algumas letras na semana);
 * - **objetivo** → a faixa de repetições e o número de séries, que são a entrada da `CAR-1`;
 * - **peso** → a carga de PARTIDA, conservadora, arredondada para a anilha. A primeira semana é
 *   calibração: o usuário corrige no descanso e a dupla progressão assume dali.
 */

export type Objetivo = 'hipertrofia' | 'forca' | 'condicionamento';

export interface RespostasDaMontagem {
  /** O único obrigatório da tela 06: é dele que sai a carga de partida. */
  pesoKg: number;
  idade?: number;
  alturaCm?: number;
  diasPorSemana: number;
  objetivo: Objetivo;
}

export interface Plano {
  /** Dias da semana do plano, 0 = domingo. */
  dias: number[];
  treinos: Treino[];
}

export const DIAS_POSSIVEIS = [2, 3, 4, 5, 6] as const;

interface Prescricao {
  composto: Faixa;
  isolado: Faixa;
  series: { composto: number; isolado: number };
  /** Ajuste da carga de partida: força começa mais pesado, condicionamento mais leve. */
  fatorDeCarga: number;
}

export const PRESCRICAO_POR_OBJETIVO: Record<Objetivo, Prescricao> = {
  hipertrofia: { composto: { min: 8, max: 12 }, isolado: { min: 10, max: 15 }, series: { composto: 4, isolado: 3 }, fatorDeCarga: 1 },
  forca: { composto: { min: 4, max: 6 }, isolado: { min: 8, max: 10 }, series: { composto: 5, isolado: 3 }, fatorDeCarga: 1.15 },
  condicionamento: { composto: { min: 12, max: 15 }, isolado: { min: 15, max: 20 }, series: { composto: 3, isolado: 3 }, fatorDeCarga: 0.85 },
};

/**
 * Carga de partida como fração do peso do corpo (halter: por mão). Conservadora de propósito —
 * começar leve e subir pela `CAR-1` é melhor que falhar a primeira série.
 */
export const CARGA_DE_PARTIDA: Readonly<Record<string, number>> = {
  'supino-reto-barra': 0.5,
  'supino-inclinado-halter': 0.15,
  crossover: 0.12,
  'triceps-corda': 0.25,
  'triceps-frances': 0.15,
  'remada-curvada': 0.5,
  'puxada-frente': 0.6,
  'rosca-direta': 0.25,
  'rosca-martelo': 0.15,
  'agachamento-livre': 0.7,
  'leg-press': 1.5,
  'mesa-flexora': 0.35,
  'desenvolvimento-halter': 0.18,
  'elevacao-lateral': 0.08,
  'terra-romeno': 0.6,
  'barra-fixa': 0,
  // O resto do catálogo, para exercício adicionado no "Montar treino" nunca entrar com 0 kg (RN-18).
  // Halter e unilateral são POR MÃO; máquina, pelo pino/placa do aparelho.
  'supino-inclinado-barra': 0.42,
  'supino-reto-halter': 0.18,
  'supino-maquina': 0.45,
  'desenvolvimento-barra': 0.3,
  'desenvolvimento-maquina': 0.32,
  'remada-baixa': 0.5,
  'remada-cavalinho': 0.45,
  'remada-unilateral': 0.22,
  'remada-maquina': 0.5,
  'puxada-supinada': 0.55,
  pulldown: 0.3,
  'agachamento-smith': 0.65,
  hack: 0.9,
  bulgaro: 0.12,
  'levantamento-terra': 0.9,
  stiff: 0.55,
  'elevacao-pelvica': 0.8,
  'rosca-alternada': 0.12,
  'rosca-scott': 0.22,
  'triceps-testa': 0.22,
  'crucifixo-inverso': 0.07,
  'cadeira-abdutora': 0.45,
  'cadeira-extensora': 0.4,
  'panturrilha-pe': 0.8,
  'panturrilha-sentado': 0.5,
};

type Template = { id: string; nome: string; exercicios: string[] };

const ABC: Template[] = [
  { id: 'A', nome: 'Peito e tríceps', exercicios: ['supino-reto-barra', 'supino-inclinado-halter', 'crossover', 'triceps-corda', 'triceps-frances'] },
  { id: 'B', nome: 'Costas e bíceps', exercicios: ['barra-fixa', 'remada-curvada', 'puxada-frente', 'rosca-direta', 'rosca-martelo'] },
  { id: 'C', nome: 'Pernas e ombro', exercicios: ['agachamento-livre', 'leg-press', 'mesa-flexora', 'desenvolvimento-halter', 'elevacao-lateral'] },
];

const CORPO_INTEIRO: Template[] = [
  { id: 'A', nome: 'Corpo inteiro A', exercicios: ['agachamento-livre', 'supino-reto-barra', 'remada-curvada', 'desenvolvimento-halter', 'rosca-direta'] },
  { id: 'B', nome: 'Corpo inteiro B', exercicios: ['terra-romeno', 'supino-inclinado-halter', 'puxada-frente', 'elevacao-lateral', 'triceps-corda'] },
];

/** Os dias da semana para cada frequência, espaçados para descansar o mesmo grupo. 0 = domingo. */
export const DIAS_DA_SEMANA: Readonly<Record<number, number[]>> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
};

export function gerarPlano(respostas: RespostasDaMontagem, catalogo: ReadonlyMap<string, Exercicio>): Plano {
  const dias = Math.min(6, Math.max(2, Math.round(respostas.diasPorSemana)));
  const prescricao = PRESCRICAO_POR_OBJETIVO[respostas.objetivo];
  const templates = dias === 2 ? CORPO_INTEIRO : ABC;

  const treinos: Treino[] = templates.map((t, ordem) => ({
    id: t.id,
    nome: t.nome,
    ordem,
    itens: t.exercicios.map((exercicioId): ItemDeTreino => {
      const exercicio = catalogo.get(exercicioId);
      const composto = exercicio?.composto ?? true;
      return {
        exercicioId,
        series: composto ? prescricao.series.composto : prescricao.series.isolado,
        faixa: { ...(composto ? prescricao.composto : prescricao.isolado) },
        cargaKg: cargaDePartida(exercicio, respostas.pesoKg, prescricao.fatorDeCarga),
      };
    }),
  }));

  return { dias: [...DIAS_DA_SEMANA[dias]], treinos };
}

/** A carga com que o exercício entra no plano novo. Peso do corpo e exercício fora da tabela: 0. */
export function cargaDePartida(exercicio: Exercicio | undefined, pesoKg: number, fator = 1): number {
  if (!exercicio || exercicio.unidade === 'corporal') return 0;
  const fracao = CARGA_DE_PARTIDA[exercicio.id];
  if (!fracao || !(pesoKg > 0)) return 0;
  const incremento = exercicio.incrementoKg > 0 ? exercicio.incrementoKg : 2.5;
  return Math.max(incremento, arredondarParaAnilha(pesoKg * fracao * fator, incremento));
}

/** O plano é válido para o app? (veio do banco: pode ter sido escrito por outra versão do app) */
export function planoValido(valor: unknown): valor is Plano {
  const p = valor as Plano | null;
  return (
    !!p &&
    Array.isArray(p.dias) &&
    Array.isArray(p.treinos) &&
    p.treinos.length > 0 &&
    p.treinos.every(
      (t) =>
        typeof t?.id === 'string' &&
        typeof t?.nome === 'string' &&
        Array.isArray(t?.itens) &&
        t.itens.every((i) => typeof i?.exercicioId === 'string' && i.series > 0 && i.faixa?.max >= i.faixa?.min),
    )
  );
}
