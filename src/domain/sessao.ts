import type { SessaoFechada } from './historico';
import type { Alvo, ItemDeTreino, SerieRegistrada, Treino } from './types';

/**
 * A sessão em andamento como dado puro: o formato que vai para o AsyncStorage (`CAR-8`)
 * e as transições que o provedor (`src/estado/sessao.tsx`) aplica sobre ele.
 *
 * Mora aqui, sem React, para o caminho crítico inteiro — começar, registrar todas as
 * séries, fechar — ser testável em Jest sem montar tela nenhuma.
 */

export interface SessaoEmAndamento {
  treinoId: string;
  inicioMs: number;
  /** Índice do exercício e da série dentro dele. */
  indiceExercicio: number;
  indiceSerie: number;
  registradas: SerieRegistrada[];
  /** Quando a série atual começou a ser cronometrada (`CAR-11`). */
  inicioSerieMs: number | null;
  /** Duração da série que acabou de ser encerrada — é o que a tela de descanso registra. */
  duracaoUltimaSerieS: number | null;
  /** Quando a última série do último exercício entrou. Nulo enquanto o treino corre. */
  fimMs: number | null;
  /**
   * `CAR-9` — aparelho ocupado: índice do item no treino → o exercício que entrou no lugar.
   * O plano não muda; só esta sessão.
   */
  trocas: Record<number, string>;
}

/** `CAR-8` — quanto tempo uma sessão aberta continua retomável. */
export const VALIDADE_DA_SESSAO_MS = 6 * 60 * 60 * 1000;

/**
 * `CAR-8` — a sessão passou das 6 h (contadas do início)? Vale para a que volta do disco E
 * para a que segue na memória: no Android o processo vive dias em segundo plano (e a aba do
 * navegador fica aberta), então conferir só ao abrir o app deixava o treino de ontem retomável.
 */
export function sessaoVencida(s: Pick<SessaoEmAndamento, 'inicioMs'>, agoraMs: number): boolean {
  return agoraMs - s.inicioMs > VALIDADE_DA_SESSAO_MS;
}

export function novaSessao(treinoId: string, agoraMs: number): SessaoEmAndamento {
  return {
    treinoId, inicioMs: agoraMs, indiceExercicio: 0, indiceSerie: 0,
    registradas: [], inicioSerieMs: null, duracaoUltimaSerieS: null, fimMs: null, trocas: {},
  };
}

/** O item do treino como ele está NESTA sessão, já com a troca de exercício aplicada. */
export function itemDaSessao(
  treino: Treino,
  sessao: Pick<SessaoEmAndamento, 'trocas'>,
  indice: number,
): ItemDeTreino | undefined {
  const item = treino.itens[indice];
  if (!item) return undefined;
  const trocado = sessao.trocas[indice];
  return trocado ? { ...item, exercicioId: trocado } : item;
}

/**
 * `foiAlvo` — o usuário confirmou o alvo sem corrigir nada? É como o app mede se a
 * `CAR-1` está calibrada. Sem alvo (não deveria acontecer) não dá para afirmar que foi.
 */
export function foiAlvo(reps: number, cargaKg: number, alvo: Pick<Alvo, 'reps' | 'cargaKg'> | undefined): boolean {
  return alvo != null && reps === alvo.reps && cargaKg === alvo.cargaKg;
}

/**
 * Registra a série atual e avança o cursor. Devolve a MESMA sessão se não há o que
 * registrar (treino desconhecido ou já terminado), para o React não re-renderizar à toa.
 */
