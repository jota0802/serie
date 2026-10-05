import { alternativas } from '@/domain/troca';
import type { Exercicio, GrupoMuscular, PadraoDeMovimento } from '@/domain/types';

/**
 * Catálogo do MVP — lista fechada, cobrindo os 7 padrões de movimento.
 *
 * Fechada de propósito: "cadastrar exercício" é o risco de virar trabalho braçal
 * infinito (ver `docs/escopo.md` §5). Quem precisar de algo fora daqui usa "outro".
 *
 * O campo `padrao` é o que faz a `CAR-9` funcionar: aparelho ocupado, o app oferece
 * as outras variações do MESMO padrão e leva o histórico junto.
 */

/** 2,5 kg superior · 5 kg inferior · 2 kg unilateral. Academia tem anilha, não tem %. */
const SUPERIOR = 2.5;
const INFERIOR = 5;
const UNILATERAL = 2;

type Entrada = Omit<Exercicio, 'descansoSegundos'> & { descansoSegundos?: number };

const definir = (e: Entrada): Exercicio => ({
  ...e,
  // CAR-6: 90 s composto · 60 s isolado, editável por exercício.
  descansoSegundos: e.descansoSegundos ?? (e.composto ? 90 : 60),
});

export const EXERCICIOS: readonly Exercicio[] = [
  // ---- empurrar horizontal -------------------------------------------------
  definir({ id: 'supino-reto-barra', nome: 'Supino reto com barra', nomeCurto: 'Supino reto', padrao: 'empurrar-horizontal', grupo: 'peito', incrementoKg: SUPERIOR, composto: true, unilateral: false, equipamento: 'barra', unidade: 'kg' }),
  definir({ id: 'supino-inclinado-barra', nome: 'Supino inclinado com barra', nomeCurto: 'Inclinado barra', padrao: 'empurrar-horizontal', grupo: 'peito', incrementoKg: SUPERIOR, composto: true, unilateral: false, equipamento: 'barra', unidade: 'kg' }),
  definir({ id: 'supino-reto-halter', nome: 'Supino reto com halteres', nomeCurto: 'Supino reto halter', padrao: 'empurrar-horizontal', grupo: 'peito', incrementoKg: UNILATERAL, composto: true, unilateral: true, equipamento: 'halteres', unidade: 'kg' }),
  definir({ id: 'supino-inclinado-halter', nome: 'Supino inclinado com halteres', nomeCurto: 'Supino inclinado', padrao: 'empurrar-horizontal', grupo: 'peito', incrementoKg: UNILATERAL, composto: true, unilateral: true, equipamento: 'halteres', unidade: 'kg' }),
  definir({ id: 'supino-maquina', nome: 'Supino na máquina', padrao: 'empurrar-horizontal', grupo: 'peito', incrementoKg: SUPERIOR, composto: true, unilateral: false, equipamento: 'maquina', unidade: 'kg' }),
  definir({ id: 'crossover', nome: 'Crossover', nomeCurto: 'Crucifixo na polia', padrao: 'empurrar-horizontal', grupo: 'peito', incrementoKg: SUPERIOR, composto: false, unilateral: false, equipamento: 'polia', unidade: 'kg' }),
  definir({ id: 'flexao', nome: 'Flexão de braço', padrao: 'empurrar-horizontal', grupo: 'peito', incrementoKg: 0, composto: true, unilateral: false, equipamento: 'corporal', unidade: 'corporal' }),

  // ---- empurrar vertical ---------------------------------------------------
  definir({ id: 'desenvolvimento-barra', nome: 'Desenvolvimento com barra', nomeCurto: 'Desenvolvimento', padrao: 'empurrar-vertical', grupo: 'ombro', incrementoKg: SUPERIOR, composto: true, unilateral: false, equipamento: 'barra', unidade: 'kg' }),
  definir({ id: 'desenvolvimento-halter', nome: 'Desenvolvimento com halteres', nomeCurto: 'Desenvolvimento halter', padrao: 'empurrar-vertical', grupo: 'ombro', incrementoKg: UNILATERAL, composto: true, unilateral: true, equipamento: 'halteres', unidade: 'kg' }),
  definir({ id: 'desenvolvimento-maquina', nome: 'Desenvolvimento na máquina', padrao: 'empurrar-vertical', grupo: 'ombro', incrementoKg: SUPERIOR, composto: true, unilateral: false, equipamento: 'maquina', unidade: 'kg' }),
  definir({ id: 'paralelas', nome: 'Paralelas', padrao: 'empurrar-vertical', grupo: 'triceps', incrementoKg: SUPERIOR, composto: true, unilateral: false, equipamento: 'corporal', unidade: 'corporal' }),

  // ---- puxar horizontal ----------------------------------------------------
  definir({ id: 'remada-curvada', nome: 'Remada curvada', padrao: 'puxar-horizontal', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, equipamento: 'barra', unidade: 'kg' }),
  definir({ id: 'remada-baixa', nome: 'Remada baixa', padrao: 'puxar-horizontal', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, equipamento: 'polia', unidade: 'kg' }),
  definir({ id: 'remada-cavalinho', nome: 'Remada cavalinho', padrao: 'puxar-horizontal', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, equipamento: 'barra', unidade: 'kg' }),
  definir({ id: 'remada-unilateral', nome: 'Remada unilateral com halter', nomeCurto: 'Remada unilateral', padrao: 'puxar-horizontal', grupo: 'costas', incrementoKg: UNILATERAL, composto: true, unilateral: true, equipamento: 'halteres', unidade: 'kg' }),
  definir({ id: 'remada-maquina', nome: 'Remada na máquina', padrao: 'puxar-horizontal', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, equipamento: 'maquina', unidade: 'kg' }),

  // ---- puxar vertical ------------------------------------------------------
  definir({ id: 'barra-fixa', nome: 'Barra fixa', padrao: 'puxar-vertical', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, equipamento: 'corporal', unidade: 'corporal' }),
  definir({ id: 'puxada-frente', nome: 'Puxada na frente', padrao: 'puxar-vertical', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, equipamento: 'polia', unidade: 'kg' }),
  definir({ id: 'puxada-supinada', nome: 'Puxada supinada', padrao: 'puxar-vertical', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, equipamento: 'polia', unidade: 'kg' }),
  definir({ id: 'pulldown', nome: 'Pulldown na polia', padrao: 'puxar-vertical', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, equipamento: 'polia', unidade: 'kg' }),

  // ---- agachar -------------------------------------------------------------
  definir({ id: 'agachamento-livre', nome: 'Agachamento livre', nomeCurto: 'Agachamento', padrao: 'agachar', grupo: 'quadriceps', incrementoKg: INFERIOR, composto: true, unilateral: false, equipamento: 'barra', unidade: 'kg' }),
  definir({ id: 'agachamento-smith', nome: 'Agachamento no Smith', padrao: 'agachar', grupo: 'quadriceps', incrementoKg: INFERIOR, composto: true, unilateral: false, equipamento: 'maquina', unidade: 'kg' }),
  // ⚠️ CAR-9.1: leg press carrega ~2,5× o agachamento (160 kg no plano ↔ 70 kg na barra).
  // Com o fator genérico de máquina, a troca sugeria 160 kg no Smith e 58 kg por mão no búlgaro.
  definir({ id: 'leg-press', nome: 'Leg press 45°', padrao: 'agachar', grupo: 'quadriceps', incrementoKg: INFERIOR, composto: true, unilateral: false, equipamento: 'maquina', fatorDeCarga: 2.5, unidade: 'kg' }),
  definir({ id: 'hack', nome: 'Hack machine', padrao: 'agachar', grupo: 'quadriceps', incrementoKg: INFERIOR, composto: true, unilateral: false, equipamento: 'maquina', unidade: 'kg' }),
  // Uma perna só: o halter por mão fica bem abaixo dos 0,4 de um movimento com as duas.
  definir({ id: 'bulgaro', nome: 'Agachamento búlgaro', padrao: 'agachar', grupo: 'quadriceps', incrementoKg: UNILATERAL, composto: true, unilateral: true, equipamento: 'halteres', fatorDeCarga: 0.25, unidade: 'kg' }),

  // ---- articular quadril ---------------------------------------------------
  definir({ id: 'levantamento-terra', nome: 'Levantamento terra', nomeCurto: 'Terra', padrao: 'articular-quadril', grupo: 'posterior', incrementoKg: INFERIOR, composto: true, unilateral: false, equipamento: 'barra', unidade: 'kg' }),
  definir({ id: 'terra-romeno', nome: 'Terra romeno', padrao: 'articular-quadril', grupo: 'posterior', incrementoKg: INFERIOR, composto: true, unilateral: false, equipamento: 'barra', unidade: 'kg' }),
  definir({ id: 'stiff', nome: 'Stiff', padrao: 'articular-quadril', grupo: 'posterior', incrementoKg: INFERIOR, composto: true, unilateral: false, equipamento: 'barra', unidade: 'kg' }),
  definir({ id: 'elevacao-pelvica', nome: 'Elevação pélvica', padrao: 'articular-quadril', grupo: 'gluteo', incrementoKg: INFERIOR, composto: true, unilateral: false, equipamento: 'barra', unidade: 'kg' }),

  // ---- isolado -------------------------------------------------------------
  definir({ id: 'rosca-direta', nome: 'Rosca direta', padrao: 'isolado', grupo: 'biceps', incrementoKg: SUPERIOR, composto: false, unilateral: false, equipamento: 'barra', unidade: 'kg' }),
  definir({ id: 'rosca-alternada', nome: 'Rosca alternada', nomeCurto: 'Rosca alternada', padrao: 'isolado', grupo: 'biceps', incrementoKg: UNILATERAL, composto: false, unilateral: true, equipamento: 'halteres', unidade: 'kg' }),
  definir({ id: 'rosca-martelo', nome: 'Rosca martelo', padrao: 'isolado', grupo: 'biceps', incrementoKg: UNILATERAL, composto: false, unilateral: true, equipamento: 'halteres', unidade: 'kg' }),
  definir({ id: 'rosca-scott', nome: 'Rosca scott', padrao: 'isolado', grupo: 'biceps', incrementoKg: SUPERIOR, composto: false, unilateral: false, equipamento: 'barra', unidade: 'kg' }),
  definir({ id: 'triceps-testa', nome: 'Tríceps testa', nomeCurto: 'Tríceps testa', padrao: 'isolado', grupo: 'triceps', incrementoKg: SUPERIOR, composto: false, unilateral: false, equipamento: 'barra', unidade: 'kg' }),
  definir({ id: 'triceps-corda', nome: 'Tríceps corda', nomeCurto: 'Tríceps na polia', padrao: 'isolado', grupo: 'triceps', incrementoKg: SUPERIOR, composto: false, unilateral: false, equipamento: 'polia', unidade: 'kg' }),
  // Um halter só, nas duas mãos: a carga é a total, não "por mão" (o 0,4 dava 35 kg na testa).
  definir({ id: 'triceps-frances', nome: 'Tríceps francês', nomeCurto: 'Tríceps francês', padrao: 'isolado', grupo: 'triceps', incrementoKg: SUPERIOR, composto: false, unilateral: false, equipamento: 'halteres', fatorDeCarga: 0.8, unidade: 'kg' }),
  definir({ id: 'elevacao-lateral', nome: 'Elevação lateral', padrao: 'isolado', grupo: 'ombro', incrementoKg: UNILATERAL, composto: false, unilateral: true, equipamento: 'halteres', unidade: 'kg' }),
  definir({ id: 'crucifixo-inverso', nome: 'Crucifixo inverso', padrao: 'isolado', grupo: 'ombro', incrementoKg: UNILATERAL, composto: false, unilateral: true, equipamento: 'halteres', unidade: 'kg' }),
  // ⚠️ Abdução não é articular o quadril (dobradiça): estava em `articular-quadril` e a
  // CAR-9 oferecia a cadeira no lugar da elevação pélvica. É isolado de glúteo.
  definir({ id: 'cadeira-abdutora', nome: 'Cadeira abdutora', padrao: 'isolado', grupo: 'gluteo', incrementoKg: SUPERIOR, composto: false, unilateral: false, equipamento: 'maquina', unidade: 'kg' }),
  definir({ id: 'cadeira-extensora', nome: 'Cadeira extensora', padrao: 'isolado', grupo: 'quadriceps', incrementoKg: SUPERIOR, composto: false, unilateral: false, equipamento: 'maquina', unidade: 'kg' }),
  definir({ id: 'mesa-flexora', nome: 'Mesa flexora', padrao: 'isolado', grupo: 'posterior', incrementoKg: SUPERIOR, composto: false, unilateral: false, equipamento: 'maquina', unidade: 'kg' }),
  definir({ id: 'panturrilha-pe', nome: 'Panturrilha em pé', padrao: 'isolado', grupo: 'panturrilha', incrementoKg: INFERIOR, composto: false, unilateral: false, equipamento: 'maquina', unidade: 'kg' }),
  definir({ id: 'panturrilha-sentado', nome: 'Panturrilha sentado', padrao: 'isolado', grupo: 'panturrilha', incrementoKg: SUPERIOR, composto: false, unilateral: false, equipamento: 'maquina', unidade: 'kg' }),
  definir({ id: 'abdominal-infra', nome: 'Abdominal infra', padrao: 'isolado', grupo: 'core', incrementoKg: 0, composto: false, unilateral: false, equipamento: 'corporal', unidade: 'corporal' }),
  definir({ id: 'prancha', nome: 'Prancha', padrao: 'isolado', grupo: 'core', incrementoKg: 0, composto: false, unilateral: false, equipamento: 'corporal', unidade: 'corporal' }),
] as const;

