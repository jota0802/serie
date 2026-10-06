import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AvisoDeFormulario } from '@/components/aviso-de-formulario';
import { CampoDeBusca } from '@/components/campo-de-busca';
import { Fundo } from '@/components/fundo';
import { Check } from '@/components/icones';
import { Mais } from '@/components/icones-de-edicao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Voltar } from '@/components/voltar';
import { EXERCICIOS, EXERCICIOS_POR_ID, NOME_DO_GRUPO, nomeCurtoDe } from '@/data/exercicios';
import { adicionarExercicio, adicionarTreino, itemPadrao, LIMITES, proximaLetraLivre, trocarExercicio } from '@/domain/edicao-plano';
import type { Exercicio, PadraoDeMovimento } from '@/domain/types';
import { usePerfil } from '@/estado/perfil';
import { hit, neutral, radius, space, surface } from '@/theme/tokens';

/**
 * Tela 19 · Escolher exercício — o catálogo inteiro (45), para pôr um exercício num treino.
 *
 * Duas portas:
 *  - `?letra=B` (da 18): o exercício entra no FIM do treino B, e a tela volta para a 18 — que já
 *    abre o ajuste dele;
 *  - `?novo=1` (da 17): o exercício é o PRIMEIRO de um treino novo (treino vazio não existe,
 *    RN-12), que nasce com a primeira letra livre (RN-10) e abre na 18.
 *
 * Entra com a prescrição do objetivo e a carga de partida pelo peso (RN-18, `itemPadrao`). O que
 * já está no treino aparece apagado, "já no treino": o domínio recusaria (RN-12, sem repetir).
 *
 * A lista é agrupada pelo PADRÃO DE MOVIMENTO, a mesma família da troca (`CAR-9`): quem procura
 * "um empurrar horizontal" acha as variações juntas.
 */

const PADROES: readonly { padrao: PadraoDeMovimento; nome: string }[] = [
  { padrao: 'empurrar-horizontal', nome: 'Empurrar (horizontal)' },
  { padrao: 'empurrar-vertical', nome: 'Empurrar (vertical)' },
  { padrao: 'puxar-horizontal', nome: 'Puxar (horizontal)' },
  { padrao: 'puxar-vertical', nome: 'Puxar (vertical)' },
  { padrao: 'agachar', nome: 'Agachar' },
  { padrao: 'articular-quadril', nome: 'Quadril' },
  { padrao: 'isolado', nome: 'Isolado' },
];

const SEM_ACENTO: Readonly<Record<string, string>> = {
  á: 'a', à: 'a', â: 'a', ã: 'a', ä: 'a', é: 'e', è: 'e', ê: 'e', ë: 'e', í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', õ: 'o', ö: 'o', ú: 'u', ù: 'u', û: 'u', ü: 'u', ç: 'c', ñ: 'n',
};

/**
 * "Tríceps  FRANCÊS" → "triceps frances". À mão, sem `normalize`/`Intl`: o resultado tem que ser
 * o mesmo no Hermes e no navegador (a mesma razão de `lib/formato`).
 */
function paraBusca(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/[áàâãäéèêëíìîïóòôõöúùûüçñ]/g, (c) => SEM_ACENTO[c] ?? c)
    .replace(/\s+/g, ' ')
    .trim();
}

/** O que a busca procura em cada exercício: o nome, o nome curto e o músculo ("costas" acha as remadas). */
const CATALOGO = EXERCICIOS.map((exercicio) => ({
  exercicio,
  texto: paraBusca([exercicio.nome, exercicio.nomeCurto ?? '', NOME_DO_GRUPO[exercicio.grupo]].join(' ')),
}));

// ⚠️ `as Href`: /montar/* é rota nova e o `.expo/types` (gerado pelo dev server) pode não conhecê-la.
const rotaDoTreino = (letra: string) => `/montar/${letra}` as Href;

