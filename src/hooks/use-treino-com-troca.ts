import { useMemo } from 'react';

import { EXERCICIOS_POR_ID } from '@/data/exercicios';
import { TREINOS } from '@/data/treinos';
import type { Exercicio, ItemDeTreino, SerieRegistrada, Treino } from '@/domain';
import type { SessaoFechada } from '@/domain/historico';
import { ajustarEstimativa, alvosDaTroca, type AlvosDaTroca } from '@/domain/troca';
import { useHistorico } from '@/estado/historico';
import { itemDaSessao, useSessao, useTreinoEmAndamento, type Sessao } from '@/estado/sessao';

/**
 * `CAR-9.1` com o catálogo e os treinos do app: os alvos de hoje se o item ORIGINAL do
 * plano for trocado por `novoId`. Usado pela 16 (a sugestão de cada alternativa), pela 15
 * e pela sessão em andamento (abaixo). `anteriores` = histórico SEM a sessão aberta.
 */
export function alvosSeTrocar(
  original: ItemDeTreino,
  novoId: string,
  anteriores: readonly SessaoFechada[],
  registradasHoje: readonly SerieRegistrada[] = [],
): AlvosDaTroca | null {
  const novo = EXERCICIOS_POR_ID.get(novoId);
  if (!novo) return null;
  return alvosDaTroca({ item: original, novo, porId: EXERCICIOS_POR_ID, anteriores, registradasHoje, planos: TREINOS });
}

/** Mesma convenção de id de `ProvedorDeSessao`: a sessão aberta não se compara consigo. */
export function anterioresA(sessoes: readonly SessaoFechada[], sessao: Pick<Sessao, 'inicioMs'>): SessaoFechada[] {
  return sessoes.filter((s) => s.id !== `sessao-${sessao.inicioMs}`);
}

/** Os exercícios dos OUTROS itens do treino nesta sessão, já trocados — a 16 não os oferece. */
export function ocupadosNaSessao(treino: Treino, sessao: Sessao): Set<string> {
  const ocupados = new Set<string>();
  treino.itens.forEach((_, j) => {
    const id = j === sessao.indiceExercicio ? undefined : itemDaSessao(treino, sessao, j)?.exercicioId;
    if (id) ocupados.add(id);
  });
  return ocupados;
}

/**
 * `useTreinoEmAndamento` com a CAR-9.1 aplicada: depois de uma troca, o alvo não herda
 * a carga do outro aparelho. As telas 11, 12 e 13 leem daqui — a 13 pré-preenche o campo
 * com este alvo, então é aqui que se decide o que entra no histórico da variação.
 * ⚠️ Fica por fora de `src/estado/sessao.tsx` (outra frente); o ideal é o próprio
 * `useTreinoEmAndamento` chamar `alvosSeTrocar` — aí este hook vira repasse.
 */
export function useTreinoComTroca() {
  const treino = useTreinoEmAndamento();
  const { sessao } = useSessao();
  const { sessoes } = useHistorico();

  return useMemo(() => {
    if (!treino) return null;
    const semTroca = { ...treino, baseDaEstimativa: undefined as Exercicio | undefined, semReferencia: false };
    const original = sessao ? treino.treino.itens[sessao.indiceExercicio] : undefined;
    if (!sessao || !treino.item || !original || original.exercicioId === treino.item.exercicioId) return semTroca;

    const troca = alvosSeTrocar(original, treino.item.exercicioId, anterioresA(sessoes, sessao), sessao.registradas);
    if (!troca) return semTroca;
    const alvos = ajustarEstimativa(troca.alvos, treino.feitasDoExercicio);
    // Da 2ª série em diante a carga já é a que você usou: a "base" e o "sem referência" saem de cena.
    const primeiraSerie = treino.feitasDoExercicio.length === 0;
    return {
      ...treino,
      alvos,
      alvo: alvos[sessao.indiceSerie] ?? alvos[0],
      baseDaEstimativa: primeiraSerie ? troca.base : undefined,
      semReferencia: primeiraSerie && troca.semReferencia,
    };
  }, [treino, sessao, sessoes]);
}
