import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { font, neutral, space, surface } from '@/theme/tokens';

/** Tela 05 · Link enviado — a construir. Placeholder pra fechar a navegação da 04. */
export default function LinkEnviado() {
  const router = useRouter();
  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.body}>
        <Text style={estilos.titulo}>Link enviado</Text>
        <Text style={estilos.nota}>tela em construção.</Text>
        <Text
          style={estilos.link}
          onPress={() => router.replace('/entrar')}
          accessibilityRole="link"
        >
          Voltar para entrar
        </Text>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: surface.base },
  body: { flex: 1, paddingHorizontal: space.s5, gap: space.s5, justifyContent: 'center' },
  titulo: { fontFamily: font.display, fontSize: 30, letterSpacing: 30 * -0.025, color: neutral.n100, textAlign: 'center' },
  nota: { fontFamily: font.text, fontSize: 15, color: neutral.n400, textAlign: 'center' },
  link: { fontFamily: font.textMedium, fontSize: 15, color: neutral.n100, textAlign: 'center' },
});
