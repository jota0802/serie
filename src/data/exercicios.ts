import type { Exercicio } from '@/domain/types';

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
  definir({ id: 'supino-reto-barra', nome: 'Supino reto com barra', padrao: 'empurrar-horizontal', grupo: 'peito', incrementoKg: SUPERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'supino-inclinado-barra', nome: 'Supino inclinado com barra', padrao: 'empurrar-horizontal', grupo: 'peito', incrementoKg: SUPERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'supino-reto-halter', nome: 'Supino reto com halteres', padrao: 'empurrar-horizontal', grupo: 'peito', incrementoKg: UNILATERAL, composto: true, unilateral: true, unidade: 'kg' }),
  definir({ id: 'supino-inclinado-halter', nome: 'Supino inclinado com halteres', padrao: 'empurrar-horizontal', grupo: 'peito', incrementoKg: UNILATERAL, composto: true, unilateral: true, unidade: 'kg' }),
  definir({ id: 'supino-maquina', nome: 'Supino na máquina', padrao: 'empurrar-horizontal', grupo: 'peito', incrementoKg: SUPERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'crossover', nome: 'Crossover', padrao: 'empurrar-horizontal', grupo: 'peito', incrementoKg: SUPERIOR, composto: false, unilateral: false, unidade: 'kg' }),
  definir({ id: 'flexao', nome: 'Flexão de braço', padrao: 'empurrar-horizontal', grupo: 'peito', incrementoKg: 0, composto: true, unilateral: false, unidade: 'corporal' }),

  // ---- empurrar vertical ---------------------------------------------------
  definir({ id: 'desenvolvimento-barra', nome: 'Desenvolvimento com barra', padrao: 'empurrar-vertical', grupo: 'ombro', incrementoKg: SUPERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'desenvolvimento-halter', nome: 'Desenvolvimento com halteres', padrao: 'empurrar-vertical', grupo: 'ombro', incrementoKg: UNILATERAL, composto: true, unilateral: true, unidade: 'kg' }),
  definir({ id: 'desenvolvimento-maquina', nome: 'Desenvolvimento na máquina', padrao: 'empurrar-vertical', grupo: 'ombro', incrementoKg: SUPERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'paralelas', nome: 'Paralelas', padrao: 'empurrar-vertical', grupo: 'triceps', incrementoKg: SUPERIOR, composto: true, unilateral: false, unidade: 'corporal' }),

  // ---- puxar horizontal ----------------------------------------------------
  definir({ id: 'remada-curvada', nome: 'Remada curvada', padrao: 'puxar-horizontal', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'remada-baixa', nome: 'Remada baixa', padrao: 'puxar-horizontal', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'remada-cavalinho', nome: 'Remada cavalinho', padrao: 'puxar-horizontal', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'remada-unilateral', nome: 'Remada unilateral com halter', padrao: 'puxar-horizontal', grupo: 'costas', incrementoKg: UNILATERAL, composto: true, unilateral: true, unidade: 'kg' }),
  definir({ id: 'remada-maquina', nome: 'Remada na máquina', padrao: 'puxar-horizontal', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, unidade: 'kg' }),

  // ---- puxar vertical ------------------------------------------------------
  definir({ id: 'barra-fixa', nome: 'Barra fixa', padrao: 'puxar-vertical', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, unidade: 'corporal' }),
  definir({ id: 'puxada-frente', nome: 'Puxada na frente', padrao: 'puxar-vertical', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'puxada-supinada', nome: 'Puxada supinada', padrao: 'puxar-vertical', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'pulldown', nome: 'Pulldown na polia', padrao: 'puxar-vertical', grupo: 'costas', incrementoKg: SUPERIOR, composto: true, unilateral: false, unidade: 'kg' }),

  // ---- agachar -------------------------------------------------------------
  definir({ id: 'agachamento-livre', nome: 'Agachamento livre', padrao: 'agachar', grupo: 'quadriceps', incrementoKg: INFERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'agachamento-smith', nome: 'Agachamento no Smith', padrao: 'agachar', grupo: 'quadriceps', incrementoKg: INFERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'leg-press', nome: 'Leg press 45°', padrao: 'agachar', grupo: 'quadriceps', incrementoKg: INFERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'hack', nome: 'Hack machine', padrao: 'agachar', grupo: 'quadriceps', incrementoKg: INFERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'bulgaro', nome: 'Agachamento búlgaro', padrao: 'agachar', grupo: 'quadriceps', incrementoKg: UNILATERAL, composto: true, unilateral: true, unidade: 'kg' }),

  // ---- articular quadril ---------------------------------------------------
  definir({ id: 'levantamento-terra', nome: 'Levantamento terra', padrao: 'articular-quadril', grupo: 'posterior', incrementoKg: INFERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'terra-romeno', nome: 'Terra romeno', padrao: 'articular-quadril', grupo: 'posterior', incrementoKg: INFERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'stiff', nome: 'Stiff', padrao: 'articular-quadril', grupo: 'posterior', incrementoKg: INFERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'elevacao-pelvica', nome: 'Elevação pélvica', padrao: 'articular-quadril', grupo: 'gluteo', incrementoKg: INFERIOR, composto: true, unilateral: false, unidade: 'kg' }),
  definir({ id: 'cadeira-abdutora', nome: 'Cadeira abdutora', padrao: 'articular-quadril', grupo: 'gluteo', incrementoKg: SUPERIOR, composto: false, unilateral: false, unidade: 'kg' }),

  // ---- isolado -------------------------------------------------------------
  definir({ id: 'rosca-direta', nome: 'Rosca direta', padrao: 'isolado', grupo: 'biceps', incrementoKg: SUPERIOR, composto: false, unilateral: false, unidade: 'kg' }),
  definir({ id: 'rosca-alternada', nome: 'Rosca alternada', padrao: 'isolado', grupo: 'biceps', incrementoKg: UNILATERAL, composto: false, unilateral: true, unidade: 'kg' }),
  definir({ id: 'rosca-martelo', nome: 'Rosca martelo', padrao: 'isolado', grupo: 'biceps', incrementoKg: UNILATERAL, composto: false, unilateral: true, unidade: 'kg' }),
  definir({ id: 'rosca-scott', nome: 'Rosca scott', padrao: 'isolado', grupo: 'biceps', incrementoKg: SUPERIOR, composto: false, unilateral: false, unidade: 'kg' }),
  definir({ id: 'triceps-testa', nome: 'Tríceps testa', padrao: 'isolado', grupo: 'triceps', incrementoKg: SUPERIOR, composto: false, unilateral: false, unidade: 'kg' }),
  definir({ id: 'triceps-corda', nome: 'Tríceps corda', padrao: 'isolado', grupo: 'triceps', incrementoKg: SUPERIOR, composto: false, unilateral: false, unidade: 'kg' }),
  definir({ id: 'triceps-frances', nome: 'Tríceps francês', padrao: 'isolado', grupo: 'triceps', incrementoKg: SUPERIOR, composto: false, unilateral: false, unidade: 'kg' }),
  definir({ id: 'elevacao-lateral', nome: 'Elevação lateral', padrao: 'isolado', grupo: 'ombro', incrementoKg: UNILATERAL, composto: false, unilateral: true, unidade: 'kg' }),
  definir({ id: 'crucifixo-inverso', nome: 'Crucifixo inverso', padrao: 'isolado', grupo: 'ombro', incrementoKg: UNILATERAL, composto: false, unilateral: true, unidade: 'kg' }),
  definir({ id: 'cadeira-extensora', nome: 'Cadeira extensora', padrao: 'isolado', grupo: 'quadriceps', incrementoKg: SUPERIOR, composto: false, unilateral: false, unidade: 'kg' }),
  definir({ id: 'mesa-flexora', nome: 'Mesa flexora', padrao: 'isolado', grupo: 'posterior', incrementoKg: SUPERIOR, composto: false, unilateral: false, unidade: 'kg' }),
  definir({ id: 'panturrilha-pe', nome: 'Panturrilha em pé', padrao: 'isolado', grupo: 'panturrilha', incrementoKg: INFERIOR, composto: false, unilateral: false, unidade: 'kg' }),
  definir({ id: 'panturrilha-sentado', nome: 'Panturrilha sentado', padrao: 'isolado', grupo: 'panturrilha', incrementoKg: SUPERIOR, composto: false, unilateral: false, unidade: 'kg' }),
  definir({ id: 'abdominal-infra', nome: 'Abdominal infra', padrao: 'isolado', grupo: 'core', incrementoKg: 0, composto: false, unilateral: false, unidade: 'corporal' }),
  definir({ id: 'prancha', nome: 'Prancha', padrao: 'isolado', grupo: 'core', incrementoKg: 0, composto: false, unilateral: false, unidade: 'corporal' }),
] as const;

/** Índice por id — o formato que `volumeSemanal` espera. */
export const EXERCICIOS_POR_ID: ReadonlyMap<string, Exercicio> = new Map(
  EXERCICIOS.map((e) => [e.id, e]),
);

/**
 * `CAR-9` — as alternativas para quando o aparelho está ocupado.
 * Mesmo padrão de movimento, e o histórico segue o padrão, não o aparelho.
 */
export function alternativasDoMesmoPadrao(exercicioId: string): Exercicio[] {
  const alvo = EXERCICIOS_POR_ID.get(exercicioId);
  if (!alvo) return [];
  return EXERCICIOS.filter((e) => e.padrao === alvo.padrao && e.id !== alvo.id);
}
