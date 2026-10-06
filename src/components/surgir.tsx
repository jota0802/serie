import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';

import { motion } from '@/theme/tokens';

/**
 * Surgir — o conteúdo de uma tela entra subindo um pouco, um bloco depois do outro.
 *
 * É a transição que aparece em TODAS as plataformas: a da pilha (slide, fade) é nativa e no
 * navegador não existe. `ordem` é a posição do bloco na tela (0 = o primeiro).
 *
 * ⚠️ Feito com o `Animated` do próprio React Native — só opacidade e deslocamento, uma vez, ao
 * montar. A primeira versão usava as "layout animations" do Reanimated, que no navegador
 * reposicionavam os blocos quando a tela re-renderizava (os dados chegando da nuvem ~1 s depois):
 * os blocos se sobrepunham por um instante. Aqui nada é medido nem reposicionado.
 *
 * Com "reduzir movimento" ligado no sistema, o bloco aparece direto, sem animar.
 */
let reduzirMovimento = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((valor) => {
    reduzirMovimento = valor;
  })
  .catch(() => {});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (valor: boolean) => {
  reduzirMovimento = valor;
});

export function Surgir({
  ordem = 0,
  children,
  style,
}: {
  ordem?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  // O valor nasce no estado final quando não se anima: nada pisca nem fica invisível.
  const [progresso] = useState(() => new Animated.Value(reduzirMovimento ? 1 : 0));
  const atraso = Math.min(ordem, motion.maxPassos) * motion.passo;

  useEffect(() => {
    if (reduzirMovimento) {
      progresso.setValue(1);
      return;
    }
    const animacao = Animated.timing(progresso, {
      toValue: 1,
      duration: motion.entrada,
      delay: atraso,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animacao.start();
    return () => animacao.stop();
    // `progresso` e `atraso` não mudam depois de montar: re-render (dados chegando) não reanima.
  }, [progresso, atraso]);

  const deslocamento = progresso.interpolate({ inputRange: [0, 1], outputRange: [motion.deslocamento, 0] });
  return (
    <Animated.View style={[style, { opacity: progresso, transform: [{ translateY: deslocamento }] }]}>
      {children}
    </Animated.View>
  );
}
