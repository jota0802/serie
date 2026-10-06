import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { accent, font, hit, neutral, radius, size, space } from '@/theme/tokens';

/**
 * O botão SEM relevo — o par do <BotaoPrimario> para tudo o que não é a ação primária da tela
 * ("Cancelar", "Continuar treinando", o "Salvar" da correção na linha). O relevo é racionado: um
 * por tela, e nunca no meio de uma lista.
 *
 * Mesma geometria dos botões da confirmação do Perfil:
 *  - `neutro`: superfície n700, tinta n100 — o caminho seguro;
 *  - `tinta`: tinta cheia (n100) e texto n1000 — confirma algo que não destrói nada;
 *  - `perigo`: SÓ ação destrutiva (`accent.danger`), com texto n0 (6,7:1, passa AA).
 *
 * Alvo de `hit.min` (44), o piso da `CAR-11.3`.
 */
export type VarianteDoBotaoLiso = 'neutro' | 'tinta' | 'perigo';

const FUNDO: Record<VarianteDoBotaoLiso, string> = {
  neutro: neutral.n700,
  tinta: neutral.n100,
  perigo: accent.danger,
};

const TEXTO: Record<VarianteDoBotaoLiso, string> = {
  neutro: neutral.n100,
  tinta: neutral.n1000,
  perigo: neutral.n0,
};

export function BotaoLiso({
  children, onPress, variante = 'neutro', rotuloDeAcessibilidade, style,
}: {
  children: string;
  onPress: () => void;
  variante?: VarianteDoBotaoLiso;
  /** Quando o rótulo sozinho não diz o que acontece ("Apagar" → "Apagar o treino de seg, 5 out"). */
  rotuloDeAcessibilidade?: string;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotuloDeAcessibilidade}
      style={({ pressed }) => [estilos.base, { backgroundColor: FUNDO[variante] }, pressed && estilos.pressionado, style]}
    >
      <Text style={[estilos.rotulo, { color: TEXTO[variante] }]}>{children}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: hit.min,
    borderRadius: radius.md,
    paddingHorizontal: space.s4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressionado: { opacity: 0.86 },
  rotulo: { fontFamily: font.textMedium, fontSize: size.body, textAlign: 'center' },
});
