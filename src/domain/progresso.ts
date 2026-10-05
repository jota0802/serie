import { umRepMaximo } from './forca';
import { ordenarPorFim, type SessaoFechada } from './historico';
import { classificarVolume, type VolumeDoGrupo } from './volume';
import type { Exercicio, GrupoMuscular, SerieRegistrada, Treino } from './types';

/**
 * O que as telas de apoio (17 Meus treinos, 20 Progresso) derivam do histórico.
 *
 * Mesma regra de `historico.ts`: nada é guardado à parte, tudo sai das sessões fechadas.
 * Funções puras com o relógio como parâmetro — os testes passam um `agoraMs` fixo.
 */

const DIA_MS = 24 * 60 * 60 * 1000;
export const SEMANA_MS = 7 * DIA_MS;

/** Dias de CALENDÁRIO entre dois instantes, no fuso do aparelho: 23:50 → 00:10 já é "ontem". */
export function diasEntre(deMs: number, ateMs: number): number {
  const de = new Date(deMs);
  de.setHours(0, 0, 0, 0);
  const ate = new Date(ateMs);
  ate.setHours(0, 0, 0, 0);
  // Math.round absorve a hora a mais/a menos do horário de verão.
  return Math.round((ate.getTime() - de.getTime()) / DIA_MS);
}

/** "hoje" · "ontem" · "há 4 dias" · "há 2 meses". */
export function dataRelativa(fimMs: number, agoraMs: number): string {
  const dias = Math.max(0, diasEntre(fimMs, agoraMs));
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? 'há 1 mês' : `há ${meses} meses`;
}

/** A sessão mais recente da letra. `undefined` se a letra nunca foi treinada. */
export function ultimaSessaoDe(sessoes: readonly SessaoFechada[], treinoId: string): SessaoFechada | undefined {
  return ordenarPorFim(sessoes).find((s) => s.treinoId === treinoId);
}

export interface Frequencia {
  /** Treinos por semana no período: `total / semanas`, a mesma conta que a tela escreve. */
  media: number;
  total: number;
  /** Semanas inteiras que entraram na conta (pode ser menos que o pedido — ver abaixo). */
  semanas: number;
  /** Início da janela contada. A tela filtra por aqui as séries da "série média". */
  desdeMs: number;
}

/**
 * Treinos por semana nas últimas `semanas` semanas (Infinity = o histórico inteiro).
 *
 * ⚠️ O período é cortado no tamanho do histórico: quem começou há 2 semanas e pediu
 * "4 semanas" teria a média dividida por semanas que ainda nem existiam — e o app
 * diria que a pessoa treina metade do que treina.
 *
 * ⚠️ E o tamanho do histórico vai para a semana MAIS PRÓXIMA, não para cima: a fábrica
 * nasce no carregamento e a tela lê o relógio depois, então os 14 dias dela chegam como
 * 14 dias e uns segundos. Com `Math.ceil` isso eram 3 semanas, e a tela dizia 2,3 em vez
 * de 3,5.
 */
export function frequenciaSemanal(
  sessoes: readonly SessaoFechada[], agoraMs: number, semanas: number,
): Frequencia {
  const passadas = sessoes.filter((s) => s.fimMs <= agoraMs);
  if (passadas.length === 0) return { media: 0, total: 0, semanas: 1, desdeMs: agoraMs - SEMANA_MS };
  const primeira = Math.min(...passadas.map((s) => s.fimMs));

  if (agoraMs - primeira <= semanas * SEMANA_MS) {
    // Histórico mais curto que o período: entram TODAS as sessões (senão "Tudo" deixaria
    // a primeira de fora). Mínimo de 1 semana: dois treinos em três dias não são 4,7/semana.
    const n = Math.max(1, Math.round((agoraMs - primeira) / SEMANA_MS));
    return { media: passadas.length / n, total: passadas.length, semanas: n, desdeMs: primeira };
  }

  const desdeMs = agoraMs - semanas * SEMANA_MS;
  const total = passadas.filter((s) => s.fimMs >= desdeMs).length;
  return { media: total / semanas, total, semanas, desdeMs };
}

/**
 * As séries dos últimos `dias` dias — a entrada do `CAR-4` na tela de Progresso.
 *
 * ⚠️ Janela MÓVEL de 7 dias, não "domingo até agora": no domingo de manhã a semana de
 * calendário está vazia, e o gráfico que responde "o que estou negligenciando?" diria
 * que você negligencia TUDO bem no dia em que planeja a semana.
 */
