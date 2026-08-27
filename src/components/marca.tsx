import { View } from 'react-native';
import { accent, neutral, radius } from '@/theme/tokens';

/**
 * A marca da Série.
 *
 * Três barras crescentes: as séries do exercício. A maior é ouro porque ouro, no
 * app inteiro, significa uma coisa só — recorde. Geometria idêntica ao frame
 * `mark` (78 × 51) do Figma; ver `docs/marca.md`.
 */
export function Marca({ largura = 78 }: { largura?: number }) {
  const k = largura / 78;
  const barra = (w: number, cor: string) => ({
    width: w * k,
    height: 13 * k,
    borderRadius: radius.sm * 0.5 * k,
    backgroundColor: cor,
  });

  return (
    <View accessibilityRole="image" accessibilityLabel="Série" style={{ gap: 6 * k }}>
      <View style={barra(34, neutral.n100)} />
      <View style={barra(56, neutral.n100)} />
      <View style={barra(78, accent.signal)} />
    </View>
  );
}
