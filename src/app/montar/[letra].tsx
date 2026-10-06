import { router, useLocalSearchParams, useNavigation, type Href } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AjusteNumerico } from '@/components/ajuste-numerico';
import { AvisoDeFormulario } from '@/components/aviso-de-formulario';
import { BotaoDeSeta } from '@/components/botao-de-seta';
import { BotaoPrimario } from '@/components/botao-primario';
import { Campo } from '@/components/campo';
import { AcaoDestrutiva, ConfirmacaoDestrutiva } from '@/components/confirmacao-destrutiva';
import { Mais } from '@/components/icones-de-edicao';
import { Fundo } from '@/components/fundo';
import { Chevron } from '@/components/icones';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Voltar } from '@/components/voltar';
import { EXERCICIOS_POR_ID, nomeCurtoDe } from '@/data/exercicios';
import {
  atualizarExercicio, descreverItem, LIMITES, moverExercicio, removerExercicio, removerTreino, renomearTreino,
  type MudancaDeItem, type Resultado,
} from '@/domain/edicao-plano';
import { cargaDoPlanoVale, ultimaSessaoCom, ultimasSeriesDe, type SessaoFechada } from '@/domain/historico';
import { proximoAlvo } from '@/domain/progressao';
import type { Exercicio, ItemDeTreino } from '@/domain/types';
import { useHistorico } from '@/estado/historico';
import { usePerfil } from '@/estado/perfil';
import { useSessao } from '@/estado/sessao';
import { formatarKg, formatarTempo } from '@/lib/formato';
import { hit, neutral, radius, space, surface } from '@/theme/tokens';

/**
 * Tela 18 · Montar treino — uma letra do plano: o nome, os exercícios e a prescrição de cada um.
 * Número dominante: A LETRA. Ela é a identidade do treino (RN-10): o histórico guarda "fiz o B".
 *
 * Cada ajuste vale no toque: a tela pergunta ao domínio (`src/domain/edicao-plano.ts`), e o plano
 * novo vai para o `salvar`, que grava no aparelho na hora e sobe sozinho (RN-02). Recusa vira a
 * frase do domínio, onde a pessoa está olhando. Por isso não há o "Salvar treino" do Figma: um
 * botão que pode ser esquecido é um treino editado que se perde.
 *
 * Fora do Figma, de propósito: o "≡" de arrastar virou ↑ ↓ dentro do ajuste (arrastar numa lista
 * que rola, com a mão suada, erra mais do que acerta), e o fim da tela tem "Apagar treino".
 */

/** A anilha comum: o passo da carga quando o exercício não diz o dele (peso do corpo). */
const PASSO_SEM_INCREMENTO = 2.5;
/** `CAR-6` — o descanso de um composto, para exercício fora do catálogo. */
const DESCANSO_SEM_EXERCICIO = 90;

/** De onde vem a carga que o próximo treino vai pedir. */
type OrigemDaCarga = 'partida' | 'sua' | 'ultima' | 'subiu';
const DE_ONDE_VEM: Record<OrigemDaCarga, string> = {
  partida: 'carga de partida',
  sua: 'a que você definiu',
  ultima: 'a da última vez',
  subiu: 'subiu: você fechou a faixa',
};

/**
 * A carga que o PRÓXIMO treino vai pedir — a mesma conta do Hoje e do Treino ativo (`CAR-1` com a
 * RN-19): a do plano se foi mudada aqui depois da última vez (ou se o exercício nunca foi feito);
 * senão, a da última vez, um incremento acima se fechou a faixa.
 *
 * ⚠️ É esta que a tela mostra e ajusta, não a `cargaKg` do plano: essa fica parada na de partida
 * enquanto a pessoa progride, e um "+" a partir dela BAIXARIA a carga de quem já subiu.
 */
