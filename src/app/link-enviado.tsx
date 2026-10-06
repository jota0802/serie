import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvisoDeFormulario } from '@/components/aviso-de-formulario';
import { BotaoPrimario } from '@/components/botao-primario';
import { useAuth } from '@/estado/auth';
import { useEspera } from '@/hooks/use-espera';
import { formatarTempo } from '@/lib/formato';
import { font, neutral, radius, space, surface } from '@/theme/tokens';

const ESPERA_PARA_REENVIAR_S = 30;

/**
 * Tela 05 · Link enviado — a confirmação da 04.
 *
 * Fecha o fluxo "esqueci senha" com um sinal visual único no bloco de auth: o
 * único selo circular do app inteiro. Corpo com alignItems center, selo branco
 * 72 × 72 com um check preto dentro, título e descrição centralizados, dois
 * espaços flex que empurram o botão pra baixo, e um link "Reenviar" logo depois.
 *
 * "Reenviar" manda o link de novo (Supabase Auth), com 30 s de espera entre um e outro — o
 * próprio Supabase limita os e-mails por hora. "Voltar para entrar" usa `replace` para tirar
 * essa tela da pilha — quem chega aqui e volta não quer o botão de voltar da 04 de novo.
 */
export default function LinkEnviado() {
  const router = useRouter();
  // O e-mail é passado pela 04 (Recuperar senha). Se alguém chegar aqui direto,
  // cai num fallback genérico em vez de ostentar um placeholder falso.
  const { email } = useLocalSearchParams<{ email?: string }>();
  const destino = email?.trim() || 'seu e-mail';

  // O envio de verdade é do CP6 (Supabase); a 04 também é simulada, então "reenviado" aqui
  // é o mesmo contrato do protótipo. O que NÃO pode é o toque não dar resposta nenhuma — e
  // o cooldown de 30 s impede martelar o botão (no CP6, cada toque seria um e-mail).
  const [reenviou, setReenviou] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { restante, armar } = useEspera();
  const { recuperarSenha } = useAuth();
  const esperando = restante > 0;
  const reenviar = async () => {
    if (esperando || !email?.trim()) return;
    armar(ESPERA_PARA_REENVIAR_S);
    const falha = await recuperarSenha(email);
    setErro(falha);
    setReenviou(!falha);
  };

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.body}>
        <View style={estilos.espaco} />

        <View style={estilos.selo}>
          <CheckPreto />
        </View>

        <View style={estilos.mensagem}>
          <Text style={estilos.titulo}>Link enviado</Text>
          <Text style={estilos.descricao}>
            Enviamos para {destino}.{'\n'}O link vale por 30 minutos.
          </Text>
        </View>

        <View style={estilos.espaco} />

        <BotaoPrimario onPress={() => router.replace('/entrar')}>Voltar para entrar</BotaoPrimario>

        <Pressable
          onPress={reenviar}
          disabled={esperando}
          accessibilityRole="button"
          accessibilityState={{ disabled: esperando }}
          style={estilos.reenviar}
          hitSlop={space.s2}
        >
          <Text style={[estilos.textoReenviar, esperando && estilos.textoEsperando]}>
            {esperando
              ? `Link reenviado · reenviar de novo em ${formatarTempo(restante)}`
              : reenviou
                ? 'Link reenviado. Não chegou? Reenviar'
                : 'Não chegou? Reenviar'}
          </Text>
        </Pressable>
        <AvisoDeFormulario>{erro}</AvisoDeFormulario>

        <View style={estilos.gap} />
      </View>
    </SafeAreaView>
  );
}

/**
 * Check do selo — o "L" invertido do Figma (24 × 17, stroke 4, cor n1000).
 * Duas bordas em um retângulo rotacionado 45º formam o tick, sem SVG.
 */
function CheckPreto() {
  return <View style={estilos.check} />;
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: surface.base },
  // body (73:517): column, padding 0 24, alignItems center, fill both.
  body: { flex: 1, paddingHorizontal: space.s5, alignItems: 'center' },
  espaco: { flex: 1, alignSelf: 'stretch' },
  // Selo (73:519): 72 × 72, círculo (radius 999), fill n100 (#F8F8F8).
  selo: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: neutral.n100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // O tick: retângulo com bordas direita + inferior, rotacionado 45º.
  // Proporções aproximam o check 24 × 17 do Figma com stroke 4.
  check: {
    width: 10,
    height: 20,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: neutral.n1000,
    transform: [{ rotate: '45deg' }, { translateY: -4 }],
  },
  // "mensagem" (73:521): column, padding 28 top, alignItems center, gap 12.
  mensagem: {
    alignSelf: 'stretch',
    paddingTop: 28,
    alignItems: 'center',
    gap: 12,
  },
  // Título — SG Bold 30 · LS -0.025em · CENTER · #F8F8F8.
  titulo: {
    fontFamily: font.display,
    fontSize: 30,
    letterSpacing: 30 * -0.025,
    color: neutral.n100,
    textAlign: 'center',
  },
  // Descrição (style_1f38beb1): Manrope Regular 16 · LH 1.55em · CENTER · #6E6E6E.
  descricao: {
    fontFamily: font.text,
    fontSize: 16,
    lineHeight: 16 * 1.55,
    color: neutral.n400,
    textAlign: 'center',
  },
  // "reenviar" (73:527): row, alignSelf stretch, padding 14 0, center.
  reenviar: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Texto (style_6126209a) — Manrope SemiBold 15 · #909090 (fill_15e12dad).
  textoReenviar: {
    fontFamily: font.textMedium,
    fontSize: 15,
    fontWeight: '600',
    color: neutral.n300,
  },
  // Em espera o link apaga — o mesmo n400 que o resto do app usa para desabilitado.
  textoEsperando: { color: neutral.n400 },
  gap: { height: 16 },
});
