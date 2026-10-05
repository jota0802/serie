import { router, useIsFocused, useNavigation } from 'expo-router';
import { useEffect } from 'react';

import { useHistorico } from '@/estado/historico';
import { useSessao, useTreinoEmAndamento } from '@/estado/sessao';

/**
 * A porta das telas de `/treino/*` — `CAR-8`.
 *
 * Antes, sem sessão as telas devolviam `null`: recarregar a aba no meio do treino dava tela
 * preta sem saída. Agora:
 *  - enquanto o AsyncStorage não respondeu, a sessão E o histórico → `false` (a tela mostra
 *    só o `Fundo`, não preto). O histórico porque os alvos saem dele (a última vez), e o
 *    Descanso congela o alvo no `useState` inicial: sem esperar, nascia o alvo sem passado;
 *  - não há sessão (recarregou sem nada salvo, ou ela venceu as 6 h com o app aberto) → Hoje;
 *  - o treino já terminou e a tela é de treino → vai para o Resumo (e o contrário).
 *
 * ⚠️ Só redireciona a tela FOCADA. Treino ativo fica montado embaixo da execução e do
 * descanso; se ela também reagisse, um `replace` trocaria a tela errada da pilha. E o
 * "Fechar" do resumo zera a sessão no mesmo toque em que navega — a tela que está saindo
 * não pode mandar para o Hoje de novo.
 *
 * Devolve `true` quando a tela pode desenhar.
 */
export function useGuardaDaSessao(fase: 'treino' | 'resumo' = 'treino'): boolean {
  const { sessao, carregada } = useSessao();
  const { carregado: historicoCarregado } = useHistorico();
  const treino = useTreinoEmAndamento();
  const focada = useIsFocused();
  const navegacao = useNavigation();
  const pronto = carregada && historicoCarregado;

  let destino: '/hoje' | '/treino/resumo' | '/treino/ativo' | null = null;
  if (pronto) {
    if (!sessao || !treino) destino = '/hoje';
    else if (fase === 'treino' && treino.terminou) destino = '/treino/resumo';
    else if (fase === 'resumo' && !treino.terminou) destino = '/treino/ativo';
  }

  useEffect(() => {
    // `isFocused()` lê o estado da navegação AGORA; o `focada` do render pode estar um passo atrás.
    if (!destino || !focada || !navegacao.isFocused()) return;
    // O Hoje costuma JÁ estar na base da pilha (a sessão venceu no meio do treino): `replace`
    // empilharia um segundo. `dismissTo` volta até ele, e vira `replace` sozinho quando não
    // há Hoje na pilha (recarregou a aba direto em /treino/*).
    if (destino === '/hoje') router.dismissTo(destino);
    else router.replace(destino);
  }, [destino, focada, navegacao]);

  return pronto && destino === null;
}
