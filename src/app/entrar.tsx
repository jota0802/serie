import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvisoDeFormulario } from '@/components/aviso-de-formulario';
import { BotaoPrimario } from '@/components/botao-primario';
import { Campo } from '@/components/campo';
import { Surgir } from '@/components/surgir';
import { Voltar } from '@/components/voltar';
import { useAuth } from '@/estado/auth';
import { font, neutral, space, surface } from '@/theme/tokens';

/**
 * Tela 02 · Entrar — porta pra quem já tem conta.
 *
 * Espelho do frame `02 · Entrar` do Figma. body com padding 24 lateral,
 * "voltar" no topo, título "Entrar" (H1 · SG Bold 30), dois Campos separados
 * por 16, link "Esqueci minha senha" alinhado à direita, e o rodapé com o
 * botão primário + a linha "Não tem conta? Criar conta".
 *
 * Login de verdade (Supabase Auth). Deu certo, não há `router.push`: a tela deixa de valer
 * para quem está logado (rotas protegidas no `_layout`) e o app leva para o Hoje — ou para
 * a montagem, se a conta ainda não tem plano.
 */
export default function Entrar() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { entrar } = useAuth();

  const enviar = async () => {
    if (enviando) return;
    if (!email.trim() || !senha) {
      setErro('Preencha o e-mail e a senha.');
      return;
    }
    setErro(null);
    setEnviando(true);
    const falha = await entrar(email, senha);
    setEnviando(false);
    if (falha) setErro(falha);
  };

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={estilos.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={estilos.body}>
          <Voltar onPress={() => router.back()} />

          <Surgir ordem={0}>
            <Text style={estilos.titulo}>Entrar</Text>
          </Surgir>

          <Surgir ordem={1} style={estilos.campos}>
            <Campo
              rotulo="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="joao@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              returnKeyType="next"
            />
            <Campo
              rotulo="Senha"
              senha
              value={senha}
              onChangeText={setSenha}
              placeholder="••••••••"
              autoComplete="password"
              returnKeyType="go"
              onSubmitEditing={enviar}
            />
            <AvisoDeFormulario>{erro}</AvisoDeFormulario>
            <View style={estilos.esqueci}>
              <Pressable
                onPress={() => router.push('/recuperar-senha')}
                accessibilityRole="link"
                hitSlop={space.s3}
              >
                <Text style={estilos.linkFraco}>Esqueci minha senha</Text>
              </Pressable>
            </View>
          </Surgir>

          <View style={estilos.espaco} />

          <BotaoPrimario onPress={enviar} desabilitado={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</BotaoPrimario>

          <Pressable
            onPress={() => router.push('/criar-conta')}
            accessibilityRole="link"
            style={estilos.rodape}
            hitSlop={space.s2}
          >
            <Text style={estilos.linkFraco}>Não tem conta?</Text>
            <Text style={estilos.linkForte}>Criar conta</Text>
          </Pressable>

          <View style={estilos.gap} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: surface.base },
  flex: { flex: 1 },
  // body (EL-099a96f6): column, padding 0 24, fill both.
  body: { flex: 1, paddingHorizontal: space.s5 },
  // Título — style_91b2fa39: SG Bold 30 · LS -0.025em · #F8F8F8.
  titulo: {
    fontFamily: font.display,
    fontSize: 30,
    letterSpacing: 30 * -0.025,
    color: neutral.n100,
  },
  // Campos (72:439): column, padding 28 0 0 0, gap 16.
  campos: { paddingTop: 28, gap: 16 },
  // "esqueci" (72:450): row, padding 12 0, justifyContent flex-end.
  esqueci: { paddingVertical: 12, alignItems: 'flex-end' },
  // "criar conta" (EL-9933f80d): row, padding 14 0, center, gap 6.
  rodape: {
    flexDirection: 'row',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  espaco: { flex: 1 },
  gap: { height: 16 },
  // Link fraco — style_8cca2528: Manrope Regular 15 · #909090 (ou #6E6E6E no rodapé).
  linkFraco: {
    fontFamily: font.text,
    fontSize: 15,
    color: neutral.n300,
  },
  // Link forte — style_6126209a: Manrope SemiBold 15 · #F8F8F8.
  linkForte: {
    fontFamily: font.textMedium,
    fontSize: 15,
    fontWeight: '600',
    color: neutral.n100,
  },
});
