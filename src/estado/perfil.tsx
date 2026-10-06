import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { planoValido, type Objetivo, type Plano } from '@/domain/plano';
import type { Treino } from '@/domain/types';
import { useAuth } from '@/estado/auth';
import { useAoReconectar } from '@/hooks/use-ao-reconectar';
import type { Json } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

/**
 * O perfil: as respostas da montagem (06–08) e o plano A/B/C (09, editável na 18).
 *
 * Offline-first como o histórico: a mudança vale no aparelho NA HORA e sobe para o Supabase
 * quando houver rede (`pendente` até subir). Entre o aparelho e a nuvem vence o mais novo
 * (`atualizadoEmMs`) — é um documento só, editado por uma pessoa, então "o último ganha" basta.
 */

export interface Perfil {
  nome: string;
  pesoKg: number | null;
  idade: number | null;
  alturaCm: number | null;
  diasPorSemana: number | null;
  objetivo: Objetivo | null;
  plano: Plano | null;
  atualizadoEmMs: number;
}

const VAZIO: Perfil = {
  nome: '', pesoKg: null, idade: null, alturaCm: null, diasPorSemana: null, objetivo: null, plano: null, atualizadoEmMs: 0,
};

interface Guardado {
  perfil: Perfil;
  /** Mudou no aparelho e ainda não subiu. */
  pendente: boolean;
}

interface Contexto {
  perfil: Perfil;
  /** Falso até saber se a pessoa já tem plano (aparelho, ou a nuvem na primeira vez). */
  carregado: boolean;
  pendente: boolean;
  salvar: (mudanca: Partial<Omit<Perfil, 'atualizadoEmMs'>>) => void;
}

const PerfilContexto = createContext<Contexto | null>(null);

const chave = (usuarioId: string) => `serie:perfil:v1:${usuarioId}`;

type Linha = {
  nome: string; peso_kg: number | null; idade: number | null; altura_cm: number | null;
  dias_por_semana: number | null; objetivo: string | null; plano: Json | null; atualizado_em: string;
};

function deLinha(l: Linha): Perfil {
  return {
    nome: l.nome,
    pesoKg: l.peso_kg == null ? null : Number(l.peso_kg),
    idade: l.idade,
    alturaCm: l.altura_cm,
    diasPorSemana: l.dias_por_semana,
    objetivo: (l.objetivo as Objetivo | null) ?? null,
    // o banco aceita qualquer jsonb com "treinos": confere a forma antes de confiar
    plano: planoValido(l.plano) ? (l.plano as unknown as Plano) : null,
    atualizadoEmMs: Date.parse(l.atualizado_em),
  };
}

export function ProvedorDePerfil({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const usuarioId = usuario?.id;
  const [guardado, setGuardado] = useState<Guardado>({ perfil: VAZIO, pendente: false });
  const [carregado, setCarregado] = useState(false);
  const enviando = useRef(false);

  // 1) o aparelho; 2) a nuvem — e fica o mais novo dos dois
  useEffect(() => {
    if (!usuarioId) return;
    let vivo = true;
    (async () => {
      let local: Guardado | null = null;
      try {
        const texto = await AsyncStorage.getItem(chave(usuarioId));
        local = texto ? (JSON.parse(texto) as Guardado) : null;
      } catch {
        local = null;
      }
      if (!vivo) return;
      if (local) {
        setGuardado(local);
        setCarregado(true); // com o perfil no aparelho, o app abre na hora, sem esperar a rede
      }
      const { data, error } = await supabase
        .from('perfis')
        .select('nome, peso_kg, idade, altura_cm, dias_por_semana, objetivo, plano, atualizado_em')
        .eq('id', usuarioId)
        .maybeSingle();
      if (!vivo) return;
      if (!error && data) {
        const remoto = deLinha(data);
        setGuardado((atual) =>
          atual.pendente && atual.perfil.atualizadoEmMs >= remoto.atualizadoEmMs ? atual : { perfil: remoto, pendente: false },
        );
      }
      setCarregado(true);
    })();
    return () => {
      vivo = false;
    };
  }, [usuarioId]);

  // Tudo que muda vai para o aparelho (depois de carregar, para não gravar o vazio inicial por cima).
  useEffect(() => {
    if (usuarioId && carregado) AsyncStorage.setItem(chave(usuarioId), JSON.stringify(guardado)).catch(() => {});
  }, [guardado, carregado, usuarioId]);

  const enviar = useCallback(async () => {
    if (!usuarioId || enviando.current) return;
    enviando.current = true;
    try {
      const { perfil } = guardado;
      const { error } = await supabase.from('perfis').upsert({
        id: usuarioId,
        nome: perfil.nome,
        peso_kg: perfil.pesoKg,
        idade: perfil.idade,
        altura_cm: perfil.alturaCm,
        dias_por_semana: perfil.diasPorSemana,
        objetivo: perfil.objetivo,
        plano: perfil.plano as unknown as Json,
        atualizado_em: new Date(perfil.atualizadoEmMs).toISOString(),
      });
      // Só baixa a bandeira se nada mudou enquanto subia.
      if (!error) setGuardado((atual) => (atual.perfil === perfil ? { ...atual, pendente: false } : atual));
    } finally {
      enviando.current = false;
    }
  }, [guardado, usuarioId]);

  // Sobe sempre que há algo pendente, e de novo quando a rede (ou o app) volta.
  useEffect(() => {
    if (carregado && guardado.pendente) enviar();
  }, [carregado, guardado.pendente, enviar]);
  useAoReconectar(guardado.pendente ? enviar : null);

  const salvar = useCallback((mudanca: Partial<Omit<Perfil, 'atualizadoEmMs'>>) => {
    setGuardado((atual) => ({ perfil: { ...atual.perfil, ...mudanca, atualizadoEmMs: Date.now() }, pendente: true }));
  }, []);

  const valor = useMemo(
    () => ({ perfil: guardado.perfil, carregado, pendente: guardado.pendente, salvar }),
    [guardado, carregado, salvar],
  );
  return <PerfilContexto.Provider value={valor}>{children}</PerfilContexto.Provider>;
}

export function usePerfil() {
  const ctx = useContext(PerfilContexto);
  if (!ctx) throw new Error('usePerfil precisa estar dentro de <ProvedorDePerfil>');
  return ctx;
}

const SEM_PLANO: Plano = { dias: [], treinos: [] };

/** O plano do usuário (as letras), pronto para as telas: a lista, o mapa por letra e os dias. */
export function usePlano() {
  const { perfil } = usePerfil();
  const plano = perfil.plano ?? SEM_PLANO;
  return useMemo(
    () => ({
      treinos: plano.treinos,
      porId: new Map<string, Treino>(plano.treinos.map((t) => [t.id, t])),
      dias: plano.dias,
    }),
    [plano],
  );
}
