import { Text, type TextProps, type TextStyle } from 'react-native';
import { font, letterSpacing, lineHeight, neutral, size } from '@/theme/tokens';

/**
 * Os papéis de texto da Série. Nomes iguais aos 11 estilos de texto do Figma.
 * Regra herdada: UM NÚMERO DOMINANTE POR TELA — por isso `mega` e `colossal`
 * não são estilos de uso livre.
 */
export type PapelDeTexto =
  | 'colossal' | 'mega' | 'hero' | 'h1' | 'h2'
  | 'corpo' | 'desc' | 'eyebrow' | 'nav';

const ESTILOS: Record<PapelDeTexto, TextStyle> = {
  // SÓ a tela de execução. O maior número do app.
  colossal: { fontFamily: font.display, fontSize: size.colossal, lineHeight: size.colossal * lineHeight.tight, letterSpacing: size.colossal * letterSpacing.display, color: neutral.n100 },
  mega: { fontFamily: font.display, fontSize: size.mega, lineHeight: size.mega * lineHeight.tight, letterSpacing: size.mega * letterSpacing.display, color: neutral.n100 },
  hero: { fontFamily: font.display, fontSize: size.hero, lineHeight: size.hero * lineHeight.tight, letterSpacing: size.hero * letterSpacing.display, color: neutral.n100 },
  h1: { fontFamily: font.display, fontSize: size.h1, lineHeight: size.h1 * lineHeight.tight, color: neutral.n100 },
  h2: { fontFamily: font.displayMedium, fontSize: size.h2, lineHeight: size.h2 * 1.2, color: neutral.n100 },
  corpo: { fontFamily: font.text, fontSize: size.body, lineHeight: size.body * lineHeight.body, color: neutral.n100 },
  desc: { fontFamily: font.text, fontSize: size.desc, lineHeight: size.desc * lineHeight.body, color: neutral.n300 },
  // Rótulo da barra de navegação: 12 px, mas sem caixa alta — o eyebrow é para seção.
  nav: { fontFamily: font.textMedium, fontSize: size.micro, lineHeight: size.micro * 1.3, color: neutral.n300 },
  // Rótulo em caixa alta, nunca frase.
  eyebrow: { fontFamily: font.textBold, fontSize: size.micro, lineHeight: size.micro * 1.3, letterSpacing: size.micro * letterSpacing.eyebrow, color: neutral.n300, textTransform: 'uppercase' },
};

export interface TextoProps extends TextProps {
  papel?: PapelDeTexto;
  cor?: string;
}

export function Texto({ papel = 'corpo', cor, style, ...rest }: TextoProps) {
  return <Text style={[ESTILOS[papel], cor ? { color: cor } : null, style]} {...rest} />;
}
