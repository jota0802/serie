import { Manrope_400Regular, Manrope_500Medium, Manrope_700Bold, useFonts as useManrope } from '@expo-google-fonts/manrope';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold, useFonts as useSpaceGrotesk } from '@expo-google-fonts/space-grotesk';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Fundo } from '@/components/fundo';
import { ProvedorDeAuth, useAuth } from '@/estado/auth';
import { ProvedorDeHistorico } from '@/estado/historico';
import { ProvedorDePerfil, usePerfil } from '@/estado/perfil';
import { ProvedorDeSessao } from '@/estado/sessao';
import { motion, neutral } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // As duas famílias da marca. Fonte errada muda a geometria inteira da tela.
  const [grotesk] = useSpaceGrotesk({ SpaceGrotesk_500Medium, SpaceGrotesk_700Bold });
  const [manrope] = useManrope({ Manrope_400Regular, Manrope_500Medium, Manrope_700Bold });

  return (
    <ProvedorDeAuth>
      {/* Tema claro está fora do MVP: academia é ambiente escuro com o brilho no máximo. */}
      <StatusBar style="light" />
      <DadosDoUsuario>
        <Rotas fontesProntas={grotesk && manrope} />
      </DadosDoUsuario>
    </ProvedorDeAuth>
  );
}

/**
 * Perfil, histórico e sessão são DO USUÁRIO: a `key` remonta os três quando a conta troca,
 * então nada de um login aparece para o outro no mesmo aparelho.
 */
function DadosDoUsuario({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const dono = usuario?.id ?? 'ninguem';
  return (
    <ProvedorDePerfil key={`perfil-${dono}`}>
      <ProvedorDeHistorico key={`historico-${dono}`}>
        <ProvedorDeSessao key={`sessao-${dono}`}>{children}</ProvedorDeSessao>
      </ProvedorDeHistorico>
    </ProvedorDePerfil>
  );
}

/**
 * Três áreas, com rotas protegidas (`Stack.Protected`): quem não pode estar numa tela nem
 * chega a ela, e quem está numa tela que deixou de valer (entrou, saiu, montou o plano) é
 * levado para a primeira disponível — por isso a ORDEM abaixo importa:
 *
 *   deslogado ............ 01 Abertura · 02 Entrar · 03 Criar conta · 04/05 Recuperar senha
 *   logado, com plano .... o app: Hoje, o treino, as abas
 *   logado ............... 06–09 a montagem (sem plano é o único lugar; com plano, "refazer")
 *   sempre ............... redefinir a senha (o link do e-mail abre logado ou não)
 *
 * Transições (nativas — no navegador a pilha não anima; lá quem anima é o `Surgir` das telas):
 *   aprofundar (detalhe, editar, cadastro) ...... desliza da direita — o padrão
 *   trocar de aba ............................... fade curto: aba é lugar, não passo
 *   entrar no treino (11) ....................... sobe de baixo: é outro modo do app
 *   série ↔ descanso (12, 13) ................... fade curto: muda o estado, não o lugar
 *   fim do treino (14) e "link enviado" (05) .... sobe com fade: um fechamento
 */
function Rotas({ fontesProntas }: { fontesProntas: boolean }) {
  const { usuario, carregado: authCarregado } = useAuth();
  const { perfil, carregado: perfilCarregado } = usePerfil();
  const logado = !!usuario;
  const temPlano = !!perfil.plano;
  // Logado, espera saber se há plano: sem isso a pessoa veria a montagem por um instante.
  const pronto = fontesProntas && authCarregado && (!logado || perfilCarregado);

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync();
  }, [pronto]);

  if (!pronto) {
    return (
      <View style={estilos.espera}>
        <Fundo />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: neutral.n1000 },
        animation: 'slide_from_right',
        animationDuration: motion.sheet,
        gestureEnabled: true,
      }}
    >
      <Stack.Protected guard={!logado}>
        <Stack.Screen name="index" options={ABA} />
        <Stack.Screen name="entrar" />
        <Stack.Screen name="criar-conta" />
        <Stack.Screen name="recuperar-senha" />
        <Stack.Screen name="link-enviado" options={FECHAMENTO} />
      </Stack.Protected>

      <Stack.Protected guard={logado && temPlano}>
        <Stack.Screen name="hoje" options={ABA} />
        <Stack.Screen name="progresso" options={ABA} />
        <Stack.Screen name="treinos" options={ABA} />
        <Stack.Screen name="perfil" options={ABA} />
        <Stack.Screen name="treino/ativo" options={{ animation: 'slide_from_bottom', animationDuration: motion.sheet }} />
        <Stack.Screen name="treino/execucao" options={ESTADO} />
        <Stack.Screen name="treino/descanso" options={ESTADO} />
        <Stack.Screen name="treino/resumo" options={FECHAMENTO} />
        <Stack.Screen name="treino/trocar" />
        <Stack.Screen name="exercicio/[id]" />
        <Stack.Screen name="historico/index" />
        <Stack.Screen name="historico/[id]" />
        <Stack.Screen name="montar/[letra]" />
        <Stack.Screen name="montar/escolher" />
      </Stack.Protected>

      <Stack.Protected guard={logado}>
        <Stack.Screen name="montagem" />
      </Stack.Protected>

      <Stack.Screen name="redefinir-senha" options={ABA} />
    </Stack>
  );
}

/** Troca de aba (e telas "raiz"): fade curto, sem deslizar. */
const ABA = { animation: 'fade', animationDuration: motion.ui } as const;
/** Série ↔ descanso: muda o estado do treino, não o lugar. */
const ESTADO = { animation: 'fade', animationDuration: motion.ui, gestureEnabled: false } as const;
/** Fechamentos (fim do treino, link enviado): sobe com fade. */
const FECHAMENTO = { animation: 'fade_from_bottom', animationDuration: motion.sheet } as const;

const estilos = StyleSheet.create({
  espera: { flex: 1, backgroundColor: neutral.n1000 },
});
