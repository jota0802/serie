import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { neutral } from '@/theme/tokens';

/**
 * Ícones desenhados à mão em SVG, para bater com o traço do Figma.
 *
 * ⚠️ `CAR-11.3`: o glifo é pequeno, mas quem recebe o toque é sempre um embrulho de
 * 44 pt. Não infle o desenho para aumentar o alvo — embrulhe.
 */
type Props = { tamanho?: number; cor?: string };

export function Fechar({ tamanho = 22, cor = neutral.n100 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d="M5 5 L19 19 M19 5 L5 19" stroke={cor} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function Chevron({ tamanho = 18, cor = neutral.n300 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d="M9 5 L16 12 L9 19" stroke={cor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** A seta que acompanha "Subiu de 40 kg". Só aparece em ouro. */
export function SetaCima({ tamanho = 16, cor = neutral.n100 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d="M12 19 L12 5 M6 11 L12 5 L18 11" stroke={cor} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** `CAR-9`: trocar exercício. Duas setas opostas — troca, não recarrega. */
export function Troca({ tamanho = 18, cor = neutral.n200 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d="M4 8 H17 M14 5 L17 8 L14 11 M20 16 H7 M10 13 L7 16 L10 19"
        stroke={cor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function Check({ tamanho = 14, cor = neutral.n1000 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d="M5 13 L10 18 L19 6" stroke={cor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** O ícone da aba Hoje é a própria marca: três barras crescentes. */
export function IconeHoje({ tamanho = 22, cor = neutral.n100 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Rect x={3} y={5} width={9} height={3} rx={1.5} fill={cor} />
      <Rect x={3} y={10.5} width={14} height={3} rx={1.5} fill={cor} />
      <Rect x={3} y={16} width={18} height={3} rx={1.5} fill={cor} />
    </Svg>
  );
}

export function IconeProgresso({ tamanho = 22, cor = neutral.n400 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Rect x={4} y={13} width={3.4} height={7} rx={1.2} fill={cor} />
      <Rect x={10.3} y={7} width={3.4} height={13} rx={1.2} fill={cor} />
      <Rect x={16.6} y={10} width={3.4} height={10} rx={1.2} fill={cor} />
    </Svg>
  );
}

/** Aba Treinos: uma barra com anilhas nas pontas. */
export function IconeTreinos({ tamanho = 22, cor = neutral.n400 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d="M7 12 H17" stroke={cor} strokeWidth={2} strokeLinecap="round" />
      <Rect x={3} y={8} width={3} height={8} rx={1.2} fill={cor} />
      <Rect x={18} y={8} width={3} height={8} rx={1.2} fill={cor} />
    </Svg>
  );
}

export function IconePerfil({ tamanho = 22, cor = neutral.n400 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Circle cx={12} cy={8.5} r={3.6} stroke={cor} strokeWidth={2} fill="none" />
      <Path d="M4.8 20 C5.6 15.9 8.5 14 12 14 C15.5 14 18.4 15.9 19.2 20"
        stroke={cor} strokeWidth={2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}