/** Índice por id — o formato que `volumeSemanal` espera. */
export const EXERCICIOS_POR_ID: ReadonlyMap<string, Exercicio> = new Map(
  EXERCICIOS.map((e) => [e.id, e]),
);

/**
 * `CAR-9` — as alternativas para quando o aparelho está ocupado.
 * A regra (mesmo padrão, mesmo grupo, composto não vira isolado) mora em
 * `src/domain/troca.ts`, pura e testada; aqui só se aplica ao catálogo.
 */
export function alternativasDoMesmoPadrao(exercicioId: string): Exercicio[] {
  const alvo = EXERCICIOS_POR_ID.get(exercicioId);
  return alvo ? alternativas(alvo, EXERCICIOS) : [];
}

/** Como o padrão aparece em tela ("Trocar não zera seu histórico de empurrar horizontal"). */
export const NOME_DO_PADRAO: Record<PadraoDeMovimento, string> = {
  'empurrar-horizontal': 'empurrar horizontal',
  'empurrar-vertical': 'empurrar vertical',
  'puxar-horizontal': 'puxar horizontal',
  'puxar-vertical': 'puxar vertical',
  agachar: 'agachar',
  'articular-quadril': 'articular quadril',
  isolado: 'isolado',
};

export const NOME_DO_GRUPO: Record<GrupoMuscular, string> = {
  peito: 'peito', costas: 'costas', ombro: 'ombro', biceps: 'bíceps', triceps: 'tríceps',
  quadriceps: 'quadríceps', posterior: 'posterior de coxa', gluteo: 'glúteo',
  panturrilha: 'panturrilha', core: 'core',
};

/** O nome que cabe numa linha onde o alvo divide a largura. */
export function nomeCurtoDe(exercicio: Exercicio | undefined, id?: string): string {
  return exercicio?.nomeCurto ?? exercicio?.nome ?? id ?? '';
}
