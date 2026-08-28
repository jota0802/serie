import { Pressable, StyleSheet, View } from 'react-native';
import { hit, neutral, space } from '@/theme/tokens';

/**
 * Botão de voltar da linha "voltar" (EL-15dd5185): row full-width, padding
 * vertical 15, chevron 7 × 14 no canto esquerdo. O chevron sai de duas bordas
 * de um quadrado rotacionado — zero dep de ícone, e o alvo de toque respeita
 * o piso da `CAR-11.3` (44 pt).
 */
export function Voltar({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      hitSlop={space.s3}
      style={estilos.container}
    >
      <View style={estilos.chevron} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    minHeight: hit.min,
    paddingVertical: 15,
    justifyContent: 'center',
  },
  // Quadrado com border esquerda + inferior, girado 45º = chevron para a esquerda.
  chevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: neutral.n300,
    transform: [{ rotate: '45deg' }],
  },
});
