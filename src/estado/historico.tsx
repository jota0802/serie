import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { SessaoFechada } from '@/domain/historico';
import { useAuth } from '@/estado/auth';
import { useAoReconectar } from '@/hooks/use-ao-reconectar';
import { deLinhas, mesclarSessoes, paraLinhas, pendentesDeEnvio, SELECT_DE_SESSOES, type SessaoDoBanco } from '@/lib/sincronizacao';
import { supabase } from '@/lib/supabase';

/**
 * O histórico do usuário: no aparelho primeiro, na nuvem quando der (offline-first).
 *
 * - Treino terminado entra na lista NA HORA e é gravado no AsyncStorage — o subsolo não espera.
 * - Ele sobe para o Supabase assim que houver rede; até lá fica "pendente" e o app tenta de
 *   novo sozinho. O id da sessão nasce no aparelho, então reenviar é idempotente (upsert).
 * - Ao entrar num aparelho novo, o que está na nuvem desce e é mesclado com o que houver aqui.
 * - Corrigir ou apagar um treino (RN-40 a RN-43) também vale na hora e entra na fila: o treino
 *   corrigido sobe de novo SUBSTITUINDO as séries na nuvem; o apagado é apagado lá quando der, e
 *   não volta da nuvem enquanto isso.
 *
 * Tudo que as telas mostram sobre o passado — a última vez, o recorde, a tonelagem anterior,
 * a próxima letra — continua derivado desta lista (`src/domain/historico.ts`).
 */

interface Guardado {
  sessoes: SessaoFechada[];
  /** Ids das sessões que a nuvem já tem na versão do aparelho. */
  enviadas: string[];
  /** Ids apagados no aparelho que ainda precisam ser apagados na nuvem. */
  apagadas?: string[];
}

interface Contexto {
  sessoes: SessaoFechada[];
  /** Falso até o aparelho responder (e, se ele estiver vazio, até a nuvem responder). */
  carregado: boolean;
  /** Quantos treinos ainda não subiram para a nuvem. */
  pendentes: number;
  registrarSessao: (sessao: SessaoFechada) => void;
  /** RN-40 — troca um treino do histórico pela versão corrigida (mesmo id). */
  corrigirSessao: (sessao: SessaoFechada) => void;
  /** RN-40 — apaga um treino do histórico (na nuvem quando houver rede). */
  apagarSessao: (id: string) => void;
  /** Apaga o histórico do usuário, no aparelho e na nuvem. Precisa de rede. */
  apagarHistorico: () => Promise<string | null>;
}

const HistoricoContexto = createContext<Contexto | null>(null);

const chave = (usuarioId: string) => `serie:historico:v2:${usuarioId}`;
const VAZIO: Guardado = { sessoes: [], enviadas: [], apagadas: [] };

