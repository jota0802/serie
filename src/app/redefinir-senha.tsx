import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvisoDeFormulario } from '@/components/aviso-de-formulario';
import { BotaoPrimario } from '@/components/botao-primario';
import { Campo } from '@/components/campo';
import { useAuth } from '@/estado/auth';
import { usePerfil } from '@/estado/perfil';
import { extrairCredenciaisDoLink } from '@/lib/auth';
import { font, neutral, space, surface } from '@/theme/tokens';

/**
 * Redefinir a senha — o destino do link que a 04 manda por e-mail.
 *
 * Não está entre as 21 telas do Figma: é a ponta que faltava do fluxo "esqueci a senha" agora
 * que o link é de verdade. Usa o mesmo idioma da 04 (título, explicação, campo, botão no pé).
 *
 * O link chega com os tokens no fragmento ou com um código (`extrairCredenciaisDoLink`); a tela
 * abre a sessão com eles e pede a senha nova. Aberta sem link e sem estar logado, explica e
 * manda para "Esqueci minha senha".
 */
type Estado = 'abrindo' | 'pronto' | 'sem-link' | { erro: string };

export default function RedefinirSenha() {
  const router = useRouter();
  const url = Linking.useURL();
  const { usuario, abrirSessaoDoLink, redefinirSenha } = useAuth();
  const { perfil } = usePerfil();
  // No navegador o fragmento (#access_token=…) não passa pelo roteador: lê da barra de endereço,
  // uma vez, na montagem.
  const [enderecoWeb] = useState(() => (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : null));
  const endereco = enderecoWeb ?? url;
  const credenciais = useMemo(() => extrairCredenciaisDoLink(endereco), [endereco]);
  const [resultado, setResultado] = useState<'pronto' | { erro: string } | null>(null);
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const usado = useRef(false);

  // Abre a sessão UMA vez com o que veio no link (o token é de uso único).
  useEffect(() => {
    if (!credenciais || credenciais.tipo === 'erro' || usado.current) return;
    usado.current = true;
    abrirSessaoDoLink(credenciais.tipo === 'tokens' ? credenciais : { codigo: credenciais.codigo }).then((falha) =>
      setResultado(falha ? { erro: falha } : 'pronto'),
    );
  }, [credenciais, abrirSessaoDoLink]);

  const estado: Estado =
    credenciais?.tipo === 'erro'
      ? { erro: 'O link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".' }
      : credenciais
        ? (resultado ?? 'abrindo')
        : usuario
          ? 'pronto'
          : 'sem-link';

  const salvar = async () => {
    if (enviando) return;
    if (senha.length < 8) return setErro('A senha precisa de pelo menos 8 caracteres.');
    if (senha !== confirmacao) return setErro('As duas senhas não são iguais.');
    setErro(null);
    setEnviando(true);
    const falha = await redefinirSenha(senha);
    setEnviando(false);
    if (falha) return setErro(falha);
    router.replace(perfil.plano ? '/hoje' : '/montagem');
  };

  const problema = typeof estado === 'object' ? estado.erro : estado === 'sem-link'
    ? 'Esta tela abre pelo link que mandamos por e-mail. Peça um em "Esqueci minha senha".'
    : null;

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={estilos.body}>
          <Text style={estilos.titulo}>Nova senha</Text>

          <View style={estilos.explicacao}>
            <Text style={estilos.textoExplicacao}>
              {estado === 'abrindo' ? 'Conferindo o link…' : 'Escolha uma senha nova para a sua conta.'}
            </Text>
          </View>

          {estado === 'pronto' && (
            <View style={estilos.campos}>
              <Campo
                rotulo="Senha nova"
                senha
                value={senha}
                onChangeText={setSenha}
                placeholder="••••••••"
                autoComplete="password-new"
                returnKeyType="next"
              />
              <Campo
                rotulo="Repita a senha"
                senha
                value={confirmacao}
                onChangeText={setConfirmacao}
                placeholder="••••••••"
                autoComplete="password-new"
                returnKeyType="go"
                onSubmitEditing={salvar}
              />
              <AvisoDeFormulario>{erro}</AvisoDeFormulario>
            </View>
          )}
          <AvisoDeFormulario>{problema}</AvisoDeFormulario>

          <View style={estilos.espaco} />

          {estado === 'pronto' ? (
            <BotaoPrimario onPress={salvar} desabilitado={enviando}>{enviando ? 'Salvando…' : 'Salvar senha'}</BotaoPrimario>
          ) : (
            problema && (
              <BotaoPrimario onPress={() => router.replace(usuario ? '/hoje' : '/recuperar-senha')}>
                {usuario ? 'Voltar ao app' : 'Esqueci minha senha'}
              </BotaoPrimario>
            )
          )}

          <View style={estilos.gap} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: surface.base },
  flex: { flex: 1 },
  body: { flex: 1, paddingHorizontal: space.s5, paddingTop: space.s6 },
  titulo: {
    fontFamily: font.display,
    fontSize: 30,
    letterSpacing: 30 * -0.025,
    color: neutral.n100,
  },
  explicacao: { paddingTop: 10, paddingBottom: 28 },
  textoExplicacao: {
    fontFamily: font.text,
    fontSize: 15,
    lineHeight: 15 * 1.5,
    color: neutral.n400,
  },
  campos: { gap: 16 },
  espaco: { flex: 1 },
  gap: { height: 20 },
});
