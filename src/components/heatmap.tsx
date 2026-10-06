import { memo, useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Texto } from './texto';
import { rotulosDosMeses, type DiaDoCalendario, type Nivel } from '@/domain/calendario';
import { accent, neutral, radius, space, surface } from '@/theme/tokens';

/**
 * O heatmap do Início: o ano em quadrados (RN-50 a RN-52, `docs/regras-do-app.md`).
 *
 * 53 colunas (semanas) × 7 linhas (domingo em cima). Não cabe na largura do celular, então a grade
 * rola na horizontal e abre ROLADA ATÉ O FIM: hoje fica à direita, como no resto do app o mais
 * novo é o que importa. Os rótulos "seg / qua / sex" ficam fixos à esquerda; os dos meses rolam
 * junto com as colunas.
 *
 * Cor (RN-51): o nível 0 é um degrau acima do fundo da tela (o Início não tem cartão) — e
 * os níveis 1–4 clareiam pela rampa de neutros. O dia com recorde (RN-52) é ouro, o único lugar
 * de cor, como no resto do app. Dia que ainda não chegou (RN-50) não é desenhado: fica a
 * superfície do card, nunca o poço de "sem treino".
 *
 * ⚠️ A célula é pequena (14 px), abaixo do `hit.min`, e não tem como não ser: são 371 dias. Toda a
 * área do passo é de toque (sem vão morto entre células), e quem usa a tela escolhe o dia também
 * pelas setas do dia selecionado, que têm 44 pt. No navegador as células saem da ordem do Tab
 * (`tabIndex` −1): senão o teclado atravessaria 371 paradas antes de chegar na barra de abas.
 *
 * Performance: célula e coluna são `memo` com props primitivas, e a grade chega pronta
 * (`calendarioDoHeatmap`, memoizada pela tela). Trocar o dia selecionado redesenha duas colunas.
 */

/** Geometria da grade: célula quadrada de 14 px e 3 px entre elas — o passo é 17 px. */
const CELULA = 14;
const ESPACO = 3;
const PASSO = CELULA + ESPACO;
/** O contorno de hoje e do dia selecionado, e a folga entre ele e a cor do dia. */
const ANEL = 1.5;
const FOLGA = 1;
/** A linha dos meses; a lateral desce o mesmo tanto para "seg" cair na linha da segunda. */
const ALTURA_DOS_MESES = space.s4;
/**
 * A caixa de cada rótulo de mês (cabe "mar" em Manrope 12 com folga). ⚠️ Sem largura, o nativo
 * mede o texto absoluto pelo que sobra até a borda da grade — e o "out" da última coluna, com
 * ~15 px de sobra, sairia cortado em "o…". E a caixa não pode passar da grade: o Android corta o
 * que sai do pai (o "out" virava "ou"), então o último rótulo encosta na borda direita.
 */
const LARGURA_DO_MES = PASSO + space.s3;

/**
 * RN-51 — o nível do dia pela rampa de neutros. Degraus de claridade quase iguais (L* ≈ 4 → 24 →
 * 46 → 73 → 98), e o 1 já se separa bem do poço: um treino curto não pode sumir no escuro.
 */
export const COR_DO_NIVEL: Readonly<Record<Nivel, string>> = {
  // Sem cartão atrás (o Início é aberto, como o Progresso), o dia vazio é um degrau ACIMA do
  // fundo da tela — com a cor do fundo ele sumiria e a grade perderia a forma.
  0: surface.raised,
  1: neutral.n600,
  2: neutral.n400,
  3: neutral.n200,
  4: neutral.n100,
};

const NIVEIS: readonly Nivel[] = [0, 1, 2, 3, 4];

/** Domingo em cima: "seg", "qua" e "sex" caem nas linhas 1, 3 e 5. */
const ROTULOS_DAS_LINHAS = [null, 'seg', null, 'qua', null, 'sex', null] as const;

const DIAS_DA_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/**
 * "5 de outubro" — e "5 de outubro de 2025" quando o ano não é o de referência (a grade pega o
 * outubro passado também). Sem `Intl`, pelo mesmo motivo de `src/lib/formato.ts`.
 */
export function diaEMes(ms: number, anoDeReferencia = new Date(ms).getFullYear()): string {
  const d = new Date(ms);
  const ano = d.getFullYear() === anoDeReferencia ? '' : ` de ${d.getFullYear()}`;
  return `${d.getDate()} de ${MESES[d.getMonth()]}${ano}`;
}

