import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { accent, neutral } from '@/theme/tokens';

/**
 * O anel do descanso. Duas circunferências: o trilho e o arco que corre.
 *
 * É a única coisa da tela desenhada para ser lida a dois metros de distância —
 * por isso o traço é grosso e o número dentro é `mega`.
 */
export function Anel({
  progresso, tamanho = 236, espessura = 10, children,
}: {
  /** 0 a 1. */
  progresso: number;
  tamanho?: number;
  espessura?: number;
  children?: React.ReactNode;
}) {
  const r = (tamanho - espessura) / 2;
  const volta = 2 * Math.PI * r;
  const restante = Math.max(0, Math.min(1, progresso));

  return (
    <View style={{ width: tamanho, height: tamanho, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={tamanho} height={tamanho} style={{ position: 'absolute' }}>
        <Circle
          cx={tamanho / 2} cy={tamanho / 2} r={r}
          stroke={neutral.n800} strokeWidth={espessura} fill="none"
        />
        <Circle
          cx={tamanho / 2} cy={tamanho / 2} r={r}
          stroke={accent.rest} strokeWidth={espessura} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${volta}`}
          strokeDashoffset={volta * (1 - restante)}
          transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
