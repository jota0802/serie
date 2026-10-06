import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, BackHandler, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoLiso } from './botao-liso';
import { BotaoPrimario } from './botao-primario';
import { AcaoDestrutiva, ConfirmacaoDestrutiva } from './confirmacao-destrutiva';
import { plural } from './formato-do-historico';
import { Texto } from './texto';
import { glass, hit, motion, neutral, radius, space, surface } from '@/theme/tokens';

/**
 * O painel do X do Treino ativo (tela 11): terminar, descartar ou continuar — RN-30 e RN-32.
 *
 * Antes o X descartava direto, e um toque errado no topo jogava fora o treino inteiro. Agora:
 *  - com série registrada, a ação primária é TERMINAR E SALVAR (RN-30: o treino vale para o
 *    histórico e para a próxima letra); descartar existe, em vermelho, e pergunta antes (RN-32);
 *  - sem nenhuma série não há o que perder, e "Sair sem salvar" é um toque só.
 *
 * É a folha da tela 16 (o vidro espesso, com a alça), mas DENTRO da tela, não uma rota: o Treino
 * ativo continua focado, e é a guarda dele que leva ao resumo quando o treino termina. Por isso o
 * painel faz à mão o que a rota modal daria: o voltar do Android e o Esc do navegador recuam um
 * passo, o toque fora fecha, e o leitor de tela só enxerga o painel (`accessibilityViewIsModal`
 * aqui; a tela embaixo recebe `aria-hidden` de quem abre o painel).
 */
export function PainelDeEncerrar({
  feitas, previstas, aoTerminar, aoDescartar, aoContinuar,
}: {
  /** Séries registradas nesta sessão. */
  feitas: number;
  /** Séries que o treino prevê — o "12 de 18". */
  previstas: number;
  /** RN-30: salva o treino como está. */
  aoTerminar: () => void;
  /** Joga a sessão fora (com série registrada, só depois da confirmação). */
  aoDescartar: () => void;
  /** Fecha o painel: o treino segue de onde estava. */
  aoContinuar: () => void;
}) {
  const margem = useSafeAreaInsets();
  const [confirmando, setConfirmando] = useState(false);
  const painel = useRef<View>(null);
  const [{ entrada, deslize }] = useState(() => {
    const valor = new Animated.Value(0);
    return { entrada: valor, deslize: valor.interpolate({ inputRange: [0, 1], outputRange: [space.s6, 0] }) };
  });
  // "Reduzir movimento" ligado: a folha só esmaece, sem subir (como o próprio sistema faz).
  const [semDeslize, setSemDeslize] = useState(false);
  const temSeries = feitas > 0;
  const titulo = temSeries ? 'Terminar o treino?' : 'Sair do treino?';

  // Um passo de cada vez: a pergunta de descartar → o painel → o treino.
  const recuar = () => (confirmando ? setConfirmando(false) : aoContinuar());

  useEffect(() => {
    // Anima já (o painel nunca espera a resposta do sistema para aparecer) e tira o deslize se
    // a pessoa pediu menos movimento.
    Animated.timing(entrada, { toValue: 1, duration: motion.sheet, useNativeDriver: Platform.OS !== 'web' }).start();
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduzir) => {
        if (vivo && reduzir) setSemDeslize(true);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [entrada]);

  // Android: o voltar do sistema recua aqui dentro, em vez de tirar o Treino ativo da pilha.
  useEffect(() => {
    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
      recuar();
      return true;
    });
    return () => assinatura.remove();
  });

  // Navegador: Esc recua. E o foco entra no painel — teclado e leitor de tela começam por ele, não
  // pelo X que ficou embaixo — e volta para onde estava quando o painel fecha.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') recuar();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  });
  useLayoutEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const antes = document.activeElement;
    painel.current?.focus();
    return () => {
      if (antes instanceof HTMLElement && antes.isConnected) antes.focus();
    };
  }, []);

  return (
    <View style={estilos.raiz} accessibilityViewIsModal>
      {/* Tocar fora = continuar treinando. Fora da árvore de acessibilidade e do Tab (no navegador o
          Pressable vira parada de Tab por padrão): o botão "Continuar treinando" faz o mesmo. */}
      <Animated.View style={[estilos.scrim, { opacity: entrada }]} aria-hidden>
        <Pressable style={StyleSheet.absoluteFill} onPress={aoContinuar} accessible={false} tabIndex={-1} />
      </Animated.View>

      <Animated.View
        style={[
          estilos.folha,
          { paddingBottom: margem.bottom + space.s4, opacity: entrada, transform: [{ translateY: semDeslize ? 0 : deslize }] },
        ]}
      >
        <View ref={painel} role="dialog" aria-modal aria-label={titulo} tabIndex={-1} style={estilos.conteudo}>
          <View style={estilos.alca} />

          {confirmando ? (
            <ConfirmacaoDestrutiva
              pergunta={feitas === 1 ? 'Descartar a série registrada?' : `Descartar as ${feitas} séries?`}
              detalhe="Não dá para desfazer."
              acao="Descartar"
              rotuloDaAcao={feitas === 1 ? 'Descartar o treino e a série registrada' : `Descartar o treino e as ${feitas} séries`}
              aoConfirmar={aoDescartar}
              aoCancelar={() => setConfirmando(false)}
            />
          ) : (
            <>
              <View style={estilos.textos}>
                <Texto papel="h2" accessibilityRole="header">{titulo}</Texto>
                <Texto papel="desc">
                  {temSeries
                    ? `Você fez ${feitas} de ${plural(previstas, 'série', 'séries')}. Salvo como está, o treino entra no histórico.`
                    : 'Nenhuma série registrada ainda: não há o que salvar.'}
                </Texto>
              </View>

              <View style={estilos.botoes}>
                {temSeries ? (
                  <BotaoPrimario onPress={aoTerminar}>
                    {`Terminar e salvar (${plural(feitas, 'série', 'séries')})`}
                  </BotaoPrimario>
                ) : (
                  <BotaoPrimario onPress={aoDescartar}>Sair sem salvar</BotaoPrimario>
                )}
                <BotaoLiso onPress={aoContinuar} style={estilos.continuar}>Continuar treinando</BotaoLiso>
                {temSeries && (
                  <AcaoDestrutiva onPress={() => setConfirmando(true)} style={estilos.descartar}>
                    Descartar treino
                  </AcaoDestrutiva>
                )}
              </View>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: surface.scrim },
  // A folha da tela 16: vidro espesso, cantos de cima no raio xl, borda fina sem a de baixo.
  folha: {
    backgroundColor: glass.thick,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: glass.line,
    paddingHorizontal: space.s5,
    paddingTop: space.s3,
  },
  conteudo: { gap: space.s5 },
  alca: {
    alignSelf: 'center', width: 36, height: 4, borderRadius: radius.full,
    backgroundColor: neutral.n600, marginBottom: -space.s1,
  },
  textos: { gap: space.s2 },
  botoes: { gap: space.s3 },
  continuar: { minHeight: hit.row },
  descartar: { alignSelf: 'center', paddingHorizontal: space.s4 },
});
