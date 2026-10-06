import { StyleSheet, Text } from 'react-native';

import { font, neutral, space } from '@/theme/tokens';

/**
 * A frase de erro (ou de confirmação) de um formulário de conta: "E-mail ou senha incorretos".
 *
 * Neutra de propósito — vermelho é SÓ ação destrutiva no app (`tokens.accent.danger`), e errar a
 * senha não é destruir nada. `polite` faz o leitor de tela anunciar a frase quando ela aparece.
 */
export function AvisoDeFormulario({ children }: { children: string | null | undefined }) {
  if (!children) return null;
  return (
    <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={estilos.aviso}>
      {children}
    </Text>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    fontFamily: font.text,
    fontSize: 14,
    lineHeight: 20,
    color: neutral.n200,
    paddingTop: space.s3,
  },
});
