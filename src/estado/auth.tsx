import type { User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { mensagemDeErroDeAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/**
 * A conta: entrar, criar, recuperar e redefinir a senha, sair — Supabase Auth.
 *
 * A sessão do login fica no aparelho (AsyncStorage), então abrir o app sem rede continua
 * logado: o login precisa da internet uma vez, o treino nunca. Cada ação devolve `null` quando
 * deu certo ou a frase do erro em português, pronta para a tela mostrar.
 */

interface Contexto {
  usuario: User | null;
  /** Falso até o Supabase ler a sessão salva. Antes disso "deslogado" ainda não é verdade. */
  carregado: boolean;
  entrar: (email: string, senha: string) => Promise<string | null>;
  criarConta: (nome: string, email: string, senha: string) => Promise<string | null>;
  recuperarSenha: (email: string) => Promise<string | null>;
  /** Grava a senha nova. Só funciona com a sessão aberta pelo link do e-mail (ou logado). */
  redefinirSenha: (senha: string) => Promise<string | null>;
  /** Abre a sessão a partir do link de redefinir senha. */
  abrirSessaoDoLink: (credenciais: { accessToken: string; refreshToken: string } | { codigo: string }) => Promise<string | null>;
  sair: () => Promise<void>;
}

const AuthContexto = createContext<Contexto | null>(null);

const limpar = (email: string) => email.trim().toLowerCase();

export function ProvedorDeAuth({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    let vivo = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (vivo) setUsuario(data.session?.user ?? null);
      })
      .finally(() => {
        if (vivo) setCarregado(true);
      });
    const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      // Só troca a referência quando troca o usuário: renovar o token a cada hora não pode
      // remontar o app inteiro (os provedores de dados são chaveados pelo id do usuário).
      setUsuario((atual) => {
        const proximo = sessao?.user ?? null;
        return atual?.id === proximo?.id ? atual : proximo;
      });
    });
    return () => {
      vivo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: limpar(email), password: senha });
    return error ? mensagemDeErroDeAuth(error) : null;
  }, []);

  const criarConta = useCallback(async (nome: string, email: string, senha: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: limpar(email),
      password: senha,
      // vai para `raw_user_meta_data`; o gatilho do banco cria o perfil com este nome
      options: { data: { nome: nome.trim() } },
    });
    if (error) return mensagemDeErroDeAuth(error);
    // Com a confirmação de e-mail desligada o Supabase já devolve a sessão. Se um dia ela for
    // ligada, não há sessão aqui — e a tela precisa dizer isso em vez de fingir que entrou.
    if (!data.session) return 'Conta criada. Confirme pelo link que enviamos para o seu e-mail e depois entre.';
    return null;
  }, []);

  const recuperarSenha = useCallback(async (email: string) => {
    // O link do e-mail volta para a tela de redefinir: serie://… no APK, exp://… no Expo Go,
    // http://localhost… no navegador. Todos estão liberados no Supabase (supabase/config.toml).
    const { error } = await supabase.auth.resetPasswordForEmail(limpar(email), {
      redirectTo: Linking.createURL('/redefinir-senha'),
    });
    return error ? mensagemDeErroDeAuth(error) : null;
  }, []);

  const redefinirSenha = useCallback(async (senha: string) => {
    const { error } = await supabase.auth.updateUser({ password: senha });
    return error ? mensagemDeErroDeAuth(error) : null;
  }, []);

  const abrirSessaoDoLink = useCallback<Contexto['abrirSessaoDoLink']>(async (credenciais) => {
    const { error } =
      'codigo' in credenciais
        ? await supabase.auth.exchangeCodeForSession(credenciais.codigo)
        : await supabase.auth.setSession({ access_token: credenciais.accessToken, refresh_token: credenciais.refreshToken });
    return error ? mensagemDeErroDeAuth(error) : null;
  }, []);

  const sair = useCallback(async () => {
    // `local`: sai deste aparelho mesmo sem rede (o servidor revoga o token quando der).
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, carregado, entrar, criarConta, recuperarSenha, redefinirSenha, abrirSessaoDoLink, sair }),
    [usuario, carregado, entrar, criarConta, recuperarSenha, redefinirSenha, abrirSessaoDoLink, sair],
  );
  return <AuthContexto.Provider value={valor}>{children}</AuthContexto.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContexto);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <ProvedorDeAuth>');
  return ctx;
}

/** O id do usuário logado. As telas do app só existem logadas (rotas protegidas no `_layout`). */
export function useUsuarioId(): string {
  const { usuario } = useAuth();
  if (!usuario) throw new Error('useUsuarioId fora da área logada');
  return usuario.id;
}
