import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario } from '@/components/botao-primario';
import { Marca } from '@/components/marca';
import { font, neutral, space, surface } from '@/theme/tokens';

/**
 * Tela 01 · Abertura — a porta de entrada do app.
 *
 * Espelho do frame `01 · Abertura` (390 × 844) do Figma. A composição é uma só:
 * marca centralizada verticalmente (com espaços flex acima e abaixo), duas ações
 * empilhadas no rodapé. Um caminho para quem chega novo, outro para quem já tem
 * conta — e nada mais na tela pra tirar a atenção.
 *
 * Fundo: por ora o `#0E0E0E` sólido. Os dois gradientes radiais do `Canvas/Base`
 * (grafite frio + brasa quente) entram junto com o resto do CP5, onde o
 * `react-native-svg` já vai estar no bundle.
 */
export default function Abertura() {
  const router = useRouter();

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.body}>
        <View style={estilos.espaco} />

        <View style={estilos.marca}>
          <Marca largura={60} pill />
          <View style={estilos.nome}>
            <Text style={estilos.serie}>Série.</Text>
            <Text style={estilos.tagline}>
              Ele não te dá treino.{'\n'}Ele te diz o que bater hoje.
            </Text>
          </View>
        </View>

        <View style={estilos.espaco} />

        <View style={estilos.acoes}>
          <BotaoPrimario onPress={() => router.push('/hoje')}>Montar meu treino</BotaoPrimario>
          <BotaoPrimario variante="secundario" onPress={() => router.push('/entrar')}>
            Já tenho conta
          </BotaoPrimario>
        </View>

        <View style={estilos.gap} />
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: surface.base },
  // body do Figma (EL-31a3156f): padding lateral 24, empilha em coluna.
  body: { flex: 1, paddingHorizontal: space.s5 },
  // Os dois "espaço" (EL-07249188) que empurram a marca pro centro vertical.
  espaco: { flex: 1 },
  // "Marca" (24:73): coluna, itens centrados, gap 26.
  marca: { alignItems: 'center', gap: 26 },
  // "nome" (24:78): coluna, itens centrados, gap 14.
  nome: { alignSelf: 'stretch', alignItems: 'center', gap: 14 },
  // "Série." — Space Grotesk Bold 56 · LS -0.045em · LH 1.08 · #F8F8F8.
  serie: {
    fontFamily: font.display,
    fontSize: 56,
    lineHeight: 56 * 1.08,
    letterSpacing: 56 * -0.045,
    color: neutral.n100,
    textAlign: 'left',
  },
  // Tagline (style_1f38beb1) — Manrope Regular 16 · LH 1.55em · CENTER · #909090.
  tagline: {
    fontFamily: font.text,
    fontSize: 16,
    lineHeight: 16 * 1.55,
    color: neutral.n300,
    textAlign: 'center',
  },
  // "ações" (EL-1519dabc): coluna, stretch, gap 12.
  acoes: { alignSelf: 'stretch', gap: 12 },
  // "gap" final (EL-781c5bca): 16 px fixos antes do home indicator.
  gap: { height: 16 },
});
