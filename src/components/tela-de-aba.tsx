import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fundo } from './fundo';
import { Nav, type AbaDaNav } from './nav';
import { Texto } from './texto';
import { space } from '@/theme/tokens';

/**
 * Moldura das telas de aba (17 Treinos, 20 Progresso, 21 Perfil): título grande, conteúdo
 * que rola e a <Nav> colada embaixo.
 *
 * Não usa <Tela> porque ela põe margem lateral na área segura inteira — e a nav é de
 * borda a borda. Mesmo arranjo da tela 10 (Hoje).
 */
export function TelaDeAba({
  titulo, aba, children, rodape,
}: { titulo?: string; aba: AbaDaNav; children: ReactNode; rodape?: ReactNode }) {
  return (
    <View style={estilos.raiz}>
      <Fundo />
      <SafeAreaView style={estilos.seguro}>
        <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
          {titulo && <Texto papel="h1" accessibilityRole="header">{titulo}</Texto>}
          {children}
        </ScrollView>
        {rodape}
        <Nav ativa={aba} />
      </SafeAreaView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  seguro: { flex: 1 },
  conteudo: { flexGrow: 1, paddingHorizontal: space.s5, paddingTop: space.s6, paddingBottom: space.s5, gap: space.s5 },
});