export function ProvedorDeHistorico({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const usuarioId = usuario?.id;
  const [guardado, setGuardado] = useState<Guardado>(VAZIO);
  const [carregado, setCarregado] = useState(false);
  const enviando = useRef(false);

  useEffect(() => {
    if (!usuarioId) return;
    let vivo = true;
    (async () => {
      let local: Guardado = VAZIO;
      try {
        const texto = await AsyncStorage.getItem(chave(usuarioId));
        if (texto) local = JSON.parse(texto) as Guardado;
      } catch {
        local = VAZIO;
      }
      if (!vivo) return;
      setGuardado(local);
      // Com histórico no aparelho, a tela abre na hora; vazio, espera a nuvem dizer se há algo.
      if (local.sessoes.length > 0) setCarregado(true);

      const { data, error } = await supabase.from('sessoes').select(SELECT_DE_SESSOES).order('fim');
      if (!vivo) return;
      if (!error && data) {
        setGuardado((atual) => {
          // O que foi apagado aqui e ainda não foi apagado lá não pode voltar da nuvem.
          const apagadas = new Set(atual.apagadas ?? []);
          const remotas = (data as unknown as SessaoDoBanco[]).map(deLinhas).filter((s) => !apagadas.has(s.id));
          // Só conta como enviada a sessão que o aparelho NÃO corrigiu: a corrigida está pendente.
          const pendentesAqui = new Set(pendentesDeEnvio(atual.sessoes, new Set(atual.enviadas)).map((s) => s.id));
          return {
            ...atual,
            sessoes: mesclarSessoes(atual.sessoes, remotas),
            enviadas: [...new Set([...atual.enviadas, ...remotas.map((s) => s.id).filter((id) => !pendentesAqui.has(id))])],
          };
        });
      }
      setCarregado(true);
    })();
    return () => {
      vivo = false;
    };
  }, [usuarioId]);

  useEffect(() => {
    if (usuarioId && carregado) AsyncStorage.setItem(chave(usuarioId), JSON.stringify(guardado)).catch(() => {});
  }, [guardado, carregado, usuarioId]);

  const naoEnviadas = useMemo(
    () => pendentesDeEnvio(guardado.sessoes, new Set(guardado.enviadas)),
    [guardado],
  );

  const aApagar = useMemo(() => guardado.apagadas ?? [], [guardado.apagadas]);
  const pendenciasTotais = naoEnviadas.length + aApagar.length;

  const enviarPendentes = useCallback(async () => {
    if (!usuarioId || enviando.current || pendenciasTotais === 0) return;
    enviando.current = true;
    try {
      // 1) o que foi apagado aqui sai da nuvem (as séries vão junto: on delete cascade)
      if (aApagar.length > 0) {
        const { error } = await supabase.from('sessoes').delete().eq('usuario_id', usuarioId).in('id', aApagar);
        if (error) return; // sem rede: tenta de novo depois
        const feitas = new Set(aApagar);
        setGuardado((atual) => ({ ...atual, apagadas: (atual.apagadas ?? []).filter((id) => !feitas.has(id)) }));
      }
      // 2) o que é novo ou foi corrigido sobe; as séries são SUBSTITUÍDAS (a correção pode tirar série)
      for (const sessao of naoEnviadas) {
        const linhas = paraLinhas(sessao, usuarioId);
        const { error: erroSessao } = await supabase.from('sessoes').upsert(linhas.sessao);
        if (erroSessao) return;
        const { error: erroLimpeza } = await supabase.from('series').delete().eq('usuario_id', usuarioId).eq('sessao_id', sessao.id);
        if (erroLimpeza) return;
        if (linhas.series.length > 0) {
          const { error: erroSeries } = await supabase.from('series').insert(linhas.series);
          if (erroSeries) return;
        }
        // Só marca como enviada se a sessão não mudou enquanto subia (corrigida no meio do envio).
        setGuardado((atual) =>
          atual.sessoes.find((s) => s.id === sessao.id) === sessao
            ? { ...atual, enviadas: [...new Set([...atual.enviadas, sessao.id])] }
            : atual,
        );
      }
    } finally {
      enviando.current = false;
    }
  }, [naoEnviadas, aApagar, pendenciasTotais, usuarioId]);

  useEffect(() => {
    if (carregado && pendenciasTotais > 0) enviarPendentes();
  }, [carregado, pendenciasTotais, enviarPendentes]);
  useAoReconectar(pendenciasTotais > 0 ? enviarPendentes : null);

  const registrarSessao = useCallback((sessao: SessaoFechada) => {
    // Idempotente pelo id: o efeito que chama isto pode rodar duas vezes em dev.
    setGuardado((atual) =>
      atual.sessoes.some((s) => s.id === sessao.id) ? atual : { ...atual, sessoes: [...atual.sessoes, sessao] },
    );
  }, []);

  const corrigirSessao = useCallback((corrigida: SessaoFechada) => {
    setGuardado((atual) => ({
      ...atual,
      sessoes: atual.sessoes.map((s) => (s.id === corrigida.id ? corrigida : s)),
      // volta a ser pendente: a nuvem tem a versão antiga
      enviadas: atual.enviadas.filter((id) => id !== corrigida.id),
    }));
  }, []);

  const apagarSessao = useCallback((id: string) => {
    setGuardado((atual) => {
      const estavaNaNuvem = atual.enviadas.includes(id);
      return {
        sessoes: atual.sessoes.filter((s) => s.id !== id),
        enviadas: atual.enviadas.filter((e) => e !== id),
        // Nunca subiu? Não há o que apagar lá. Mas pode estar subindo agora: apaga lá também.
        apagadas: [...new Set([...(atual.apagadas ?? []), ...(estavaNaNuvem || enviando.current ? [id] : [])])],
      };
    });
  }, []);

  const apagarHistorico = useCallback(async () => {
    if (!usuarioId) return 'Entre na sua conta para apagar o histórico.';
    // Apagar na nuvem primeiro: se falhar (sem rede), o aparelho continua igual à nuvem.
    const { error } = await supabase.from('sessoes').delete().eq('usuario_id', usuarioId);
    if (error) return 'Sem conexão. Apagar o histórico precisa de internet, para apagar também na nuvem.';
    setGuardado(VAZIO);
    return null;
  }, [usuarioId]);

  const valor = useMemo(
    () => ({
      sessoes: guardado.sessoes, carregado, pendentes: pendenciasTotais,
      registrarSessao, corrigirSessao, apagarSessao, apagarHistorico,
    }),
    [guardado.sessoes, carregado, pendenciasTotais, registrarSessao, corrigirSessao, apagarSessao, apagarHistorico],
  );
  return <HistoricoContexto.Provider value={valor}>{children}</HistoricoContexto.Provider>;
}

export function useHistorico() {
  const ctx = useContext(HistoricoContexto);
  if (!ctx) throw new Error('useHistorico precisa estar dentro de <ProvedorDeHistorico>');
  return ctx;
}
