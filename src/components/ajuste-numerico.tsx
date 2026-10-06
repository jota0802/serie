import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Mais, Menos } from './icones-de-edicao';
import { Texto } from './texto';
import { hit, neutral, radius, space } from '@/theme/tokens';

/**
 * Uma linha "rótulo ······ (−) valor (+)" — os ajustes de um exercício na tela 18 (séries,
 * repetições, carga, descanso).
 *
 * O componente só desenha e avisa: quem decide o número novo e se ele vale é a tela, pelas regras
 * de `src/domain/edicao-plano.ts`. `podeDiminuir`/`podeAumentar` apagam o botão no limite (sai
 * dos `LIMITES` do domínio), para a pessoa ver o fim antes de bater nele.
 *
 * Os botões são quadrados de `hit.min` (`CAR-11.3`): é o toque que mais se repete nesta tela.
 */
export function AjusteNumerico({
  rotulo, detalhe, valor, unidade, valorEmTexto = false,
  aoDiminuir, aoAumentar, podeDiminuir = true, podeAumentar = true,
}: {
  rotulo: string;
  /** Linha cinza embaixo do rótulo ("por mão", "padrão do exercício"), ou um link no lugar dela. */
  detalhe?: ReactNode;
  valor: string;
  unidade?: string;
  /** Valor que é palavra ("peso do corpo"): corpo de texto, não número de display. */
  valorEmTexto?: boolean;
  aoDiminuir: () => void;
  aoAumentar: () => void;
  podeDiminuir?: boolean;
  podeAumentar?: boolean;
}) {
  const nome = rotulo.toLowerCase();
  return (
    <View style={estilos.linha}>
      {/* O rótulo quebra em vez de cortar: em 360 px "Reps mínimas" não cabe inteiro numa linha. */}
      <View style={estilos.rotulos}>
        <Texto papel="corpo">{rotulo}</Texto>
        {typeof detalhe === 'string' ? <Texto papel="desc" cor={neutral.n400}>{detalhe}</Texto> : detalhe}
      </View>

      <View style={estilos.controle}>
        <BotaoDoAjuste sinal="menos" rotulo={`Diminuir ${nome}`} ativo={podeDiminuir} onPress={aoDiminuir} />
        <View
          style={estilos.valor}
          accessible
          accessibilityLabel={`${rotulo}: ${valor}${unidade ? ` ${unidade}` : ''}`}
          accessibilityLiveRegion="polite"
        >
          <Texto papel={valorEmTexto ? 'corpo' : 'h2'} numberOfLines={1}>{valor}</Texto>
          {unidade ? <Texto papel="desc" cor={neutral.n400}>{` ${unidade}`}</Texto> : null}
        </View>
        <BotaoDoAjuste sinal="mais" rotulo={`Aumentar ${nome}`} ativo={podeAumentar} onPress={aoAumentar} />
      </View>
    </View>
  );
}

function BotaoDoAjuste({
  sinal, rotulo, ativo, onPress,
}: { sinal: 'mais' | 'menos'; rotulo: string; ativo: boolean; onPress: () => void }) {
  const Icone = sinal === 'mais' ? Mais : Menos;
  return (
    <Pressable
      onPress={onPress}
      disabled={!ativo}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: !ativo }}
      style={({ pressed }) => [estilos.botao, pressed && estilos.pressionado, !ativo && estilos.desligado]}
    >
      <Icone tamanho={18} cor={ativo ? neutral.n100 : neutral.n400} />
    </Pressable>
  );
}

/** Largura mínima do número: de "4" para "10" os botões não andam a cada toque. */
const LARGURA_DO_VALOR = 64;

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: space.s3, minHeight: hit.min },
  rotulos: { flex: 1, gap: 2 },
  controle: { flexDirection: 'row', alignItems: 'center', gap: space.s1 },
  valor: {
    minWidth: LARGURA_DO_VALOR,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingHorizontal: space.s1,
  },
  // Tátil: o que se toca tem superfície própria (n700 sobre o card n850), sem relevo — o relevo é
  // da ação primária, e esta tela não tem uma só.
  botao: {
    width: hit.min,
    height: hit.min,
    borderRadius: radius.md,
    backgroundColor: neutral.n700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressionado: { backgroundColor: neutral.n600 },
  desligado: { backgroundColor: 'transparent', borderWidth: 1, borderColor: neutral.n800 },
});
