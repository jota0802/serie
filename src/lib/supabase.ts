import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from './database.types';

/**
 * O cliente do Supabase: login de verdade e a cópia do histórico na nuvem.
 *
 * A chave é a PUBLICÁVEL (`sb_publishable_…`): ela vai dentro do app de propósito, como em
 * qualquer app. Quem protege os dados é a RLS do banco (`supabase/migrations/`): com ela, esta
 * chave só enxerga as linhas do usuário logado. A chave secreta nunca entra no app.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chave = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!url || !chave) {
  throw new Error('Faltam EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_KEY no .env');
}

export const supabase = createClient<Database>(url, chave, {
  auth: {
    // A sessão do login fica no aparelho: abrir o app no subsolo, sem rede, continua logado.
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // O link de "recuperar senha" é tratado na mão pela tela de redefinir (`redefinir-senha.tsx`),
    // igual no Android e no navegador.
    detectSessionInUrl: false,
    // Sem `lock`: desde a 2.117 a supabase-js coordena a renovação da sessão sozinha, e a opção
    // só gerava um aviso de "deprecated" no log do Android.
  },
});

// No celular, renovar o token só com o app na frente — é o que a documentação do Supabase pede
// para React Native. No navegador a própria aba cuida disso.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
