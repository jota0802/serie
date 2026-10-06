import { Pressable, StyleSheet } from 'react-native';

import { Texto } from './texto';
import { hit, neutral, radius, role, space, surface } from '@/theme/tokens';

/**
 * Uma resposta de escolha única da montagem (07 · dias, 08 · objetivo): cartão de borda fina, e
 * o escolhido ganha a borda em tinta cheia (`role.target`, o mesmo do "alvo de hoje") e a
 * superfície de card por baixo. O detalhe clareia um degrau junto, como no Figma.
 *
 * `empilhada` põe o detalhe embaixo do título (08); sem ela, os dois dividem a linha e o detalhe
 * vai para a direita (07). A linha tem `hit.row` de altura: o cartão inteiro é o alvo de toque.
 */
export function Opcao({
  titulo, detalhe, escolhida, onPress, empilhada = false,
}: {
  titulo: string;
  detalhe: string;
  escolhida: boolean;
  onPress: () => void;
  empilhada?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: escolhida }}
      accessibilityLabel={`${titulo}, ${detalhe}`}
      style={({ pressed }) => [
        estilos.base,
        empilhada ? estilos.empilhada : estilos.emLinha,
        escolhida && estilos.escolhida,
        pressed && !escolhida && estilos.pressionada,
      ]}
    >
      <Texto papel="h2" numberOfLines={1} style={!empilhada && estilos.tituloEmLinha}>
        {titulo}
      </Texto>
      <Texto
        papel="desc"
        cor={escolhida ? neutral.n300 : neutral.n400}
        numberOfLines={empilhada ? 2 : 1}
        style={!empilhada && estilos.detalheEmLinha}
      >
        {detalhe}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: hit.row,
    paddingHorizontal: space.s4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surface.line,
  },
  emLinha: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
  empilhada: { justifyContent: 'center', paddingVertical: space.s4, gap: space.s1 },
  escolhida: { borderColor: role.target, backgroundColor: surface.raised },
  pressionada: { backgroundColor: surface.rowActive },
  // "4 dias" fica inteiro; quem cede é o detalhe. Sem `flex: 0`: no navegador vira `0 1 0%` e encolhe.
  tituloEmLinha: { flexShrink: 0 },
  detalheEmLinha: { flex: 1, textAlign: 'right' },
});
