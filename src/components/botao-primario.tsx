import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { elevation, font, hit, neutral, radius, space } from '@/theme/tokens';

/**
 * A ação primária da tela.
 *
 * O relevo é RACIONADO: no máximo um elemento em relevo por tela, e ele é sempre
 * este botão. Na academia você procura uma coisa só, e o relevo diz qual é.
 *
 * Altura mínima de 60 px (`hit.cta`), acima do piso de 44 pt da `CAR-11.3`:
 * mão suada, celular apoiado no banco, e o gesto acontece cansado.
 *
 * Variantes (do Figma, "Botão primário" · componentIds 10:2 e 10:6):
 *  - `primario`: gradiente `#FBFBFB → #DEDEDE`, elevação Raised, texto `#0E0E0E`
 *  - `secundario`: fundo sólido `#2B2B2B`, sem elevação, texto `#6E6E6E`
 */
export interface BotaoPrimarioProps {
  children: string;
  onPress?: () => void;
  desabilitado?: boolean;
  variante?: 'primario' | 'secundario';
  style?: ViewStyle;
}

const GRADIENTE_PRIMARIO = ['#FBFBFB', '#DEDEDE'] as const;

export function BotaoPrimario({
  children,
  onPress,
  desabilitado,
  variante = 'primario',
  style,
}: BotaoPrimarioProps) {
  const ehSecundario = variante === 'secundario';
  const corTexto = desabilitado ? neutral.n400 : ehSecundario ? neutral.n400 : neutral.n1000;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        ehSecundario ? estilos.secundario : elevation.raised,
        pressed && estilos.pressionado,
        desabilitado && estilos.desabilitado,
        style,
      ]}
    >
      {!ehSecundario && !desabilitado && (
        <LinearGradient
          colors={GRADIENTE_PRIMARIO}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Text style={[estilos.rotulo, { color: corTexto }]}>{children}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: hit.cta,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.s5,
    overflow: 'hidden',
  },
  secundario: { backgroundColor: neutral.n700 },
  pressionado: { transform: [{ scale: 0.99 }], opacity: 0.94 },
  desabilitado: { backgroundColor: neutral.n700 },
  // Space Grotesk Bold 17 / -0.01em — o rótulo do botão no Figma.
  rotulo: {
    fontFamily: font.display,
    fontSize: 17,
    letterSpacing: -0.17,
  },
});