function cargaDoProximoTreino(
  item: ItemDeTreino,
  exercicio: Exercicio | undefined,
  sessoes: readonly SessaoFechada[],
): { cargaKg: number; origem: OrigemDaCarga } {
  const ultimaVez = ultimaSessaoCom(sessoes, item.exercicioId);
  const vale = cargaDoPlanoVale(item, ultimaVez?.fimMs);
  const alvo = proximoAlvo({
    ultimaSessao: ultimasSeriesDe(sessoes, item.exercicioId),
    faixa: item.faixa,
    cargaAtualKg: item.cargaKg,
    cargaDoPlanoVale: vale,
    incrementoKg: exercicio?.incrementoKg ?? PASSO_SEM_INCREMENTO,
    series: item.series,
  })[0];
  const origem: OrigemDaCarga = !ultimaVez ? 'partida' : vale ? 'sua' : alvo.origem === 'progressao' ? 'subiu' : 'ultima';
  return { cargaKg: alvo.cargaKg, origem };
}

// ⚠️ `as Href`: /montar/* é rota nova e o `.expo/types` (gerado pelo dev server) pode não conhecê-la.
const rotaDeEscolher = (letra: string) => `/montar/escolher?letra=${letra}` as Href;

export default function MontarTreino() {
  const params = useLocalSearchParams<{ letra: string }>();
  const letra = (typeof params.letra === 'string' ? params.letra : '').toUpperCase();
  const { perfil, salvar } = usePerfil();
  const { sessoes, carregado } = useHistorico();
  const { sessao } = useSessao();
  const navegacao = useNavigation();

  /** O exercício com o ajuste aberto (um por vez). Pelo id, não pelo índice: ele anda com ↑ ↓. */
  const [aberto, setAberto] = useState<string | null>(null);
  /** O nome enquanto é digitado; `null` = fora do campo, vale o do plano. */
  const [nome, setNome] = useState<string | null>(null);
  const [avisoDoNome, setAvisoDoNome] = useState<string | null>(null);
  const [apagando, setApagando] = useState(false);
  const [avisoDoTreino, setAvisoDoTreino] = useState<string | null>(null);
  const [saindo, setSaindo] = useState(false);
  // Depois de apagar o treino, a saída não pode gravar o nome pendente: seria o plano de ANTES de
  // apagar, e a letra voltaria.
  const nomeDescartado = useRef(false);

  const plano = perfil.plano;
  const treino = plano?.treinos.find((t) => t.id === letra);

  // O exercício que acabou de chegar da 19 (entrou no fim da lista) já abre no ajuste: é a hora de
  // acertar a carga dele. Estado ajustado durante o render, sem efeito (o padrão do React para
  // "o que mudou desde o último render").
  const idsDosItens = treino ? treino.itens.map((i) => i.exercicioId).join(' ') : '';
  const [idsVistos, setIdsVistos] = useState(idsDosItens);
  if (idsDosItens !== idsVistos) {
    setIdsVistos(idsDosItens);
    const antes = idsVistos ? idsVistos.split(' ') : [];
    const depois = idsDosItens ? idsDosItens.split(' ') : [];
    const chegou = depois[depois.length - 1];
    if (antes.length > 0 && depois.length === antes.length + 1 && !antes.includes(chegou)) setAberto(chegou);
  }

  /** RN-11 — grava o nome digitado. Sem mudança, não grava nada. */
  const confirmarNome = () => {
    if (nome === null || !plano || !treino || nomeDescartado.current) return;
    const resultado = renomearTreino(plano, letra, nome);
    if (!resultado.ok) {
      setAvisoDoNome(resultado.motivo);
      return;
    }
    setAvisoDoNome(null);
    setNome(null);
    if (resultado.plano.treinos.find((t) => t.id === letra)?.nome !== treino.nome) salvar({ plano: resultado.plano });
  };

  // Sair com o nome ainda no campo — voltar do Android, gesto do iOS, o <Voltar> com o teclado
  // aberto (o toque não tira o foco do campo) — grava antes de a tela sair. Evento de efeito: lê o
  // nome e o plano mais novos sem reassinar a cada tecla.
  const aoSairDaTela = useEffectEvent(() => confirmarNome());
  useEffect(() => navegacao.addListener('beforeRemove', () => aoSairDaTela()), [navegacao]);

  const voltar = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/treinos');
  };

  // Para a frente (19, 15) a tela continua montada: grava o nome antes de ir.
  const irPara = (rota: Href) => {
    confirmarNome();
    Keyboard.dismiss();
    router.push(rota);
  };

  // Apagou: a tela some no fade da volta. Sem isto, piscaria o "não existe mais" nesses 120 ms.
  // E a carga de cada exercício sai do histórico (CAR-1): antes de ele responder, a tela mostraria
  // a do plano e trocaria em seguida — canvas vazio por um instante, como na 17 e no Hoje.
  if (saindo || !carregado) return <Fundo />;

  if (!plano || !treino) {
    return (
      <Tela>
        <Voltar onPress={voltar} rotulo="Meus treinos" />
        <View style={estilos.vazio}>
          <Texto papel="h1" accessibilityRole="header">Este treino não está mais no plano</Texto>
          <Texto papel="desc">
            O treino {letra || 'pedido'} foi apagado, talvez em outro aparelho. O que você já fez com ele
            continua no histórico.
          </Texto>
        </View>
        <BotaoPrimario onPress={voltar} style={estilos.cta}>Ver meus treinos</BotaoPrimario>
      </Tela>
    );
  }

  const n = treino.itens.length;
  // RN-17: a sessão aberta leva a versão do treino de quando começou.
  const treinandoAgora = !!sessao && !sessao.fimMs && sessao.treinoId === letra;
  // RN-10: o último treino não sai — plano sem treino não é plano.
  const podeApagar = plano.treinos.length > LIMITES.treinos.min;

  const pedirApagar = () => {
    // O domínio é quem decide; aqui ele só é consultado antes da confirmação.
    const resultado = removerTreino(plano, letra);
    if (!resultado.ok) {
      setAvisoDoTreino(resultado.motivo);
      return;
    }
    setAvisoDoTreino(null);
    setApagando(true);
  };

  const apagarTreino = () => {
    const resultado = removerTreino(plano, letra);
    if (!resultado.ok) {
      setApagando(false);
      setAvisoDoTreino(resultado.motivo);
      return;
    }
    nomeDescartado.current = true;
    Keyboard.dismiss();
    setSaindo(true);
    salvar({ plano: resultado.plano });
    voltar();
  };

  return (
    <Tela>
      <KeyboardAvoidingView style={estilos.flex} behavior="padding">
        <Voltar onPress={voltar} rotulo="Meus treinos" />

        <ScrollView
          style={estilos.flex}
          contentContainerStyle={estilos.conteudo}
          showsVerticalScrollIndicator={false}
          // O toque num ajuste vale de primeira com o teclado aberto; no vazio, o teclado fecha.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <View style={estilos.topo}>
            <View style={estilos.cabecalho}>
              <Texto papel="mega" accessibilityRole="header" accessibilityLabel={`Treino ${letra}`}>{letra}</Texto>
              <View style={estilos.campoDoNome}>
                <Campo
                  rotulo="Nome do treino"
                  value={nome ?? treino.nome}
                  onChangeText={(texto) => {
                    setNome(texto);
                    setAvisoDoNome(null);
                  }}
                  onBlur={confirmarNome}
                  onSubmitEditing={confirmarNome}
                  placeholder={`Treino ${letra}`}
                  maxLength={LIMITES.nome.max}
                  autoCapitalize="sentences"
                  returnKeyType="done"
                  accessibilityLabel={`Nome do treino ${letra}`}
                />
              </View>
            </View>
            <AvisoDeFormulario>{avisoDoNome}</AvisoDeFormulario>
            <Texto papel="desc" cor={treinandoAgora ? neutral.n200 : neutral.n400} style={estilos.nota}>
              {treinandoAgora
                ? `Você está treinando o ${letra} agora — o treino de hoje segue como começou. As mudanças valem a partir do próximo.`
                : 'As mudanças já ficam salvas e valem a partir do próximo treino.'}
            </Texto>
          </View>

          <View style={estilos.secao}>
            <Texto papel="eyebrow">{n} {n === 1 ? 'exercício' : 'exercícios'}</Texto>
            <View style={estilos.lista}>
              {treino.itens.map((item, indice) => {
                const exercicio = EXERCICIOS_POR_ID.get(item.exercicioId);
                return (
                  <LinhaDoExercicio
                    key={item.exercicioId}
                    letra={letra}
                    indice={indice}
                    total={n}
                    item={item}
                    exercicio={exercicio}
                    carga={cargaDoProximoTreino(item, exercicio, sessoes)}
                    aberta={aberto === item.exercicioId}
                    aoAlternar={() => setAberto((atual) => (atual === item.exercicioId ? null : item.exercicioId))}
                    aoVerExercicio={() => irPara(`/exercicio/${item.exercicioId}`)}
                    aoRemovido={() => setAberto(null)}
                  />
                );
              })}
            </View>
            {/* RN-12: até 12 exercícios. No limite a linha some e a tela diz por quê. */}
            {n < LIMITES.itens.max ? (
              <Pressable
                onPress={() => irPara(rotaDeEscolher(letra))}
                accessibilityRole="button"
                accessibilityLabel="Adicionar exercício"
                style={({ pressed }) => [estilos.linhaDeAcao, pressed && estilos.pressionado]}
              >
                <Mais tamanho={18} cor={neutral.n200} />
                <Texto papel="corpo" cor={neutral.n200}>Adicionar exercício</Texto>
              </Pressable>
            ) : (
              <Texto papel="desc" cor={neutral.n400}>
                O treino {letra} já tem {LIMITES.itens.max} exercícios, o máximo.
              </Texto>
            )}
          </View>

          {podeApagar && (
            <View style={estilos.perigo}>
              {/* Vermelho é SÓ ação destrutiva (tokens.accent.danger) — apagar treino é uma. */}
              {apagando ? (
                <ConfirmacaoDestrutiva
                  pergunta={`Apagar o treino ${letra}, ${treino.nome}?`}
                  detalhe="Os treinos que você já fez com ele continuam no histórico."
                  acao="Apagar"
                  rotuloDaAcao={`Apagar o treino ${letra} de vez`}
                  aoCancelar={() => setApagando(false)}
                  aoConfirmar={apagarTreino}
                />
              ) : (
                <AcaoDestrutiva onPress={pedirApagar}>{`Apagar treino ${letra}`}</AcaoDestrutiva>
              )}
              <AvisoDeFormulario>{avisoDoTreino}</AvisoDeFormulario>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Tela>
  );
}

/**
 * Um exercício do treino. A linha inteira abre o ajuste; o NOME, por cima dela, leva à tela 15
 * (o histórico do exercício) — por isso o "›" colado nele, e o indicador da direita aponta para
 * baixo: "›" vai para outra tela, "⌄" abre aqui.
 *
 * ⚠️ Os dois alvos são IRMÃOS: o de abrir é um `Pressable` no fundo da linha (absoluto) e o
 * conteúdo passa o toque para ele (`pointerEvents`), menos o nome. Aninhar um no outro vira
 * <button> dentro de <button> na web.
 */
function LinhaDoExercicio({
  letra, indice, total, item, exercicio, carga, aberta, aoAlternar, aoVerExercicio, aoRemovido,
}: {
  letra: string;
  indice: number;
  total: number;
  item: ItemDeTreino;
  exercicio: Exercicio | undefined;
  carga: { cargaKg: number; origem: OrigemDaCarga };
  aberta: boolean;
  aoAlternar: () => void;
  aoVerExercicio: () => void;
  aoRemovido: () => void;
}) {
  const nome = nomeCurtoDe(exercicio, item.exercicioId);
  // "4 × 8–12 · 47,5 kg" com a carga do PRÓXIMO treino — a que o Hoje vai mostrar, não a de partida.
  const descricao = descreverItem({ ...item, cargaKg: carga.cargaKg }, exercicio);

  return (
    <View style={[estilos.linha, aberta && estilos.linhaAberta]}>
      <View>
        <Pressable
          onPress={aoAlternar}
          accessibilityRole="button"
          accessibilityLabel={`${nome}, ${descricao}`}
          accessibilityHint={aberta ? 'Fecha o ajuste' : 'Ajusta séries, repetições, carga e descanso'}
          accessibilityState={{ expanded: aberta }}
          style={({ pressed }) => [StyleSheet.absoluteFill, pressed && estilos.pressionado]}
        />
        <View style={[estilos.cabecalhoDaLinha, estilos.passaOToque]}>
          <View style={[estilos.linhaDoNome, estilos.passaOToque]}>
            <Pressable
              onPress={aoVerExercicio}
              accessibilityRole="link"
              accessibilityLabel={`${nome}: histórico e prescrição`}
              style={({ pressed }) => [estilos.nome, pressed && estilos.nomePressionado]}
            >
              <Texto papel="h2" numberOfLines={1} style={estilos.nomeTexto}>{nome}</Texto>
              <Chevron tamanho={16} cor={neutral.n400} />
            </Pressable>
            {/* Só desenho: o botão do fundo já diz nome, prescrição e se está aberto. */}
            <View style={[estilos.indicador, estilos.semToque]} aria-hidden>
              <View style={aberta ? estilos.paraCima : estilos.paraBaixo}>
                <Chevron cor={aberta ? neutral.n100 : neutral.n300} />
              </View>
            </View>
          </View>
          <View style={estilos.semToque} aria-hidden>
            <Texto papel="desc" numberOfLines={1}>{descricao}</Texto>
          </View>
        </View>
      </View>

      {aberta && (
        <EditorDoExercicio
          letra={letra}
          indice={indice}
          total={total}
          item={item}
          exercicio={exercicio}
          carga={carga}
          nome={nome}
          aoRemovido={aoRemovido}
        />
      )}
    </View>
  );
}

/**
 * O ajuste aberto de um exercício: séries, faixa, carga e descanso (RN-13 a RN-15), a ordem e o
 * "Remover". Lê o plano do perfil a cada render — todo ajuste parte do plano mais novo.
 */
function EditorDoExercicio({
  letra, indice, total, item, exercicio, carga: cargaDoProximo, nome, aoRemovido,
}: {
  letra: string;
  indice: number;
  total: number;
  item: ItemDeTreino;
  exercicio: Exercicio | undefined;
  carga: { cargaKg: number; origem: OrigemDaCarga };
  nome: string;
  aoRemovido: () => void;
}) {
  const { perfil, salvar } = usePerfil();
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const plano = perfil.plano;
  if (!plano) return null;

  /** Recusa: a frase do domínio aparece aqui. Aceito: grava (e a frase antiga sai). */
  const aplicar = (resultado: Resultado): boolean => {
    if (!resultado.ok) {
      setAviso(resultado.motivo);
      return false;
    }
    setAviso(null);
    salvar({ plano: resultado.plano });
    return true;
  };
  const mudar = (mudanca: MudancaDeItem, agoraMs?: number) =>
    aplicar(atualizarExercicio(plano, letra, indice, mudanca, agoraMs));

  // Carga: parte da que o próximo treino pediria e anda no passo do exercício (2,5 superior · 5
  // inferior · 2 unilateral); o domínio arredonda. O `agoraMs` carimba a mudança (RN-19): sem ele,
  // com histórico, a CAR-1 seguiria a carga da última vez e o ajuste não valeria.
  const corporal = exercicio?.unidade === 'corporal';
  const passo = exercicio && exercicio.incrementoKg > 0 ? exercicio.incrementoKg : PASSO_SEM_INCREMENTO;
  const carga = cargaDoProximo.cargaKg;
  const porMao = exercicio?.equipamento === 'halteres' && exercicio.unilateral;
  const carregar = (kg: number) =>
    mudar({ cargaKg: Math.min(LIMITES.carga.max, Math.max(LIMITES.carga.min, kg)) }, Date.now());
  // Exercício novo sem carga de partida na tabela entra com 0 kg: a tela pede o número.
  const deOndeVem =
    carga === 0 && cargaDoProximo.origem === 'partida' ? 'ajuste a carga de partida' : DE_ONDE_VEM[cargaDoProximo.origem];

  // RN-15: vazio = o padrão da CAR-6. Voltar ao número do padrão grava "padrão" (null), não o número.
  const padrao = exercicio?.descansoSegundos ?? DESCANSO_SEM_EXERCICIO;
  const proprio = item.descansoSegundos;
  const descanso = proprio ?? padrao;
  const descansar = (segundos: number) => mudar({ descansoSegundos: segundos === padrao ? null : segundos });

  const pedirRemocao = () => {
    // RN-12: o último exercício não sai — a frase do domínio diz o que fazer (apagar o treino).
    const resultado = removerExercicio(plano, letra, indice);
    if (!resultado.ok) {
      setAviso(resultado.motivo);
      return;
    }
    setAviso(null);
    setConfirmando(true);
  };

  const remover = () => {
    if (aplicar(removerExercicio(plano, letra, indice))) aoRemovido();
    else setConfirmando(false);
  };

  return (
    <View style={estilos.editor}>
      <AjusteNumerico
        rotulo="Séries"
        valor={String(item.series)}
        podeDiminuir={item.series > LIMITES.series.min}
        podeAumentar={item.series < LIMITES.series.max}
        aoDiminuir={() => mudar({ series: item.series - 1 })}
        aoAumentar={() => mudar({ series: item.series + 1 })}
      />
      {/* A faixa: o domínio recusa mínimo acima do máximo, e a frase dele aparece embaixo. */}
      <AjusteNumerico
        rotulo="Reps mínimas"
        valor={String(item.faixa.min)}
        podeDiminuir={item.faixa.min > LIMITES.reps.min}
        podeAumentar={item.faixa.min < LIMITES.reps.max}
        aoDiminuir={() => mudar({ faixa: { min: item.faixa.min - 1, max: item.faixa.max } })}
        aoAumentar={() => mudar({ faixa: { min: item.faixa.min + 1, max: item.faixa.max } })}
      />
      <AjusteNumerico
        rotulo="Reps máximas"
        valor={String(item.faixa.max)}
        podeDiminuir={item.faixa.max > LIMITES.reps.min}
        podeAumentar={item.faixa.max < LIMITES.reps.max}
        aoDiminuir={() => mudar({ faixa: { min: item.faixa.min, max: item.faixa.max - 1 } })}
        aoAumentar={() => mudar({ faixa: { min: item.faixa.min, max: item.faixa.max + 1 } })}
      />
      {corporal ? (
        // Peso do corpo: a carga do plano é a EXTRA (cinto, colete), e começa em nenhuma.
        <AjusteNumerico
          rotulo="Carga"
          detalhe={carga > 0 ? 'além do peso do corpo' : 'sem carga extra'}
          valor={carga > 0 ? `+${formatarKg(carga)}` : 'peso do corpo'}
          unidade={carga > 0 ? 'kg' : undefined}
          valorEmTexto={carga === 0}
          podeDiminuir={carga > LIMITES.carga.min}
          podeAumentar={carga < LIMITES.carga.max}
          aoDiminuir={() => carregar(carga - passo)}
          aoAumentar={() => carregar(carga + passo)}
        />
      ) : (
        <AjusteNumerico
          rotulo="Carga"
          detalhe={porMao ? `${deOndeVem} · por mão` : deOndeVem}
          valor={formatarKg(carga)}
          unidade="kg"
          podeDiminuir={carga > LIMITES.carga.min}
          podeAumentar={carga < LIMITES.carga.max}
          aoDiminuir={() => carregar(carga - passo)}
          aoAumentar={() => carregar(carga + passo)}
        />
      )}
      <AjusteNumerico
        rotulo="Descanso"
        detalhe={
          proprio === undefined ? (
            'padrão do exercício'
          ) : (
            <Pressable
              onPress={() => mudar({ descansoSegundos: null })}
              accessibilityRole="button"
              accessibilityLabel={`Voltar ao descanso padrão, ${formatarTempo(padrao)}`}
              style={({ pressed }) => [estilos.linkDoPadrao, pressed && estilos.nomePressionado]}
            >
              <Texto papel="desc" cor={neutral.n200}>voltar ao padrão ({formatarTempo(padrao)})</Texto>
            </Pressable>
          )
        }
        valor={formatarTempo(descanso)}
        podeDiminuir={descanso > LIMITES.descanso.min}
        podeAumentar={descanso < LIMITES.descanso.max}
        aoDiminuir={() => descansar(descanso - LIMITES.descanso.passo)}
        aoAumentar={() => descansar(descanso + LIMITES.descanso.passo)}
      />

      <AvisoDeFormulario>{aviso}</AvisoDeFormulario>

      {confirmando ? (
        <ConfirmacaoDestrutiva
          pergunta={`Tirar ${nome.toLowerCase()} do treino ${letra}?`}
          detalhe="O que você já fez dele continua no histórico."
          acao="Remover"
          rotuloDaAcao={`Remover ${nome} do treino ${letra}`}
          aoCancelar={() => setConfirmando(false)}
          aoConfirmar={remover}
        />
      ) : (
        <View style={estilos.rodapeDoEditor}>
          {/* RN-12a: trocar por outro no PLANO — o catálogo abre no mesmo padrão de movimento. */}
          <Pressable
            onPress={() => router.push(`/montar/escolher?letra=${letra}&trocar=${indice}` as Href)}
            accessibilityRole="button"
            accessibilityLabel={`Trocar ${nome} por outro exercício`}
            style={({ pressed }) => [estilos.trocar, pressed && estilos.pressionado]}
          >
            <Texto papel="desc" cor={neutral.n100}>Trocar</Texto>
          </Pressable>
          <BotaoDeSeta
            direcao="cima"
            desabilitado={indice === 0}
            rotulo={`Subir ${nome} no treino`}
            onPress={() => aplicar(moverExercicio(plano, letra, indice, -1))}
            style={estilos.seta}
          />
          <BotaoDeSeta
            direcao="baixo"
            desabilitado={indice === total - 1}
            rotulo={`Descer ${nome} no treino`}
            onPress={() => aplicar(moverExercicio(plano, letra, indice, 1))}
            style={estilos.seta}
          />
          {/* Vermelho é SÓ ação destrutiva — tirar o exercício do treino é uma. */}
          <AcaoDestrutiva onPress={pedirRemocao} style={estilos.remover}>Remover</AcaoDestrutiva>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { paddingTop: space.s2, paddingBottom: space.s7, gap: space.s6 },
  topo: { gap: space.s2 },
  // A letra senta na linha de baixo do campo: os dois são o "quem é" do treino.
  cabecalho: { flexDirection: 'row', alignItems: 'flex-end', gap: space.s4 },
  campoDoNome: { flex: 1 },
  nota: { paddingTop: space.s1 },
  secao: { gap: space.s3 },
  // Linhas abertas com divisória fina, como as listas do Progresso e de Treinos (sem cartão).
  lista: { borderTopWidth: 1, borderTopColor: surface.line },
  linha: { borderBottomWidth: 1, borderBottomColor: surface.line },
  linhaAberta: {},
  linhaDeAcao: { flexDirection: 'row', alignItems: 'center', gap: space.s3, minHeight: hit.row },
  pressionado: { backgroundColor: surface.rowActive },
  // O conteúdo não pega toque (passa para o Pressable do fundo); só os filhos que dizem que pegam.
  passaOToque: { pointerEvents: 'box-none' },
  semToque: { pointerEvents: 'none' },
  cabecalhoDaLinha: { paddingBottom: space.s3 },
  linhaDoNome: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s2 },
  nome: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s1,
    minHeight: hit.min,
  },
  nomePressionado: { opacity: 0.6 },
  nomeTexto: { flexShrink: 1 },
  indicador: { width: hit.min, height: hit.min, alignItems: 'center', justifyContent: 'center' },
  // O chevron do app aponta para a direita: 90° para baixo (abre aqui), −90° para cima (fecha).
  paraBaixo: { transform: [{ rotate: '90deg' }] },
  paraCima: { transform: [{ rotate: '-90deg' }] },
  editor: { gap: space.s2, paddingBottom: space.s4 },
  linkDoPadrao: { alignSelf: 'flex-start', minHeight: hit.min, justifyContent: 'center' },
  rodapeDoEditor: { flexDirection: 'row', alignItems: 'center', gap: space.s2, paddingTop: space.s1 },
  seta: { borderRadius: radius.md, borderWidth: 1, borderColor: surface.line2 },
  trocar: {
    minHeight: hit.min,
    paddingHorizontal: space.s4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surface.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remover: { marginLeft: 'auto', paddingHorizontal: space.s2 },
  perigo: { borderTopWidth: 1, borderTopColor: surface.line, paddingTop: space.s3 },
  vazio: { flex: 1, gap: space.s3, paddingTop: space.s5 },
  cta: { marginBottom: space.s5 },
});
