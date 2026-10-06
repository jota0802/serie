import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Fechar } from './icones';
import { Lupa } from './icones-de-edicao';
import { font, hit, neutral, radius, space } from '@/theme/tokens';

/**
 * A busca da tela 19 · Escolher exercício: o mesmo POÇO do <Campo> (superfície côncava, 56 de
 * altura, Manrope 17), com a lupa na frente e sem rótulo em cima — como no Figma.
 *
 * ⚠️ O fundo e a sombra interna são os do poço do `campo.tsx` (`Elevation/Well`): mexeu lá,
 * confira aqui. O "×" limpa a busca nas três plataformas (o `clearButtonMode` é só do iOS).
 */
export function CampoDeBusca({
  value, onChangeText, ...rest
}: Omit<TextInputProps, 'style' | 'value' | 'onChangeText'> & { value: string; onChangeText: (texto: string) => void }) {
  return (
    <View style={estilos.poco}>
      <Lupa tamanho={20} cor={neutral.n400} />
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={neutral.n400}
        selectionColor={neutral.n100}
        cursorColor={neutral.n100}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={estilos.entrada}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Limpar a busca"
          style={estilos.limpar}
        >
          <Fechar tamanho={16} cor={neutral.n300} />
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  poco: {
    height: hit.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
    paddingLeft: space.s4,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.42)',
    boxShadow: 'inset 0px 2px 5px rgba(0,0,0,0.55)',
  },
  // Manrope Regular 17 · #F8F8F8 — o valor do <Campo>. A margem da direita é do texto, para ele
  // não encostar na borda nem no "×".
  entrada: {
    flex: 1,
    height: hit.row,
    fontFamily: font.text,
    fontSize: 17,
    color: neutral.n100,
    padding: 0,
    paddingRight: space.s4,
  },
  limpar: { width: hit.min + space.s1, height: hit.row, alignItems: 'center', justifyContent: 'center' },
});
