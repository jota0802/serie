import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario } from '@/components/botao-primario';
import { Campo } from '@/components/campo';
import { Voltar } from '@/components/voltar';
import { font, neutral, space, surface } from '@/theme/tokens';

/**
 * Tela 04 · Recuperar senha — espelho do frame do Figma.
 *
 * A tela mais curta do bloco de auth: só um campo. Estrutura: voltar, título,
 * bloco "explicação" (padding 10 top · 28 bottom · texto em Manrope 15 sobre
 * n400), Campo de e-mail, espaço flex, botão primário "Enviar link", e um gap
 * final de 20 px antes do home indicator — diferente do 16 padrão das outras
 * telas, e vem do Figma assim mesmo.
 *
 * O envio do link é do CP6 (Supabase). Aqui o botão apenas avança pra 05 ·
 * Link enviado, que é a confirmação visual do fluxo.
 */
export default function RecuperarSenha() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={estilos.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={estilos.body}>
          <Voltar onPress={() => router.back()} />

          <Text style={estilos.titulo}>Recuperar senha</Text>

          <View style={estilos.explicacao}>
            <Text style={estilos.textoExplicacao}>
              Digite o e-mail da sua conta. A gente manda um link para você criar uma senha nova.
            </Text>
          </View>

          <Campo
            rotulo="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="joao@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={() => router.push('/link-enviado')}
          />

          <View style={estilos.espaco} />

          <BotaoPrimario onPress={() => router.push('/link-enviado')}>Enviar link</BotaoPrimario>

          <View style={estilos.gap} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: surface.base },
  flex: { flex: 1 },
  body: { flex: 1, paddingHorizontal: space.s5 },
  // Título — style_91b2fa39: SG Bold 30 · LS -0.025em · #F8F8F8.
  titulo: {
    fontFamily: font.display,
    fontSize: 30,
    letterSpacing: 30 * -0.025,
    color: neutral.n100,
  },
  // "explicação" (73:489): column, padding 10 0 28 0.
  explicacao: { paddingTop: 10, paddingBottom: 28 },
  // Texto (style_de42a388): Manrope Regular 15 · LH 1.5em · #6E6E6E.
  textoExplicacao: {
    fontFamily: font.text,
    fontSize: 15,
    lineHeight: 15 * 1.5,
    color: neutral.n400,
  },
  espaco: { flex: 1 },
  // gap final: 20 (diferente do 16 das outras telas de auth).
  gap: { height: 20 },
});
