import { StyleSheet, View } from 'react-native';
import { Texto } from './texto';
import type { EstadoDeVolume } from '@/domain/volume';
import { font, neutral, radius, space, surface } from '@/theme/tokens';

/**
 * Uma barra do `CAR-4`: séries do grupo na semana contra a faixa 10–20.
 *
 * ⚠️ Abaixo da faixa a barra fica APAGADA e o número em negrito — não vermelha. Volume
 * baixo é informação, não alarme (mesma régua da `CAR-3.1`); e cor no app é só recorde.
 * O risquinho marca o piso da faixa: dá para ver o quanto falta sem ler número.
 */
export function BarraDeVolume({
  rotulo, series, estado, escala, piso,
}: { rotulo: string; series: number; estado: EstadoDeVolume; escala: number; piso: number }) {
  const abaixo = estado === 'abaixo';
  const fracao = escala > 0 ? Math.min(1, series / escala) : 0;
  return (
    <View
      style={estilos.raiz}
      accessible
      accessibilityLabel={`${rotulo}: ${series} séries${abaixo ? ', abaixo da faixa' : ''}`}
    >
      <View style={estilos.topo}>
        <Texto papel="corpo" cor={abaixo ? neutral.n200 : neutral.n100}>{rotulo}</Texto>
        <Texto papel={abaixo ? 'corpo' : 'desc'} style={abaixo && estilos.numeroAbaixo}>
          {series}
        </Texto>
      </View>
      <View style={estilos.trilho}>
        <View style={[estilos.cheio, abaixo && estilos.cheioAbaixo, { width: `${fracao * 100}%` }]} />
        <View style={[estilos.piso, { left: `${(piso / escala) * 100}%` }]} />
      </View>
    </View>
  );
}

const ALTURA = 8;

const estilos = StyleSheet.create({
  raiz: { gap: space.s2 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  numeroAbaixo: { fontFamily: font.textBold, color: neutral.n100 },
  trilho: { height: ALTURA, borderRadius: radius.full, backgroundColor: neutral.n800, overflow: 'hidden' },
  cheio: { height: ALTURA, borderRadius: radius.full, backgroundColor: neutral.n100 },
  cheioAbaixo: { backgroundColor: neutral.n500 },
  piso: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: surface.line2 },
});
