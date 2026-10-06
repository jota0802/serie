import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Chevron } from './icones';
import { hit, neutral, surface } from '@/theme/tokens';

/**
 * ↑ ou ↓: muda a posição de algo numa lista (o treino no rodízio, na 17; o exercício no treino,
 * na 18). É o chevron do app girado — discreto de propósito: reordenar é raro, e a seta não pode
 * competir com o que a linha mostra.
 *
 * Na ponta da lista a seta fica apagada (`n700`) e desabilitada, mas continua ocupando o lugar:
 * as linhas não dançam. O alvo é sempre `hit.min` (`CAR-11.3`).
 */
export function BotaoDeSeta({
  direcao, onPress, desabilitado = false, rotulo, style,
}: {
  direcao: 'cima' | 'baixo';
  onPress: () => void;
  desabilitado?: boolean;
  /** O que o leitor de tela diz: "Subir o treino B no rodízio". */
  rotulo: string;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: desabilitado }}
      style={({ pressed }) => [estilos.base, style, pressed && !desabilitado && estilos.pressionado]}
    >
      <View style={direcao === 'cima' ? estilos.paraCima : estilos.paraBaixo}>
        <Chevron tamanho={16} cor={desabilitado ? neutral.n700 : neutral.n300} />
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: { width: hit.min, height: hit.min, alignItems: 'center', justifyContent: 'center' },
  pressionado: { backgroundColor: surface.rowActive },
  // O chevron do app aponta para a direita: −90° sobe, 90° desce.
  paraCima: { transform: [{ rotate: '-90deg' }] },
  paraBaixo: { transform: [{ rotate: '90deg' }] },
});
