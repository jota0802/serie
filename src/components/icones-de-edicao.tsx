import Svg, { Circle, Path } from 'react-native-svg';
import { neutral } from '@/theme/tokens';

/**
 * Os ícones das telas que editam o plano (17 Meus treinos, 18 Montar treino, 19 Escolher
 * exercício), no mesmo traço dos de `icones.tsx`: 24 × 24, linha de 2, ponta redonda.
 *
 * ⚠️ `CAR-11.3`: o glifo é pequeno, quem recebe o toque é sempre um embrulho de 44 pt.
 */
type Props = { tamanho?: number; cor?: string };

/** "+" — adicionar (exercício, treino) e aumentar um número. */
export function Mais({ tamanho = 20, cor = neutral.n100 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d="M12 5 V19 M5 12 H19" stroke={cor} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** "−" — diminuir um número. */
export function Menos({ tamanho = 20, cor = neutral.n100 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d="M5 12 H19" stroke={cor} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** A lupa do campo de busca (19). */
export function Lupa({ tamanho = 20, cor = neutral.n400 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Circle cx={10.5} cy={10.5} r={6} stroke={cor} strokeWidth={2} fill="none" />
      <Path d="M15 15 L20 20" stroke={cor} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
