import { StyleSheet, View } from 'react-native';
import { Check } from './icones';
import { Texto } from './texto';
import { formatarKg } from '@/lib/formato';
import { hit, neutral, radius, role, space, surface } from '@/theme/tokens';

/**
 * `Linha de série` — o REGISTRO: o que você fez.
 * Não confundir com `Linha de exercício`, que é a PRESCRIÇÃO: o que o treino manda.
 * A distinção evita sopa, e é a mesma do arquivo do Figma.
 *
 * Três estados, e a cor deles é toda neutra:
 *   feita     tinta cheia
 *   ativa     tinta cheia + tinte de fundo + borda
 *   pendente  cinza, porque ainda não aconteceu
 *
 * ⚠️ Série falhada NÃO é vermelha (`CAR-3.1`). Vermelho é só para ação destrutiva.
 */
export type EstadoDaLinha = 'feita' | 'ativa' | 'pendente';

export function LinhaDeSerie({
  numero, estado, reps, cargaKg, faixa,
}: {
  numero: number;
  estado: EstadoDaLinha;
  /** Ausente numa linha pendente — aí a tela mostra um traço. */
  reps?: number;
  cargaKg: number;
  /** Mostrada no lugar das reps quando a série é a ativa: é o alvo, não o feito. */
  faixa?: { min: number; max: number };
}) {
  const feita = estado === 'feita';
  const ativa = estado === 'ativa';
  const corTexto = estado === 'pendente' ? role.pending : role.done;

  return (
    <View style={[estilos.linha, ativa && estilos.ativa]}>
      <View style={[estilos.numero, feita && estilos.numeroFeito, ativa && estilos.numeroAtivo]}>
        {feita ? <Check /> : <Texto papel="desc" cor={ativa ? role.done : role.pending}>{numero}</Texto>}
      </View>

      <View style={estilos.valor}>
        <Texto papel="h2" cor={corTexto}>
          {ativa && faixa ? `${faixa.min}–${faixa.max}` : (reps ?? '—')}
        </Texto>
        <Texto papel="desc" cor={neutral.n400}> reps</Texto>
      </View>

      <View style={estilos.valor}>
        <Texto papel="h2" cor={corTexto}>{formatarKg(cargaKg)}</Texto>
        <Texto papel="desc" cor={neutral.n400}> kg</Texto>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    // 56 px, não 44: mão suada, e este é o gesto mais repetido do app.
    minHeight: hit.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
    paddingHorizontal: space.s3,
    paddingVertical: space.s2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  ativa: { backgroundColor: surface.rowActive, borderColor: surface.line2 },
  numero: {
    width: 28, height: 28, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: neutral.n600,
  },
  numeroFeito: { backgroundColor: neutral.n100, borderColor: neutral.n100 },
  numeroAtivo: { borderColor: neutral.n100 },
  valor: { flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end' },
});
