import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { sessoesDeFabrica } from '@/data/historico';
import type { SessaoFechada } from '@/domain/historico';

/**
 * O histórico persistido no aparelho (offline-first: academia é subsolo).
 *
 * Na primeira abertura nasce das sessões de fábrica (`src/data/historico.ts`); a partir
 * daí cada treino terminado entra aqui e sobrevive a fechar o app. Tudo que as telas
 * mostram sobre o passado — a última vez, o recorde, a tonelagem anterior, a próxima
 * letra — é derivado desta lista pelas funções de `src/domain/historico.ts`.
 */

const CHAVE = 'serie:historico:v1';

interface Contexto {
  sessoes: SessaoFechada[];
  /** Falso até o AsyncStorage responder. Tela que depende do passado espera por isto. */
  carregado: boolean;
  registrarSessao: (sessao: SessaoFechada) => void;
  /** Volta ao histórico de fábrica — é o "apagar meus dados" do Perfil. */
  restaurarFabrica: () => void;
}

const HistoricoContexto = createContext<Contexto | null>(null);

export function ProvedorDeHistorico({ children }: { children: ReactNode }) {
  const [sessoes, setSessoes] = useState<SessaoFechada[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    let vivo = true;
    AsyncStorage.getItem(CHAVE)
      .then((texto) => (texto ? (JSON.parse(texto) as SessaoFechada[]) : sessoesDeFabrica(Date.now())))
      .catch(() => sessoesDeFabrica(Date.now()))
      .then((lista) => {
        if (!vivo) return;
        setSessoes(lista);
        setCarregado(true);
      });
    return () => {
      vivo = false;
    };
  }, []);

  // Grava depois que carregou: antes disso a lista vazia sobrescreveria o disco.
  useEffect(() => {
    if (carregado) AsyncStorage.setItem(CHAVE, JSON.stringify(sessoes)).catch(() => {});
  }, [sessoes, carregado]);

  const registrarSessao = useCallback((sessao: SessaoFechada) => {
    // Idempotente pelo id: o efeito que chama isto pode rodar duas vezes em dev.
    setSessoes((lista) => (lista.some((s) => s.id === sessao.id) ? lista : [...lista, sessao]));
  }, []);

  const restaurarFabrica = useCallback(() => setSessoes(sessoesDeFabrica(Date.now())), []);

  const valor = useMemo(
    () => ({ sessoes, carregado, registrarSessao, restaurarFabrica }),
    [sessoes, carregado, registrarSessao, restaurarFabrica],
  );
  return <HistoricoContexto.Provider value={valor}>{children}</HistoricoContexto.Provider>;
}

export function useHistorico() {
  const ctx = useContext(HistoricoContexto);
  if (!ctx) throw new Error('useHistorico precisa estar dentro de <ProvedorDeHistorico>');
  return ctx;
}
