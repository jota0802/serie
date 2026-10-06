import { useRef, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { Surgir } from './surgir';
import { Tela } from './tela';
import { Texto } from './texto';
import { Voltar } from './voltar';
import { font, hit, letterSpacing, neutral, radius, role, size, space, surface } from '@/theme/tokens';

/**
 * Moldura das telas 06–09 (a montagem do plano), espelho dos frames `06 · Montagem 1 de 3` e
 * `08 · Montagem 3 de 3` do Figma: o voltar, a barra de progresso logo abaixo dele, o rótulo
 * ("Pergunta 1 de 3"), o título, a explicação em cinza e, no rodapé, a ação primária.
 *
 * O topo é FIXO e igual nas quatro telas, com ou sem voltar e com ou sem barra: na troca de tela
 * (fade de 120 ms) o título não pula. O meio rola — a 06 com o teclado aberto não cabe num
 * iPhone SE, e a 09 lista o plano inteiro — e o rodapé fica acima do teclado
 * (`KeyboardAvoidingView` com `padding` nas DUAS plataformas: no Android com edge-to-edge o
 * `adjustResize` não encolhe a janela, e se encolher, a sobreposição medida é zero e ele não faz nada).
 */
export function TelaDeMontagem({
  passo, rotulo, titulo, descricao, onVoltar, rodape, children,
}: {
  /** Liga a barra de progresso. Sem ele (09), fica só o espaço dela. */
  passo?: { atual: number; de: number };
  rotulo: string;
  titulo: string;
  descricao: string;
  /** Sem ele, o lugar do voltar fica vazio (06 aberta como primeira tela de quem não tem plano). */
  onVoltar?: () => void;
  rodape: ReactNode;
  children: ReactNode;
}) {
  const rolagem = useRef<ScrollView>(null);
  const conteudo = useRef<View>(null);
  const deslocamento = useRef(0);
  const alturaVisivel = useRef(0);

  /**
   * ⚠️ iOS: o teclado sobe, o `KeyboardAvoidingView` encolhe a rolagem e o campo que acabou de
   * ganhar o foco pode ficar atrás do rodapé — digitar às cegas. A UIScrollView não rola sozinha
   * até ele; o Android rola (a ScrollView nativa segura o foco visível quando muda de tamanho).
   */
  const aoMedirRolagem = (evento: LayoutChangeEvent) => {
    const altura = evento.nativeEvent.layout.height;
    const encolheu = altura < alturaVisivel.current;
    alturaVisivel.current = altura;
    if (!encolheu || Platform.OS !== 'ios') return;
    const campo = TextInput.State.currentlyFocusedInput();
    const base = conteudo.current;
    if (!campo || !base) return;
    campo.measureLayout(base, (_x, y, _largura, alturaDoCampo) => {
      const fim = y + alturaDoCampo + space.s4;
      if (fim > deslocamento.current + altura) rolagem.current?.scrollTo({ y: fim - altura, animated: true });
    });
  };

  return (
    <Tela>
      <KeyboardAvoidingView style={estilos.flex} behavior="padding">
        <View>
          {onVoltar ? <Voltar onPress={onVoltar} /> : <View style={estilos.semVoltar} />}
          {passo ? (
            <View style={estilos.trilho}>
              <View style={[estilos.feito, { width: `${(passo.atual / passo.de) * 100}%` }]} />
            </View>
          ) : (
            <View style={estilos.semBarra} />
          )}
        </View>

        <ScrollView
          ref={rolagem}
          style={estilos.flex}
          showsVerticalScrollIndicator={false}
          // O toque no botão ou numa opção vale de primeira com o teclado aberto; no vazio, fecha o teclado.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          onLayout={aoMedirRolagem}
          onScroll={(evento) => {
            deslocamento.current = evento.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          <View ref={conteudo} collapsable={false} style={estilos.conteudo}>
            {/* A pergunta surge primeiro, as opções logo depois (o `Surgir`, em todas as plataformas). */}
            <Surgir ordem={0} style={estilos.cabecalho}>
              <Texto papel="eyebrow" style={estilos.rotulo}>{rotulo}</Texto>
              <Texto papel="h1" accessibilityRole="header" style={estilos.titulo}>{titulo}</Texto>
              <Texto papel="desc" cor={neutral.n400}>{descricao}</Texto>
            </Surgir>
            <Surgir ordem={1}>{children}</Surgir>
          </View>
        </ScrollView>

        <View style={estilos.rodape}>{rodape}</View>
      </KeyboardAvoidingView>
    </Tela>
  );
}

/** A barra do Figma: 3 px, de borda a borda da área de conteúdo. */
const ESPESSURA_DA_BARRA = 3;

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  // O mesmo alvo do <Voltar>: sem ele, a barra e o título ficam exatamente onde estariam.
  semVoltar: { height: hit.min },
  trilho: {
    height: ESPESSURA_DA_BARRA,
    borderRadius: radius.full,
    backgroundColor: surface.line,
    overflow: 'hidden',
  },
  // O que já foi respondido é tinta cheia — a mesma régua da série feita.
  feito: { height: ESPESSURA_DA_BARRA, borderRadius: radius.full, backgroundColor: role.done },
  semBarra: { height: ESPESSURA_DA_BARRA },
  // 32 da barra até o rótulo; 28 entre a explicação e o conteúdo (o `campos` das telas de conta).
  conteudo: { paddingTop: space.s6, paddingBottom: space.s4, gap: space.s5 + space.s1 },
  cabecalho: { gap: space.s2 },
  // No Figma o rótulo destas telas é o do <Campo> (Space Grotesk Medium), não o eyebrow Manrope
  // das abas: na 06 ele e os rótulos dos campos são o mesmo estilo, lado a lado.
  rotulo: { fontFamily: font.displayMedium },
  // H1 · SG Bold 30 · LS -0,025em, como o título das telas de conta.
  titulo: { letterSpacing: size.h1 * letterSpacing.display },
  rodape: { paddingTop: space.s4, paddingBottom: space.s4 },
});
