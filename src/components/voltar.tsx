import { Pressable, StyleSheet, View } from 'react-native';
import { Texto } from './texto';
import { hit, neutral, space } from '@/theme/tokens';

/**
 * Botão de voltar da linha "voltar" (EL-15dd5185): row full-width, padding
 * vertical 15, chevron 7 × 14 no canto esquerdo. O chevron sai de duas bordas
 * de um quadrado rotacionado — zero dep de ícone, e o alvo de toque respeita
 * o piso da `CAR-11.3` (44 pt).
 *
 * `rotulo` põe o texto DENTRO do mesmo botão (tela 15). Embrulhar o <Voltar> num
 * Pressable para o texto ser tocável vira <button> dentro de <button> na web.
 */
export function Voltar({ onPress, rotulo }: { onPress: () => void; rotulo?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      hitSlop={space.s3}
      style={[estilos.container, rotulo !== undefined && estilos.comRotulo]}
    >
      <View style={estilos.chevron} />
      {rotulo !== undefined && <Texto papel="eyebrow">{rotulo}</Texto>}
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
  comRotulo: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
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