export default function EscolherExercicio() {
  const params = useLocalSearchParams<{ letra?: string; novo?: string; trocar?: string }>();
  const novo = params.novo === '1';
  const letra = !novo && typeof params.letra === 'string' ? params.letra.toUpperCase() : null;
  const { perfil, salvar } = usePerfil();
  // RN-12a — modo TROCAR: `trocar` é a posição do exercício que sai.
  const indiceDaTroca = !novo && params.trocar != null && /^\d+$/.test(String(params.trocar)) ? Number(params.trocar) : null;
  const itemQueSai = letra && indiceDaTroca != null
    ? perfil.plano?.treinos.find((t) => t.id === letra)?.itens[indiceDaTroca]
    : undefined;
  const exercicioQueSai = itemQueSai ? EXERCICIOS_POR_ID.get(itemQueSai.exercicioId) : undefined;
  const [busca, setBusca] = useState('');
  // Trocando, abre no padrão de movimento do exercício que sai: é por onde se procura um substituto.
  const [filtro, setFiltro] = useState<PadraoDeMovimento | null>(() => exercicioQueSai?.padrao ?? null);
  const [aviso, setAviso] = useState<string | null>(null);
  // Um toque só: um segundo, antes de a tela sair, criaria OUTRO treino (ou poria outro exercício).
  const escolheu = useRef(false);
  // Escolheu: a tela some no fade da saída. Sem isto, o plano novo (com 12 exercícios, ou 6 letras)
  // faria piscar o aviso de "máximo" nesses 120 ms.
  const [saindo, setSaindo] = useState(false);

  const plano = perfil.plano;
  const treino = letra ? plano?.treinos.find((t) => t.id === letra) : undefined;
  // RN-10: a letra do treino novo é a primeira livre — lida ANTES de adicionar.
  const letraNova = novo && plano ? proximaLetraLivre(plano) : null;

  const voltar = () => {
    if (router.canGoBack()) router.back();
    else router.replace(letra ? rotaDoTreino(letra) : '/treinos');
  };
  const rotuloDoVoltar = letra ? `Montar treino ${letra}` : 'Meus treinos';

  // Aberta pela URL, ou o plano mudou em outro aparelho: diz o porquê em vez de uma lista que recusa tudo.
  let impedimento: string | null = null;
  if (!plano) impedimento = 'Ainda não há um plano para montar.';
  else if (novo) {
    if (letraNova === null) impedimento = `O plano já tem ${LIMITES.treinos.max} treinos, o máximo. Para criar outro, apague um.`;
  } else if (!treino) {
    impedimento = letra
      ? `O treino ${letra} não está mais no plano — talvez tenha sido apagado em outro aparelho.`
      : 'Falta dizer em qual treino o exercício entra.';
  } else if (indiceDaTroca != null) {
    if (!itemQueSai) impedimento = 'Esse exercício não está mais no treino.';
  } else if (treino.itens.length >= LIMITES.itens.max) {
    impedimento = `O treino ${treino.id} já tem ${LIMITES.itens.max} exercícios, o máximo.`;
  }

  if (saindo) return <Fundo />;

  if (!plano || impedimento) {
    return (
      <Tela>
        <Voltar onPress={voltar} rotulo={rotuloDoVoltar} />
        <View style={estilos.vazio}>
          <Texto papel="h1" accessibilityRole="header">Escolher exercício</Texto>
          <Texto papel="desc">{impedimento}</Texto>
        </View>
      </Tela>
    );
  }

  const escolher = (exercicio: Exercicio) => {
    if (escolheu.current) return;
    const item = itemPadrao(exercicio, { objetivo: perfil.objetivo, pesoKg: perfil.pesoKg });

    if (novo) {
      const nova = proximaLetraLivre(plano);
      const resultado = adicionarTreino(plano, '', item);
      if (!resultado.ok) {
        setAviso(resultado.motivo);
        return;
      }
      if (!nova) return;
      escolheu.current = true;
      Keyboard.dismiss();
      setSaindo(true);
      salvar({ plano: resultado.plano });
      // `replace`: a 19 sai da pilha, e o voltar da 18 cai direto na 17.
      router.replace(rotaDoTreino(nova));
      return;
    }

    if (!letra) return;
    const resultado = indiceDaTroca != null
      ? trocarExercicio(plano, letra, indiceDaTroca, item)
      : adicionarExercicio(plano, letra, item);
    if (!resultado.ok) {
      setAviso(resultado.motivo);
      return;
    }
    escolheu.current = true;
    Keyboard.dismiss();
    setSaindo(true);
    salvar({ plano: resultado.plano });
    voltar();
  };

  const termos = paraBusca(busca).split(' ').filter(Boolean);
  const noTreino = new Set(treino?.itens.map((i) => i.exercicioId) ?? []);
  const visiveis = CATALOGO.filter(
    ({ exercicio, texto }) => (filtro === null || exercicio.padrao === filtro) && termos.every((t) => texto.includes(t)),
  ).map(({ exercicio }) => exercicio);
  const secoes = PADROES.map((p) => ({ ...p, exercicios: visiveis.filter((e) => e.padrao === p.padrao) })).filter(
    (s) => s.exercicios.length > 0,
  );

  return (
    <Tela>
      <KeyboardAvoidingView style={estilos.flex} behavior="padding">
        <Voltar onPress={voltar} rotulo={rotuloDoVoltar} />

        <View style={estilos.topo}>
          <View style={estilos.cabecalho}>
            <Texto papel="h1" accessibilityRole="header">
              {exercicioQueSai ? `Trocar ${nomeCurtoDe(exercicioQueSai, exercicioQueSai.id).toLowerCase()}` : 'Escolher exercício'}
            </Texto>
            <Texto papel="desc" cor={neutral.n400}>
              {novo
                ? `É o primeiro do treino ${letraNova}. Depois você dá o nome e põe os outros.`
                : exercicioQueSai
                  ? 'Mantém as séries, a faixa e o descanso. A carga recomeça pela de partida do novo; o histórico do antigo continua.'
                  : `Entra no fim do treino ${letra}. Depois você ajusta séries e carga.`}
            </Texto>
          </View>
          <CampoDeBusca
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar exercício"
            accessibilityLabel="Buscar exercício pelo nome ou pelo músculo"
          />
        </View>

        {/* Os chips correm de borda a borda (o 5º aparece cortado, como no Figma: há mais para o lado). */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={estilos.chips}
          contentContainerStyle={estilos.chipsConteudo}
          accessibilityRole="radiogroup"
          accessibilityLabel="Padrão de movimento"
        >
          <Chip rotulo="Todos" ativo={filtro === null} onPress={() => setFiltro(null)} />
          {PADROES.map(({ padrao, nome }) => (
            <Chip key={padrao} rotulo={nome} ativo={filtro === padrao} onPress={() => setFiltro(padrao)} />
          ))}
        </ScrollView>

        <AvisoDeFormulario>{aviso}</AvisoDeFormulario>

        <ScrollView
          style={estilos.flex}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          // O toque numa linha vale de primeira com o teclado aberto; rolar fecha o teclado.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {secoes.length === 0 ? (
            <Texto papel="desc" style={estilos.nada}>
              Nenhum exercício com “{busca.trim()}”{filtro ? ' neste padrão' : ''}. Tente outro nome ou o músculo.
            </Texto>
          ) : (
            secoes.map(({ padrao, nome, exercicios }) => (
              <View key={padrao} style={estilos.secao}>
                {/* Com um padrão escolhido, o chip já diz qual é: o título da seção seria eco. */}
                {filtro === null && <Texto papel="eyebrow">{nome}</Texto>}
                {exercicios.map((exercicio) => (
                  <LinhaDoCatalogo
                    key={exercicio.id}
                    exercicio={exercicio}
                    noTreino={noTreino.has(exercicio.id)}
                    onPress={() => escolher(exercicio)}
                  />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Tela>
  );
}

/** Filtro de escolha única, com o mesmo desenho dos chips do Progresso (20): o ativo é tinta cheia. */
function Chip({ rotulo, ativo, onPress }: { rotulo: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: ativo }}
      style={({ pressed }) => [estilos.chip, ativo && estilos.chipAtivo, pressed && !ativo && estilos.pressionado]}
    >
      <Texto papel="desc" cor={ativo ? neutral.n1000 : neutral.n200}>{rotulo}</Texto>
    </Pressable>
  );
}

/** Um exercício do catálogo: o nome, o músculo e o tipo. A linha inteira é o alvo; o "+" diz o que ela faz. */
function LinhaDoCatalogo({ exercicio, noTreino, onPress }: { exercicio: Exercicio; noTreino: boolean; onPress: () => void }) {
  const grupo = NOME_DO_GRUPO[exercicio.grupo];
  const partes = [grupo.charAt(0).toUpperCase() + grupo.slice(1), exercicio.composto ? 'composto' : 'isolado'];
  if (exercicio.unidade === 'corporal') partes.push('peso do corpo');
  if (noTreino) partes.push('já no treino');
  const detalhe = partes.join(' · ');
  const cor = noTreino ? neutral.n400 : undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={noTreino}
      accessibilityRole="button"
      accessibilityLabel={`${exercicio.nome}, ${detalhe}`}
      accessibilityHint={noTreino ? undefined : 'Põe este exercício no treino'}
      accessibilityState={{ disabled: noTreino }}
      style={({ pressed }) => [estilos.linha, pressed && !noTreino && estilos.pressionado]}
    >
      <View style={estilos.textos}>
        <Texto papel="h2" numberOfLines={2} cor={cor}>{exercicio.nome}</Texto>
        <Texto papel="desc" numberOfLines={1} cor={cor}>{detalhe}</Texto>
      </View>
      {noTreino ? <Check tamanho={18} cor={neutral.n400} /> : <Mais tamanho={22} cor={neutral.n300} />}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  topo: { gap: space.s4, paddingTop: space.s2 },
  cabecalho: { gap: space.s1 },
  chips: { flexGrow: 0, marginHorizontal: -space.s5, marginTop: space.s4 },
  chipsConteudo: { paddingHorizontal: space.s5, gap: space.s2 },
  chip: {
    minHeight: hit.min,
    paddingHorizontal: space.s4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: surface.line2,
    justifyContent: 'center',
  },
  chipAtivo: { backgroundColor: neutral.n100, borderColor: neutral.n100 },
  pressionado: { backgroundColor: surface.rowActive },
  lista: { paddingTop: space.s4, paddingBottom: space.s7, gap: space.s5 },
  secao: { gap: space.s2 },
  // Linhas abertas com divisória fina, como as outras listas do app (sem cartão).
  linha: {
    minHeight: hit.row + space.s2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
    paddingVertical: space.s3,
    borderBottomWidth: 1,
    borderBottomColor: surface.line,
  },
  textos: { flex: 1, gap: 2 },
  nada: { paddingTop: space.s2 },
  vazio: { gap: space.s3, paddingTop: space.s5 },
});
