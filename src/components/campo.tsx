import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { font, neutral, radius } from '@/theme/tokens';

/**
 * Campo — entrada de texto do design system (component set `Campo` 71:17).
 *
 * Espelho do padrão do Figma: rótulo em caixa alta (SG Medium 12 · LS 0.1em)
 * sobre o "poço" (superfície côncava com `Elevation/Well`). É a mesma geometria
 * dos campos de reps e carga da tela de execução — um só idioma de input no app
 * inteiro. `senha` liga o mascaramento (variante Senha do component set).
 */
export interface CampoProps extends Omit<TextInputProps, 'style'> {
  rotulo: string;
  senha?: boolean;
}

export function Campo({ rotulo, senha, onFocus, onBlur, ...rest }: CampoProps) {
  const [focado, setFocado] = useState(false);

  return (
    <View style={estilos.container}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <View style={estilos.poco}>
        <TextInput
          {...rest}
          secureTextEntry={senha}
          placeholderTextColor={neutral.n400}
          selectionColor={neutral.n100}
          cursorColor={neutral.n100}
          onFocus={(e) => {
            setFocado(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocado(false);
            onBlur?.(e);
          }}
          style={[estilos.input, focado && estilos.inputFocado]}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  // layout_67cbb17d: column, gap 10, alignSelf stretch.
  container: { alignSelf: 'stretch', gap: 10 },
  // Rótulo (style_29b93e62) — SG Medium 12 · LS 0.1em · UPPER · #909090.
  rotulo: {
    fontFamily: font.displayMedium,
    fontSize: 12,
    letterSpacing: 12 * 0.1,
    color: neutral.n300,
    textTransform: 'uppercase',
  },
  // Poço (EL-76bbf3b9): altura 56, padding 16 lateral, fill rgba(0,0,0,0.42),
  // borderRadius 8, sombra interna do Elevation/Well.
  poco: {
    height: 56,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    boxShadow: 'inset 0px 2px 5px rgba(0,0,0,0.55)',
  },
  // Texto do valor (style_4b353e80) — Manrope Regular 17 · #F8F8F8.
  input: {
    flex: 1,
    fontFamily: font.text,
    fontSize: 17,
    color: neutral.n100,
    padding: 0,
  },
  inputFocado: { color: neutral.n100 },
});
