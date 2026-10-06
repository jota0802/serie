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
 * Tela 03 · Criar conta — espelho do frame do Figma.
 *
 * Estrutura idêntica à 02: `voltar`, título, `Campos`, espaço flex, disclaimer
 * centralizado, gap de 14, botão primário, rodapé. A diferença é o conteúdo:
 * três campos (Nome · E-mail · Senha), a dica "Mínimo 8 caracteres" logo
 * abaixo do último campo, e o texto legal centrado antes do botão.
 *
 * Cria a conta de verdade (Supabase Auth); o nome vai junto e o banco cria o perfil com ele.
 * Deu certo, a pessoa já está logada e sem plano: as rotas protegidas levam para a montagem
 * (06–09). A senha segue a dica da tela: mínimo de 8, o mesmo que o Supabase exige.
 */
export default function CriarConta() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { criarConta } = useAuth();

  const enviar = async () => {
    if (enviando) return;
    if (!nome.trim()) return setErro('Como podemos te chamar? Preencha o nome.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErro('Confira o e-mail: ele parece inválido.');
    if (senha.length < 8) return setErro('A senha precisa de pelo menos 8 caracteres.');
    setErro(null);
    setEnviando(true);
    const falha = await criarConta(nome, email, senha);
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
            <Text style={estilos.titulo}>Criar conta</Text>
          </Surgir>

          <Surgir ordem={1} style={estilos.campos}>
            <Campo
              rotulo="Nome"
              value={nome}
              onChangeText={setNome}
              placeholder="João"
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
            />
            <Campo
              rotulo="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
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
              autoComplete="password-new"
              returnKeyType="go"
              onSubmitEditing={enviar}
            />
            <Text style={estilos.dica}>Mínimo 8 caracteres</Text>
            <AvisoDeFormulario>{erro}</AvisoDeFormulario>
          </Surgir>

          <View style={estilos.espaco} />

          <Text style={estilos.legal}>
            Ao criar conta você aceita os Termos de Uso e a Política de Privacidade.
          </Text>

          <View style={estilos.gapAntesDoBotao} />

          <BotaoPrimario onPress={enviar} desabilitado={enviando}>{enviando ? 'Criando…' : 'Criar conta'}</BotaoPrimario>

          <Pressable
            onPress={() => router.push('/entrar')}
            accessibilityRole="link"
            style={estilos.rodape}
            hitSlop={space.s2}
          >
            <Text style={estilos.linkFraco}>Já tem conta?</Text>
            <Text style={estilos.linkForte}>Entrar</Text>
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
  body: { flex: 1, paddingHorizontal: space.s5 },
  // Título — style_91b2fa39: SG Bold 30 · LS -0.025em · #F8F8F8.
  titulo: {
    fontFamily: font.display,
    fontSize: 30,
    letterSpacing: 30 * -0.025,
    color: neutral.n100,
  },
  // Campos (72:480): column, padding 28 0 0 0, gap 16.
  campos: { paddingTop: 28, gap: 16 },
  // Dica (style_ac3ea5ec): Manrope Regular 13 · #6E6E6E · LEFT.
  dica: {
    fontFamily: font.text,
    fontSize: 13,
    color: neutral.n400,
  },
  espaco: { flex: 1 },
  // Texto legal (inline no Figma): Manrope Regular 13 · LH 1.45em · CENTER · #6E6E6E.
  legal: {
    fontFamily: font.text,
    fontSize: 13,
    lineHeight: 13 * 1.45,
    color: neutral.n400,
    textAlign: 'center',
  },
  // "gap" (EL-479bad03): 14 px fixos entre o legal e o botão.
  gapAntesDoBotao: { height: 14 },
  // "já tenho conta" (EL-9933f80d): row, padding 14 0, center, gap 6.
  rodape: {
    flexDirection: 'row',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  gap: { height: 16 },
  // Link fraco — Manrope Regular 15 · #6E6E6E (o "Já tem conta?" usa fill_c23f1518).
  linkFraco: {
    fontFamily: font.text,
    fontSize: 15,
    color: neutral.n400,
  },
  // Link forte — Manrope SemiBold 15 · #F8F8F8.
  linkForte: {
    fontFamily: font.textMedium,
    fontSize: 15,
    fontWeight: '600',
    color: neutral.n100,
  },
});
