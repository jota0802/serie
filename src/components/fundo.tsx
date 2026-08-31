import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { neutral } from '@/theme/tokens';

/**
 * O canvas da Série: gradientes radiais empilhados sobre o preto.
 * Grafite frio em cima à esquerda, brasa quente em cima à direita — ferro e esforço.
 *
 * `aquecido` acrescenta um terceiro glow de brasa embaixo: é a variante da tela de
 * execução, onde A TELA ESQUENTA ENQUANTO VOCÊ LEVANTA, sem inventar cor nova.
 *
 * ☠️ `rx`/`ry` NÃO existem em `<radialGradient>` de SVG — o navegador ignora e cai
 * no `r` padrão de 50%, virando círculo. Como os gradientes do Figma são elipses
 * LARGAS e BAIXAS, o resultado saía estreito e centralizado. O jeito correto é
 * `r` + `gradientTransform`: escalar em torno do centro converte o círculo na
 * elipse pretendida, e funciona igual no navegador e no nativo.
 */
type Glow = {
  id: string;
  cor: string;
  /** Centro e raios em fração da tela, iguais aos do `--sf-canvas`. */
  cx: number; cy: number; rx: number; ry: number;
  /** Onde o glow termina de desaparecer. */
  fim: number;
};

const GLOWS: Glow[] = [
  { id: 'frio', cor: '#1B2428', cx: 0.14, cy: -0.08, rx: 1.2, ry: 0.8, fim: 0.58 },
  { id: 'brasa', cor: '#241D14', cx: 0.96, cy: 0.02, rx: 0.92, ry: 0.6, fim: 0.52 },
];

const BRASA_BAIXO: Glow = {
  id: 'brasaBaixo', cor: '#3A2A12', cx: 0.5, cy: 1.02, rx: 1.05, ry: 0.46, fim: 0.62,
};

/**
 * Elipse a partir de um círculo de r=0,5.
 * A escala é em torno do PRÓPRIO centro do gradiente — por isso o círculo nasce em
 * (cx, cy) e não em (0,5, 0,5): escalar em torno de outro ponto arrastaria o centro junto.
 */
const elipse = ({ cx, cy, rx, ry }: Glow) =>
  `translate(${cx} ${cy}) scale(${rx / 0.5} ${ry / 0.5}) translate(${-cx} ${-cy})`;

export function Fundo({ aquecido = false }: { aquecido?: boolean }) {
  const glows = aquecido ? [...GLOWS, BRASA_BAIXO] : GLOWS;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          {glows.map((g) => (
            <RadialGradient key={g.id} id={g.id} cx={String(g.cx)} cy={String(g.cy)} r="0.5" gradientTransform={elipse(g)}>
              <Stop offset="0" stopColor={g.cor} stopOpacity="1" />
              <Stop offset={String(g.fim)} stopColor={g.cor} stopOpacity="0" />
            </RadialGradient>
          ))}
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={neutral.n1000} />
        {glows.map((g) => (
          <Rect key={g.id} x="0" y="0" width="100%" height="100%" fill={`url(#${g.id})`} />
        ))}
      </Svg>
    </View>
  );
}