/** "segunda, 5 de outubro". */
export function dataPorExtenso(ms: number, anoDeReferencia = new Date(ms).getFullYear()): string {
  return `${DIAS_DA_SEMANA[new Date(ms).getDay()]}, ${diaEMes(ms, anoDeReferencia)}`;
}

/** O que o leitor de tela diz da célula: "5 de outubro: 18 séries, recorde". */
function rotuloDaCelula(dia: DiaDoCalendario, ano: number): string {
  const quando = `${dia.hoje ? 'Hoje, ' : ''}${diaEMes(dia.inicioMs, ano)}`;
  const quanto = dia.series === 0 ? 'sem treino' : `${dia.series} ${dia.series === 1 ? 'série' : 'séries'}`;
  return `${quando}: ${quanto}${dia.recorde ? ', recorde' : ''}`;
}

export interface HeatmapProps {
  /** As colunas de `calendarioDoHeatmap` — memoizadas por quem chama. */
  colunas: readonly DiaDoCalendario[][];
  /** AAAA-MM-DD do dia em destaque; nulo = nenhum (hoje continua com o contorno). */
  selecionado: string | null;
  /** Tocar num dia passado. Sem ele a grade só mostra (o estado vazio não tem o que abrir). */
  aoSelecionar?: (data: string) => void;
}

