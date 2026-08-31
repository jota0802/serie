import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { EXERCICIOS_POR_ID } from '@/data/exercicios';
import { RECORDES, TONELAGEM_ANTERIOR, ULTIMA_SESSAO } from '@/data/historico';
import { TREINOS_POR_ID } from '@/data/treinos';
import { melhor1RM, proximoAlvo, tonelagem, type Alvo, type SerieRegistrada } from '@/domain';

/**
 * O estado da sessão em andamento.
 *
 * Vive em memória e é a fonte de verdade do caminho crítico
 * (11 Treino ativo → 12 Execução → 13 Descanso → 14 Resumo).
 *
 * ⚠️ `CAR-8` diz que a sessão fica retomável por 6 h — isso exige persistir em disco,
 * e entra junto com o AsyncStorage. Por enquanto a sessão vive só enquanto o app vive.
 */

export interface Sessao {
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
}

interface Contexto {
  sessao: Sessao | null;
  comecar: (treinoId: string) => void;
  iniciarSerie: () => void;
  /** Encerra o cronômetro da série e devolve quantos segundos ela durou. */
  encerrarSerie: () => number;
  registrar: (reps: number, cargaKg: number) => void;
  abandonar: () => void;
}

const SessaoContexto = createContext<Contexto | null>(null);

export function ProvedorDeSessao({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);

  const comecar = useCallback((treinoId: string) => {
    setSessao({
      treinoId, inicioMs: Date.now(), indiceExercicio: 0, indiceSerie: 0,
      registradas: [], inicioSerieMs: null, duracaoUltimaSerieS: null, fimMs: null,
    });
  }, []);

  const iniciarSerie = useCallback(() => {
    setSessao((s) => (s ? { ...s, inicioSerieMs: Date.now() } : s));
  }, []);

  const encerrarSerie = useCallback(() => {
    let duracao = 0;
    setSessao((s) => {
      if (!s) return s;
      duracao = s.inicioSerieMs ? Math.round((Date.now() - s.inicioSerieMs) / 1000) : 0;
      return { ...s, inicioSerieMs: null, duracaoUltimaSerieS: duracao };
    });
    return duracao;
  }, []);

  const registrar = useCallback((reps: number, cargaKg: number) => {
    setSessao((s) => {
      if (!s) return s;
      const treino = TREINOS_POR_ID.get(s.treinoId);
      const item = treino?.itens[s.indiceExercicio];
      if (!treino || !item) return s;

      const registrada: SerieRegistrada = {
        exercicioId: item.exercicioId,
        indice: s.indiceSerie,
        reps,
        cargaKg,
        // `foiAlvo` é como o app aprende se as sugestões estão calibradas.
        foiAlvo: true,
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
        fimMs: acabou ? Date.now() : s.fimMs,
      };
    });
  }, []);

  const abandonar = useCallback(() => setSessao(null), []);

  const valor = useMemo(
    () => ({ sessao, comecar, iniciarSerie, encerrarSerie, registrar, abandonar }),
    [sessao, comecar, iniciarSerie, encerrarSerie, registrar, abandonar],
  );
  return <SessaoContexto.Provider value={valor}>{children}</SessaoContexto.Provider>;
}

export function useSessao() {
  const ctx = useContext(SessaoContexto);
  if (!ctx) throw new Error('useSessao precisa estar dentro de <ProvedorDeSessao>');
  return ctx;
}

/**
 * Tudo que as telas do treino precisam saber, derivado da sessão.
 * Nada aqui é guardado: é sempre recalculado a partir das regras.
 */
export function useTreinoEmAndamento() {
  const { sessao } = useSessao();

  return useMemo(() => {
    if (!sessao) return null;
    const treino = TREINOS_POR_ID.get(sessao.treinoId);
    if (!treino) return null;

    const terminou = sessao.indiceExercicio >= treino.itens.length;
    const item = terminou ? undefined : treino.itens[sessao.indiceExercicio];
    const exercicio = item ? EXERCICIOS_POR_ID.get(item.exercicioId) : undefined;

    let alvos: Alvo[] = [];
    if (item) {
      alvos = proximoAlvo({
        ultimaSessao: ULTIMA_SESSAO[item.exercicioId] ?? [],
        faixa: item.faixa,
        cargaAtualKg: item.cargaKg,
        incrementoKg: exercicio?.incrementoKg ?? 2.5,
        series: item.series,
      });
    }

    const feitasDoExercicio = item
      ? sessao.registradas.filter((r) => r.exercicioId === item.exercicioId)
      : [];

    const proximoItem = treino.itens[sessao.indiceExercicio + 1];

    return {
      treino,
      item,
      exercicio,
      alvos,
      alvo: alvos[sessao.indiceSerie] ?? alvos[0],
      feitasDoExercicio,
      terminou,
      proximoExercicio: proximoItem ? EXERCICIOS_POR_ID.get(proximoItem.exercicioId) : undefined,
      /** Quanto do treino já foi, de 0 a 1 — alimenta a barra fina do topo. */
      progresso:
        sessao.registradas.length /
        Math.max(1, treino.itens.reduce((total, i) => total + i.series, 0)),
      tonelagem: tonelagem(sessao.registradas),
      tonelagemAnterior: TONELAGEM_ANTERIOR[sessao.treinoId] ?? 0,
      /** O recorde do exercício atual, para saber se a série que vem bate (`CAR-5`). */
      recordeDoExercicio: item ? (RECORDES[item.exercicioId] ?? 0) : 0,
      melhor1RMDaSessao: melhor1RM(sessao.registradas),
    };
  }, [sessao]);
}
