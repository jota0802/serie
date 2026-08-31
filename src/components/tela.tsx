import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fundo } from './fundo';
import { space } from '@/theme/tokens';

/** Moldura comum das telas: o canvas atrás, a área segura na frente. */
export function Tela({
  children, aquecido = false, style,
}: { children: ReactNode; aquecido?: boolean; style?: ViewStyle }) {
  return (
    <View style={estilos.raiz}>
      <Fundo aquecido={aquecido} />
      <SafeAreaView style={[estilos.seguro, style]}>{children}</SafeAreaView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  seguro: { flex: 1, paddingHorizontal: space.s5 },
});
