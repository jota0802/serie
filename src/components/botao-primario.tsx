import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Texto } from './texto';
import { elevation, hit, neutral, radius, space } from '@/theme/tokens';

/**
 * A ação primária da tela.
 *
 * O relevo é RACIONADO: no máximo um elemento em relevo por tela, e ele é sempre
 * este botão. Na academia você procura uma coisa só, e o relevo diz qual é.
 *
 * Altura mínima de 60 px (`hit.cta`), acima do piso de 44 pt da `CAR-11.3`:
 * mão suada, celular apoiado no banco, e o gesto acontece cansado.
 */
export interface BotaoPrimarioProps {
  children: string;
  onPress?: () => void;
  desabilitado?: boolean;
  style?: ViewStyle;
}

export function BotaoPrimario({ children, onPress, desabilitado, style }: BotaoPrimarioProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        elevation.raised,
        pressed && estilos.pressionado,
        desabilitado && estilos.desabilitado,
        style,
      ]}
    >
      <Texto papel="h2" cor={neutral.n1000}>{children}</Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: hit.cta,
    borderRadius: radius.md,
    backgroundColor: neutral.n100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.s5,
  },
  pressionado: { backgroundColor: neutral.n150, transform: [{ scale: 0.99 }] },
  desabilitado: { backgroundColor: neutral.n700 },
});
