/**
 * Modelo de domínio da Série.
 *
 * Vocabulário canônico — nome trocado no meio do caminho custa refactor e bug de
 * interpretação. A definição de cada termo está em `docs/escopo.md` e `docs/regras.md`.
 */

/**
 * A família do movimento. É o que faz a `CAR-9` funcionar: sem isso, trocar de
 * aparelho zera o seu histórico e o app vira inútil em academia cheia.
 */
export type PadraoDeMovimento =
  | 'empurrar-horizontal'
  | 'empurrar-vertical'
  | 'puxar-horizontal'
  | 'puxar-vertical'
  | 'agachar'
  | 'articular-quadril'
  | 'isolado';

export type GrupoMuscular =
  | 'peito' | 'costas' | 'ombro' | 'biceps' | 'triceps'
  | 'quadriceps' | 'posterior' | 'gluteo' | 'panturrilha' | 'core';

/** O movimento. "Supino reto". */
export interface Exercicio {
  id: string;
  nome: string;
  /** Nome enxuto para linha apertada, onde o alvo divide a largura. Cai no `nome` se faltar. */
  nomeCurto?: string;
  padrao: PadraoDeMovimento;
  grupo: GrupoMuscular;
  /** Quanto a carga sobe de uma vez. Academia tem anilha de 2,5 kg, não de 3,7%. */
  incrementoKg: number;
  composto: boolean;
  unilateral: boolean;
  unidade: 'kg' | 'corporal';
  /** Descanso padrão em segundos. 90 s composto · 60 s isolado (CAR-6). */
  descansoSegundos: number;
}

/** O intervalo de repetições alvo. Entrada da dupla progressão. */
export interface Faixa {
  min: number;
  max: number;
}

/** Uma linha do treino: o que o plano prescreve. */
export interface ItemDeTreino {
  exercicioId: string;
  series: number;
  faixa: Faixa;
  cargaKg: number;
  descansoSegundos?: number;
}

/** A letra: A, B, C. Lista ordenada de itens. */
export interface Treino {
  id: string;
  nome: string;
  ordem: number;
  itens: ItemDeTreino[];
}

/** Uma entrada: reps × carga. A unidade do app, e o nome dele. */
export interface SerieRegistrada {
  exercicioId: string;
  /** Índice da série dentro do exercício, base 0. */
  indice: number;
  reps: number;
  cargaKg: number;
  /** Se o usuário confirmou o alvo sem corrigir. É como o app mede se está calibrado. */
  foiAlvo: boolean;
  /** Duração da série em segundos — habilita tempo sob tensão (CAR-11.1). */
  duracaoSegundos?: number;
}

/** A execução concreta de um treino num dia. */
export interface Sessao {
  id: string;
  treinoId: string;
  inicio: string;
  fim?: string;
  /** Sem estado, você sai do app para atender o telefone e volta para a tela vazia (CAR-8). */
  estado: 'aberta' | 'fechada' | 'abandonada';
  series: SerieRegistrada[];
}

/** O que o app propõe para a série de hoje. Vem da CAR-1. */
export interface Alvo {
  cargaKg: number;
  reps: number;
  /**
   * Por que este alvo. `estimado` é a `CAR-9.1`: na primeira vez numa variação
   * nova, a carga é palpite — e o app declara isso em vez de inventar precisão.
   */
  origem: 'progressao' | 'repetir' | 'deload' | 'estimado' | 'inicial';
}
