import { Pressable, StyleSheet, View } from 'react-native';
import { Chevron } from './icones';
import { Texto } from './texto';
import { hit, neutral, space, surface } from '@/theme/tokens';

/**
 * Uma variação oferecida na troca (tela 16 · `CAR-9`): nome + o porquê dela caber
 * ("Mesmo padrão · sugestão: 47,5 kg"). A linha inteira é o alvo de toque (`CAR-11.3`).
 */
export function LinhaDeAlternativa({
  nome, detalhe, onPress, ultima = false,
}: { nome: string; detalhe: string; onPress: () => void; ultima?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Trocar por ${nome}`}
      style={({ pressed }) => [estilos.linha, !ultima && estilos.divisor, pressed && estilos.pressionada]}
    >
      <View style={estilos.texto}>
        <Texto papel="h2" numberOfLines={1}>{nome}</Texto>
        <Texto papel="desc" cor={neutral.n300} numberOfLines={1}>{detalhe}</Texto>
      </View>
      <Chevron tamanho={20} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  linha: {
    minHeight: hit.row + space.s4,
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
    paddingVertical: space.s3,
  },
  divisor: { borderBottomWidth: 1, borderBottomColor: surface.line },
  pressionada: { opacity: 0.7 },
  texto: { flex: 1, gap: 2 },
});