export function seriesDosUltimosDias(
  sessoes: readonly SessaoFechada[], agoraMs: number, dias = 7,
): SerieRegistrada[] {
  const inicio = agoraMs - dias * DIA_MS;
  return sessoes.filter((s) => s.fimMs >= inicio && s.fimMs <= agoraMs).flatMap((s) => s.series);
}

/** Os grupos musculares que o plano treina, na ordem em que aparecem. */
export function gruposDoPlano(
  treinos: readonly Treino[], exercicios: ReadonlyMap<string, Exercicio>,
): GrupoMuscular[] {
  const grupos: GrupoMuscular[] = [];
  for (const t of treinos) {
    for (const item of t.itens) {
      const grupo = exercicios.get(item.exercicioId)?.grupo;
      if (grupo && !grupos.includes(grupo)) grupos.push(grupo);
    }
  }
  return grupos;
}

/**
 * `volumeSemanal` só devolve grupo que teve série. Mas o grupo do plano com ZERO séries
 * é justamente o mais negligenciado — some do gráfico, e a pergunta do `CAR-4` fica sem
 * resposta. Aqui ele volta, com 0 e estado `abaixo`.
 */
export function completarGrupos(volume: readonly VolumeDoGrupo[], grupos: readonly GrupoMuscular[]): VolumeDoGrupo[] {
  const faltando = grupos
    .filter((g) => !volume.some((v) => v.grupo === g))
    .map((grupo) => ({ grupo, series: 0, estado: classificarVolume(0) }));
  return [...volume, ...faltando].sort((a, b) => b.series - a.series);
}

/** O grupo mais abaixo da faixa (`CAR-4`). `undefined` se ninguém está abaixo. */
export function maisNegligenciado(volume: readonly VolumeDoGrupo[]): VolumeDoGrupo | undefined {
  return volume
    .filter((v) => v.estado === 'abaixo')
    .reduce<VolumeDoGrupo | undefined>((pior, v) => (!pior || v.series < pior.series ? v : pior), undefined);
}

/** A letra que mais séries prescreve para o grupo — é onde mexer para arrumar. */
export function treinoQueTrabalha(
  grupo: GrupoMuscular, treinos: readonly Treino[], exercicios: ReadonlyMap<string, Exercicio>,
): Treino | undefined {
  let melhor: Treino | undefined;
  let maximo = 0;
  for (const t of treinos) {
    const series = t.itens
      .filter((i) => exercicios.get(i.exercicioId)?.grupo === grupo)
      .reduce((soma, i) => soma + i.series, 0);
    if (series > maximo) {
      maximo = series;
      melhor = t;
    }
  }
  return melhor;
}

export interface Recorde {
  exercicioId: string;
  /** 1RM estimado (`CAR-5`) — o mesmo número de `recordeDe`. */
  kg: number;
  /** Quando foi batido. */
  fimMs: number;
  /**
   * Superou um recorde anterior E foi na última vez que o exercício apareceu. É o único
   * caso que acende o ouro: recorde antigo é informação, não conquista de agora.
   */
  novo: boolean;
}

/** Recordes por exercício, os batidos mais recentemente primeiro. Peso corporal (1RM 0) fica de fora. */
export function recordesRecentes(sessoes: readonly SessaoFechada[], limite = 5): Recorde[] {
  const porExercicio = new Map<string, Recorde & { ultimaVezMs: number }>();
  const cronologica = [...sessoes].sort((a, b) => a.fimMs - b.fimMs);

  for (const sessao of cronologica) {
    for (const s of sessao.series) {
      const atual = porExercicio.get(s.exercicioId);
      const rm = umRepMaximo(s.cargaKg, s.reps);
      if (!atual) {
        porExercicio.set(s.exercicioId, { exercicioId: s.exercicioId, kg: rm, fimMs: sessao.fimMs, novo: false, ultimaVezMs: sessao.fimMs });
        continue;
      }
      atual.ultimaVezMs = sessao.fimMs;
      // Estritamente maior: igualar o recorde não é bater (mesma régua de `bateuRecorde`).
      if (rm > atual.kg) {
        // Superou algo só se havia um recorde de outra sessão antes desta.
        const superou = atual.kg > 0 && atual.fimMs < sessao.fimMs;
        atual.novo = superou || (atual.novo && atual.fimMs === sessao.fimMs);
        atual.kg = rm;
        atual.fimMs = sessao.fimMs;
      }
    }
  }

  return [...porExercicio.values()]
    .filter((r) => r.kg > 0)
    .map(({ ultimaVezMs, ...r }) => ({ ...r, novo: r.novo && r.fimMs === ultimaVezMs }))
    .sort((a, b) => b.fimMs - a.fimMs || b.kg - a.kg)
    .slice(0, limite);
}