export function Heatmap({ colunas, selecionado, aoSelecionar }: HeatmapProps) {
  const rolagem = useRef<ScrollView>(null);
  const larguraDaJanela = useRef(0);
  const deslocamento = useRef(0);
  const abriuNoFim = useRef(false);

  const meses = useMemo(() => rotulosDosMeses(colunas), [colunas]);
  const larguraDaGrade = colunas.length * PASSO;
  const hoje = colunas[colunas.length - 1]?.find((d) => d.hoje);
  // O ano de hoje, não o do domingo da última coluna: em 2 de janeiro ele ainda é do ano passado.
  const ano = hoje ? new Date(hoje.inicioMs).getFullYear() : 0;
  const colunaSelecionada = useMemo(
    () => colunas.findIndex((c) => c.some((d) => d.data === selecionado)),
    [colunas, selecionado],
  );

  // Pelas setas, o dia selecionado pode sair da janela: rola só o necessário para ele voltar.
  useEffect(() => {
    const largura = larguraDaJanela.current;
    if (colunaSelecionada < 0 || largura === 0) return;
    const inicio = colunaSelecionada * PASSO;
    if (inicio < deslocamento.current) {
      rolagem.current?.scrollTo({ x: inicio, animated: true });
    } else if (inicio + PASSO > deslocamento.current + largura) {
      rolagem.current?.scrollTo({ x: inicio + PASSO - largura, animated: true });
    }
  }, [colunaSelecionada]);

  return (
    <View style={estilos.raiz}>
      <View style={estilos.lateral} aria-hidden>
        {ROTULOS_DAS_LINHAS.map((rotulo, i) => (
          <View key={i} style={estilos.rotuloDaLinha}>
            {rotulo && <Texto papel="nav" cor={neutral.n300}>{rotulo}</Texto>}
          </View>
        ))}
      </View>

      <ScrollView
        ref={rolagem}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={estilos.rolagem}
        contentContainerStyle={estilos.conteudo}
        scrollEventThrottle={16}
        onLayout={(e) => {
          larguraDaJanela.current = e.nativeEvent.layout.width;
        }}
        onScroll={(e) => {
          deslocamento.current = e.nativeEvent.contentOffset.x;
        }}
        // Abre no fim (hoje à direita) uma vez só: depois disso, onde a pessoa rolou é dela.
        onContentSizeChange={() => {
          if (abriuNoFim.current) return;
          abriuNoFim.current = true;
          rolagem.current?.scrollToEnd({ animated: false });
        }}
      >
        <View>
          <View style={estilos.meses} aria-hidden>
            {meses.map(({ coluna, rotulo }) => (
              <Texto
                key={coluna}
                papel="nav"
                cor={neutral.n300}
                numberOfLines={1}
                style={[estilos.mes, { left: Math.min(coluna * PASSO + ESPACO / 2, larguraDaGrade - LARGURA_DO_MES) }]}
              >
                {rotulo}
              </Texto>
            ))}
          </View>
          <View style={estilos.colunas}>
            {colunas.map((dias, i) => (
              <Coluna
                key={dias[0].data}
                dias={dias}
                selecionado={i === colunaSelecionada ? selecionado : null}
                ano={ano}
                aoSelecionar={aoSelecionar}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Só recebe o selecionado quando ele é desta coluna: as outras 52 não redesenham. */
const Coluna = memo(function Coluna({
  dias, selecionado, ano, aoSelecionar,
}: {
  dias: readonly DiaDoCalendario[];
  selecionado: string | null;
  ano: number;
  aoSelecionar?: (data: string) => void;
}) {
  return (
    <View>
      {dias.map((dia) => (
        <Celula
          key={dia.data}
          dia={dia}
          selecionado={dia.data === selecionado}
          ano={ano}
          aoSelecionar={aoSelecionar}
        />
      ))}
    </View>
  );
});

const Celula = memo(function Celula({
  dia, selecionado, ano, aoSelecionar,
}: {
  dia: DiaDoCalendario;
  selecionado: boolean;
  ano: number;
  aoSelecionar?: (data: string) => void;
}) {
  // RN-50: o dia que ainda não chegou ocupa o lugar, mas não existe para a vista nem para o toque.
  if (dia.futuro) {
    return <View style={estilos.passo} aria-hidden />;
  }

  // RN-52: dia de recorde é o quadrado inteiro em ouro; os outros, a intensidade (RN-51).
  const cor = dia.recorde ? accent.signal : COR_DO_NIVEL[dia.nivel];
  // O contorno fica POR FORA da cor, com uma folga: sobre o nível 4 (tinta cheia) e sobre o ouro
  // ele continua visível. O selecionado é tinta cheia; hoje, quando não é o selecionado, é cinza.
  const anel = selecionado ? neutral.n100 : dia.hoje ? neutral.n400 : null;
  const quadrado = anel ? (
    <View style={[estilos.celula, estilos.comAnel, { borderColor: anel }]}>
      <View style={[estilos.miolo, { backgroundColor: cor }]} />
    </View>
  ) : (
    <View style={[estilos.celula, { backgroundColor: cor }]} />
  );
  const rotulo = rotuloDaCelula(dia, ano);

  if (!aoSelecionar) {
    return <View style={estilos.passo} accessible accessibilityLabel={rotulo}>{quadrado}</View>;
  }
  return (
    <Pressable
      onPress={() => aoSelecionar(dia.data)}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ selected: selecionado }}
      tabIndex={Platform.OS === 'web' ? -1 : undefined}
      style={({ pressed }) => [estilos.passo, pressed && estilos.pressionada]}
    >
      {quadrado}
    </Pressable>
  );
});

/** "Menos ▢▢▢▢▢ Mais" e, à direita, o ouro do recorde. */
export function LegendaDoHeatmap() {
  return (
    <View
      style={estilos.legenda}
      accessible
      accessibilityLabel="Legenda: quanto mais claro o quadrado, mais séries no dia. Dourado é dia de recorde."
    >
      <View style={estilos.escala}>
        <Texto papel="nav" cor={neutral.n300}>Menos</Texto>
        {NIVEIS.map((nivel) => (
          <View key={nivel} style={[estilos.amostra, { backgroundColor: COR_DO_NIVEL[nivel] }]} />
        ))}
        <Texto papel="nav" cor={neutral.n300}>Mais</Texto>
      </View>
      <View style={estilos.escala}>
        <View style={[estilos.amostra, { backgroundColor: accent.signal }]} />
        <Texto papel="nav" cor={accent.signal}>recorde</Texto>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flexDirection: 'row' },
  lateral: { paddingTop: ALTURA_DOS_MESES + space.s1, paddingRight: space.s2 },
  rotuloDaLinha: { height: PASSO, justifyContent: 'center' },
  rolagem: { flex: 1 },
  // Folga à direita: a caixa do rótulo do mês da última coluna ("out") passa um pouco da grade.
  conteudo: { paddingRight: space.s4 },
  meses: { height: ALTURA_DOS_MESES, marginBottom: space.s1 },
  mes: { position: 'absolute', top: 0, width: LARGURA_DO_MES },
  colunas: { flexDirection: 'row' },
  // O passo inteiro é a área de toque: sem vão morto entre uma célula e outra.
  passo: { width: PASSO, height: PASSO, alignItems: 'center', justifyContent: 'center' },
  pressionada: { opacity: 0.6 },
  celula: { width: CELULA, height: CELULA, borderRadius: radius.sm / 2 },
  comAnel: { borderWidth: ANEL, padding: FOLGA },
  miolo: { flex: 1, borderRadius: radius.sm / 4 },
  legenda: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s2 },
  escala: { flexDirection: 'row', alignItems: 'center', gap: space.s1 },
  amostra: { width: CELULA, height: CELULA, borderRadius: radius.sm / 2 },
});
