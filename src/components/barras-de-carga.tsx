import { StyleSheet, View } from 'react-native';
import { Texto } from './texto';
import { formatarKg } from '@/lib/formato';
import { accent, neutral, radius, space } from '@/theme/tokens';

/** Do mais antigo ao mais novo: o cinza clareia conforme chega em hoje. */
const TONS = [neutral.n700, neutral.n700, neutral.n600, neutral.n500, neutral.n400, neutral.n300] as const;
const ALTURA = 104;

/**
 * As barras da tela 15: um valor por sessão, mais antiga à esquerda.
 * ⚠️ Ouro só na última barra, e só se ela for recorde (`destacarUltima`) — cor rara é cor
 * que significa. Barra alta sem recorde continua cinza.
 */
export function BarrasDeCarga({
  valores, destacarUltima, sufixo = '',
}: { valores: number[]; destacarUltima: boolean; sufixo?: string }) {
  const maior = Math.max(1, ...valores);
  return (
    <View style={estilos.linha}>
      {valores.map((v, i) => {
        const ultima = i === valores.length - 1;
        const ouro = ultima && destacarUltima;
        const tom = TONS[TONS.length - valores.length + i] ?? neutral.n300;
        return (
          <View key={i} style={estilos.coluna}>
            <View style={estilos.trilho}>
              <View
                style={[
                  estilos.barra,
                  // Piso de 12%: carga baixa ainda é uma sessão que aconteceu.
                  { height: `${Math.max(12, (v / maior) * 100)}%`, backgroundColor: ouro ? accent.signal : tom },
                ]}
              />
            </View>
            <Texto papel="nav" cor={ouro ? accent.signal : neutral.n400}>{formatarKg(v)}{sufixo}</Texto>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', gap: space.s5 },
  coluna: { flex: 1, alignItems: 'center', gap: space.s2 },
  trilho: { height: ALTURA, alignSelf: 'stretch', justifyContent: 'flex-end' },
  barra: { borderRadius: radius.sm / 2 },
});