export function registrarSerie(
  s: SessaoEmAndamento,
  treino: Treino,
  reps: number,
  cargaKg: number,
  alvo: Pick<Alvo, 'reps' | 'cargaKg'> | undefined,
  agoraMs: number,
): SessaoEmAndamento {
  const item = itemDaSessao(treino, s, s.indiceExercicio);
  if (!item || s.fimMs) return s;

  const registrada: SerieRegistrada = {
    exercicioId: item.exercicioId,
    indice: s.indiceSerie,
    reps,
    cargaKg,
    foiAlvo: foiAlvo(reps, cargaKg, alvo),
    duracaoSegundos: s.duracaoUltimaSerieS ?? undefined,
  };

  const ultimaSerie = s.indiceSerie + 1 >= item.series;
  const proximoExercicio = ultimaSerie ? s.indiceExercicio + 1 : s.indiceExercicio;
  const acabou = proximoExercicio >= treino.itens.length;
  return {
    ...s,
    registradas: [...s.registradas, registrada],
    indiceExercicio: proximoExercicio,
    indiceSerie: ultimaSerie ? 0 : s.indiceSerie + 1,
    duracaoUltimaSerieS: null,
    // Carimba o fim aqui, na hora do fato. O resumo não pode perguntar as horas
    // durante o render: função impura em render é bug esperando acontecer.
    fimMs: acabou ? agoraMs : s.fimMs,
  };
}

/** O id com que a sessão entra no histórico. Também serve para ela não se comparar consigo. */
export function idDaSessao(s: Pick<SessaoEmAndamento, 'inicioMs'>): string {
  return `sessao-${s.inicioMs}`;
}

/** A sessão terminada no formato do histórico. Nulo enquanto o treino corre. */
export function fecharSessao(s: SessaoEmAndamento): SessaoFechada | null {
  if (!s.fimMs) return null;
  return { id: idDaSessao(s), treinoId: s.treinoId, inicioMs: s.inicioMs, fimMs: s.fimMs, series: s.registradas };
}

/**
 * `CAR-11.2` — a duração da série anterior, que a Execução mostra como referência de ritmo.
 *
 * É a última série DESTA sessão que tem duração. Só na primeira série do treino, quando
 * ainda não há nenhuma, cai na última vez do exercício (o histórico).
 */
export function duracaoDaSerieAnterior(
  registradas: readonly SerieRegistrada[],
  ultimaVez: readonly SerieRegistrada[],
): number | undefined {
  if (registradas.length === 0) return ultimaVez[0]?.duracaoSegundos;
  for (let i = registradas.length - 1; i >= 0; i--) {
    const d = registradas[i].duracaoSegundos;
    if (d != null) return d;
  }
  return undefined;
}

/**
 * `CAR-8` — o que fazer com a sessão lida do disco ao abrir o app.
 *
 * Descarta (nulo) o que não serve: JSON corrompido, formato de outra versão, ou sessão
 * com mais de 6 h — essa não é mais "o treino de agora" e retomá-la seria sessão-fantasma.
 */
export function sessaoParaRestaurar(texto: string | null, agoraMs: number): SessaoEmAndamento | null {
  if (!texto) return null;
  let salva: unknown;
  try {
    salva = JSON.parse(texto);
  } catch {
    return null;
  }
  if (!salva || typeof salva !== 'object') return null;
  const s = salva as Partial<SessaoEmAndamento>;
  if (
    typeof s.treinoId !== 'string' || typeof s.inicioMs !== 'number' ||
    typeof s.indiceExercicio !== 'number' || typeof s.indiceSerie !== 'number' ||
    !Array.isArray(s.registradas)
  ) {
    return null;
  }
  const restaurada: SessaoEmAndamento = {
    treinoId: s.treinoId,
    inicioMs: s.inicioMs,
    indiceExercicio: s.indiceExercicio,
    indiceSerie: s.indiceSerie,
    registradas: s.registradas,
    inicioSerieMs: s.inicioSerieMs ?? null,
    duracaoUltimaSerieS: s.duracaoUltimaSerieS ?? null,
    fimMs: s.fimMs ?? null,
    trocas: s.trocas ?? {},
  };
  return sessaoVencida(restaurada, agoraMs) ? null : restaurada;
}
