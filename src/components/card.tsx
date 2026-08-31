import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { accent, radius, space, surface } from '@/theme/tokens';

/**
 * Superfície elevada. Dois estilos, e só dois.
 *
 * `ouro` é reservado ao recorde — é o único momento do app que tem cor.
 */
export function Card({
  children, ouro = false, style,
}: { children: ReactNode; ouro?: boolean; style?: ViewStyle }) {
  return <View style={[estilos.base, ouro && estilos.ouro, style]}>{children}</View>;
}

const estilos = StyleSheet.create({
  base: {
    backgroundColor: surface.raised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surface.line,
    padding: space.s4,
    gap: space.s2,
  },
  ouro: { backgroundColor: accent.signalDim, borderColor: surface.recordLine },
});
