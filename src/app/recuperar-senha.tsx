import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Voltar } from '@/components/voltar';
import { font, neutral, space, surface } from '@/theme/tokens';

/** Tela 04 · Recuperar senha — a construir. Placeholder pra fechar a navegação da 02. */
export default function RecuperarSenha() {
  const router = useRouter();
  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.body}>
        <Voltar onPress={() => router.back()} />
        <Text style={estilos.titulo}>Recuperar senha</Text>
        <Text style={estilos.nota}>tela em construção.</Text>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: surface.base },
  body: { flex: 1, paddingHorizontal: space.s5 },
  titulo: { fontFamily: font.display, fontSize: 30, letterSpacing: 30 * -0.025, color: neutral.n100 },
  nota: { fontFamily: font.text, fontSize: 15, color: neutral.n400, paddingTop: 12 },
});
