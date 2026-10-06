import { Pressable, StyleSheet, View } from 'react-native';

import { diaCurto, diaPorExtenso, resumoDaSessao } from './formato-do-historico';
import { Chevron } from './icones';
import { Texto } from './texto';
import type { SessaoFechada } from '@/domain/historico';
import { accent, font, hit, neutral, radius, size, space, surface } from '@/theme/tokens';

/**
 * Um treino concluído na lista do histórico: a letra, o dia, o nome e "18 séries · 4.320 kg ·
 * 52 min". A linha inteira é o alvo de toque e leva ao detalhe, onde ele é corrigido ou apagado.
 *
 * A letra no quadrado é a mesma da aba Treinos (17): descendo a lista, o rodízio A · B · C se lê
 * sem ler. Ouro SÓ no selo de recorde (`CAR-5`) — o único lugar de cor da lista.
 */
export function LinhaDoHistorico({
  sessao, nome, recorde, onPress, ultima = false,
}: {
  sessao: SessaoFechada;
  /** O nome da letra no plano, ou "Treino X" se ela saiu do plano. */
  nome: string;
  recorde: boolean;
  onPress: () => void;
  ultima?: boolean;
}) {
  const resumo = resumoDaSessao(sessao);
  const treino = nome === `Treino ${sessao.treinoId}` ? nome : `Treino ${sessao.treinoId}, ${nome}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${diaPorExtenso(sessao.fimMs)}. ${treino}. ${resumo.split(' · ').join(', ')}${recorde ? '. Teve recorde' : ''}`}
      style={({ pressed }) => [estilos.linha, !ultima && estilos.divisor, pressed && estilos.pressionada]}
    >
      <View style={estilos.letra}>
        <Texto style={estilos.letraTexto}>{sessao.treinoId}</Texto>
      </View>

      <View style={estilos.textos}>
        <View style={estilos.topo}>
          <Texto papel="corpo" numberOfLines={1} style={estilos.dia}>{diaCurto(sessao.fimMs)}</Texto>
          {recorde && <SeloDeRecorde />}
        </View>
        <Texto papel="desc" cor={neutral.n200} numberOfLines={1}>{nome}</Texto>
        <Texto papel="desc" numberOfLines={1}>{resumo}</Texto>
      </View>

      <Chevron />
    </Pressable>
  );
}

/** O selo "recorde": a pílula do `Card ouro`, em miniatura. */
export function SeloDeRecorde() {
  return (
    <View style={estilos.selo}>
      <Texto papel="eyebrow" cor={accent.signal}>Recorde</Texto>
    </View>
  );
}

const LETRA = 40;

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s4,
    minHeight: hit.row,
    paddingVertical: space.s3,
  },
  divisor: { borderBottomWidth: 1, borderBottomColor: surface.line },
  pressionada: { backgroundColor: surface.rowActive },
  // O quadrado da letra da aba Treinos, sem o preenchimento do "próximo".
  letra: {
    width: LETRA,
    height: LETRA,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: surface.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letraTexto: { fontFamily: font.display, fontSize: size.body, color: neutral.n100 },
  textos: { flex: 1, gap: 2 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  // O dia fica inteiro; quem cede é o selo. Sem `flex: 0`: no navegador vira `0 1 0%` e encolhe.
  dia: { flexShrink: 1, fontFamily: font.textMedium },
  selo: {
    paddingHorizontal: space.s2,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: surface.recordLine,
    backgroundColor: accent.signalDim,
  },
});
