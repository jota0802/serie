import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';

import { BotaoPrimario } from '@/components/botao-primario';
import { dataPorExtenso, diaEMes, Heatmap, LegendaDoHeatmap } from '@/components/heatmap';
import { Chevron } from '@/components/icones';
import { Surgir } from '@/components/surgir';
import { TelaDeAba } from '@/components/tela-de-aba';
import { Texto } from '@/components/texto';
import { EXERCICIOS_POR_ID, nomeCurtoDe } from '@/data/exercicios';
import { proximoAlvo, tonelagem, type Alvo, type Exercicio, type ItemDeTreino, type Treino } from '@/domain';
import {
  calendarioDoHeatmap, chaveDoDia, inicioDoDia, semanasSeguidasNaMeta, sessoesDoDia, treinosNoUltimoAno,
  type DiaDoCalendario,
} from '@/domain/calendario';
import { treinosEmOrdem } from '@/domain/edicao-plano';
import {
  cargaDoPlanoVale, proximoTreino, sessoesDaSemana, ultimaSessaoCom, ultimasSeriesDe, type SessaoFechada,
} from '@/domain/historico';
import { proximoDiaDeTreino } from '@/domain/resumo';
import { useHistorico } from '@/estado/historico';
import { usePerfil, usePlano } from '@/estado/perfil';
import { useSessao } from '@/estado/sessao';
import { formatarKg, formatarMilhar, porExtenso } from '@/lib/formato';
import { accent, font, hit, neutral, radius, size, space, surface } from '@/theme/tokens';

/**
 * Tela 10 · Início (rota `/hoje`) — a primeira tela depois do login.
 *
 * Responde, nesta ordem: O QUE EU FAÇO HOJE? e COMO ESTÁ A MINHA CONSTÂNCIA?
 * Número dominante: A LETRA DO TREINO. Abaixo dela, o ano em quadrados e a semana.
 *
 * - RN-20 · a letra é a que vem depois da última sessão fechada (`proximoTreino`);
 * - RN-21 · dia fora do plano é dia de descanso — e dá para treinar mesmo assim;
 * - RN-22 · dá para escolher outra letra hoje; o rodízio segue a partir da que for feita;
 * - RN-31 · com um treino aberto o caminho é retomar, não recomeçar (`CAR-8`);
 * - RN-50 a RN-53 · o heatmap do ano e a sequência de semanas na meta (`src/domain/calendario.ts`).
 *
 * ⚠️ Nada aqui é número cravado. "Supino reto sobe para 42,5 kg" sai da `CAR-1` cruzando o plano
 * com o histórico (12 reps nas quatro séries da última vez).
 */

/** ~11 min por exercício, contando o descanso (`CAR-6`) — a mesma conta da tela 09. */
const MINUTOS_POR_EXERCICIO = 11;

type Estado = 'treino' | 'andamento' | 'descanso' | 'feito';

const ROTULO_DO_ESTADO: Record<Estado, string> = {
  treino: 'Treino de hoje',
  andamento: 'Treino em andamento',
  descanso: 'Dia de descanso',
  feito: 'Treino de hoje feito',
};

const SEM_LETRAS: readonly Treino[] = [];

export default function Inicio() {
  const { sessao, carregada, comecar } = useSessao();
  const { sessoes, carregado, pendentes } = useHistorico();
  const { perfil } = usePerfil();
  const plano = usePlano();
  const agora = useAgora();
  // RN-22 — a letra trocada hoje, presa à sessão mais recente: fechou (ou apagou) um treino, a troca
  // caduca e o rodízio volta a mandar — já a partir da letra que foi feita.
  const [troca, setTroca] = useState<{ letra: string; depoisDe: string } | null>(null);

  // A grade só depende do DIA de agora: reler o relógio no foco não refaz as 371 células.
  const inicioDeHoje = inicioDoDia(agora);
  const colunas = useMemo(() => calendarioDoHeatmap(sessoes, inicioDeHoje), [sessoes, inicioDeHoje]);
  const ordem = useMemo(() => treinosEmOrdem(plano), [plano]);

  const ultima = idDaMaisRecente(sessoes);
  const sugerido = plano.treinos.length > 0 ? proximoTreino(sessoes, plano.treinos) : undefined;
  const trocado = troca?.depoisDe === ultima ? plano.porId.get(troca.letra) : undefined;
  // RN-31 · CAR-8: um treino aberto (voltou pelo botão do Android, ou reabriu o app) é retomado —
  // "Começar" por cima jogaria fora as séries feitas. Vale a letra da sessão, na versão de quando
  // ela começou (RN-17). Depois de 6 h o provedor descarta a sessão e o botão volta a "Começar".
  const emAndamento = sessao && !sessao.fimMs ? sessao : null;
  const treino = emAndamento
    ? (emAndamento.treino ?? plano.porId.get(emAndamento.treinoId) ?? sugerido)
    : (trocado ?? sugerido);

  const deHoje = sessoesDoDia(sessoes, chaveDoDia(agora));
  // Plano sem dia marcado não tem descanso a anunciar: todo dia vale.
  const diaDeTreino = plano.dias.length === 0 || plano.dias.includes(new Date(agora).getDay());
  const estado: Estado = emAndamento ? 'andamento' : deHoje.length > 0 ? 'feito' : diaDeTreino ? 'treino' : 'descanso';
  const frase =
    estado === 'descanso'
      ? 'Recuperar também é treino.'
      : estado === 'feito'
        ? `Você fez ${listaDeLetras(deHoje.map((s) => s.treinoId))}. Bom descanso.`
        : null;

  const escolher = (letra: string) => setTroca(letra === sugerido?.id ? null : { letra, depoisDe: ultima });

  const comecarTreino = () => {
    if (!treino) return;
    if (!emAndamento) comecar(treino.id);
    router.push('/treino/ativo');
  };

  // ⚠️ Antes do AsyncStorage responder, `sessoes` é [] e a letra seria sempre A: piscaria A e
  // trocaria para B — e o ano piscaria vazio. O cabeçalho (relógio e nome) entra na hora; os cards
  // esperam o histórico e a sessão. Melhor um instante sem card do que um número errado.
  const pronto = carregado && carregada && !!treino;
  const nome = primeiroNome(perfil.nome);
  const ola = saudacao(new Date(agora).getHours());

  // O cabeçalho: a saudação e, numa linha só, o que é útil de relance — o dia, a semana (RN-16)
  // e quando é o próximo treino. Os números só entram com o histórico carregado (sem piscar).
  const meta = plano.dias.length;
  const feitasNaSemana = sessoesDaSemana(sessoes, agora).length;
  const quando = proximoDiaDeTreino(plano.dias, agora);
  // Curta para caber numa linha no celular: "Terça, 6 out · 2 de 3 na semana · treino amanhã".
  const proximo =
    estado === 'treino' ? 'hoje tem treino'
      : estado === 'andamento' ? null
        : quando ? `treino ${comPreposicao(quando)}` : null;
  const linha = [
    dataCurta(agora),
    pronto && meta > 0 ? `${feitasNaSemana} de ${meta} na semana` : null,
    pronto ? proximo : null,
  ].filter(Boolean).join(' · ');

  return (
    <TelaDeAba aba="hoje" surgir={false}>
      <Surgir ordem={0} style={estilos.cabecalho}>
        <View style={estilos.linhaDoCabecalho}>
          <Texto style={estilos.saudacao} accessibilityRole="header" numberOfLines={1}>
            {nome ? `${ola}, ${nome}` : ola}
          </Texto>
          {/* A semana de relance: um ponto por dia de treino do plano, cheio quando foi feito. */}
          {pronto && meta > 0 && (
            <View style={estilos.pontos} aria-hidden>
              {Array.from({ length: meta }, (_, i) => (
                <View key={i} style={[estilos.ponto, i < feitasNaSemana && estilos.pontoCheio]} />
              ))}
            </View>
          )}
        </View>
        <Texto papel="desc" cor={neutral.n400}>{linha}</Texto>
        {/* RN-03: o treino do subsolo espera a rede — e a pessoa sabe disso. Só aparece quando há. */}
        {pendentes > 0 && (
          <Texto papel="desc" cor={neutral.n300}>
            {pendentes} {pendentes === 1 ? 'treino aguardando' : 'treinos aguardando'} conexão para subir
          </Texto>
        )}
      </Surgir>

      {/* Os cartões surgem em sequência, na ordem de leitura: o que fazer hoje, o ano, a semana. */}
      {pronto && treino && (
        <>
          <Surgir ordem={1}>
          <CartaoDoTreino
            treino={treino}
            estado={estado}
            frase={frase}
            sessoes={sessoes}
            letras={emAndamento ? SEM_LETRAS : ordem}
            sugerida={sugerido?.id}
            aoEscolher={escolher}
            aoComecar={comecarTreino}
          />
          </Surgir>
          <Surgir ordem={2} style={estilos.secaoComDivisoria}>
            <CartaoDoAno colunas={colunas} sessoes={sessoes} agora={agora} meta={plano.dias.length} porId={plano.porId} />
          </Surgir>
        </>
      )}
    </TelaDeAba>
  );
}

/**
 * O relógio da tela: lido UMA vez na montagem (render puro — `react-hooks/purity`) e relido quando
 * a tela volta a ser vista. ☠️ O Início fica montado embaixo da pilha durante o treino (o resumo
 * volta com `dismissTo('/hoje')`): sem reler, o treino que acabou de fechar teria `fimMs` DEPOIS do
 * "agora" e ficaria fora da semana, do ano e da sequência. Voltar do segundo plano também relê —
 * o app aberto de ontem para hoje não pode mostrar a data de ontem.
 */
function useAgora(): number {
  const [agora, setAgora] = useState(() => Date.now());
  useFocusEffect(
    useCallback(() => {
      setAgora(Date.now());
    }, []),
  );
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') setAgora(Date.now());
    });
    return () => assinatura.remove();
  }, []);
  return agora;
}

/* ─────────────────────────────── o treino de hoje ─────────────────────────────── */

function CartaoDoTreino({
  treino, estado, frase, sessoes, letras, sugerida, aoEscolher, aoComecar,
}: {
  treino: Treino;
  estado: Estado;
  frase: string | null;
  sessoes: readonly SessaoFechada[];
  /** RN-22 — as letras para trocar o treino de hoje. Vazio (ou uma só) esconde a troca. */
  letras: readonly Treino[];
  sugerida: string | undefined;
  aoEscolher: (letra: string) => void;
  aoComecar: () => void;
}) {
  // Descanso (RN-21) ou treino do dia já feito: o card fica na letra e no "mesmo assim", sem
  // relevo — a ação primária de hoje não é treinar.
  const folga = estado === 'descanso' || estado === 'feito';
  const n = treino.itens.length;
  const exercicios = `${n} ${n === 1 ? 'exercício' : 'exercícios'}`;
  const minutos = n * MINUTOS_POR_EXERCICIO;

  // O alvo de cada exercício, pela regra (`CAR-1`). O primeiro que subiu vira o destaque.
  // ⚠️ A MESMA conta do treino ativo (`useTreinoEmAndamento`), com a RN-19: senão o Início
  // prometeria uma carga e a tela 11 pediria outra.
  const linhas = treino.itens.map((item) => {
    const exercicio = EXERCICIOS_POR_ID.get(item.exercicioId);
    const alvo = proximoAlvo({
      ultimaSessao: ultimasSeriesDe(sessoes, item.exercicioId),
      faixa: item.faixa,
      cargaAtualKg: item.cargaKg,
      cargaDoPlanoVale: cargaDoPlanoVale(item, ultimaSessaoCom(sessoes, item.exercicioId)?.fimMs),
      incrementoKg: exercicio?.incrementoKg ?? 2.5,
      series: item.series,
    })[0];
    return { item, exercicio, alvo };
  });
  const subiu = linhas.find((l) => l.alvo.origem === 'progressao');
  const anterior = subiu ? ultimasSeriesDe(sessoes, subiu.item.exercicioId) : [];

  return (
    <View style={estilos.secao}>
      <View style={estilos.topoDoCartao}>
        <Texto papel="eyebrow" accessibilityRole="header" style={estilos.rotuloDoCartao}>
          {ROTULO_DO_ESTADO[estado]}
        </Texto>
        {letras.length > 1 && (
          <EscolhaDaLetra letras={letras} atual={treino.id} sugerida={sugerida} aoEscolher={aoEscolher} />
        )}
      </View>
      {frase && <Texto papel="corpo" cor={neutral.n200}>{frase}</Texto>}

      <View
        style={estilos.titulo}
        accessible
        accessibilityLabel={`Treino ${treino.id}, ${treino.nome}, ${exercicios}, cerca de ${minutos} minutos`}
      >
        <Texto papel="mega">{treino.id}</Texto>
        <View style={estilos.tituloTexto}>
          <Texto papel="h2" numberOfLines={2}>{treino.nome}</Texto>
          <Texto papel="desc">{exercicios} · ~{minutos} min</Texto>
        </View>
      </View>

      {!folga && subiu && (
        <View style={estilos.bloco}>
          <Texto papel="eyebrow">O que o app já sabe</Texto>
          <Texto papel="h2">
            {nomeCurtoDe(subiu.exercicio, subiu.item.exercicioId)} sobe para {formatarKg(subiu.alvo.cargaKg)} kg
          </Texto>
          <Texto papel="desc">
            Você fechou {anterior[0]?.reps} repetições nas {porExtenso(anterior.length)} séries da última vez.
          </Texto>
        </View>
      )}

      {!folga && (
        <View style={[estilos.bloco, estilos.lista]}>
          <Texto papel="eyebrow">Hoje você faz</Texto>
          {linhas.map(({ item, exercicio, alvo }) => (
            <View key={item.exercicioId} style={estilos.linha}>
              <Texto papel="corpo" numberOfLines={1} style={estilos.linhaNome}>
                {nomeCurtoDe(exercicio, item.exercicioId)}
              </Texto>
              <Texto papel="desc">{prescricaoDeHoje(item, exercicio, alvo)}</Texto>
            </View>
          ))}
        </View>
      )}

      <BotaoPrimario variante={folga ? 'secundario' : 'primario'} onPress={aoComecar}>
        {estado === 'andamento' ? `Retomar treino ${treino.id}` : folga ? 'Treinar mesmo assim' : 'Começar treino'}
      </BotaoPrimario>
    </View>
  );
}

/** RN-22 — as letras do plano. A de hoje é tinta cheia, como os chips do Progresso. */
function EscolhaDaLetra({
  letras, atual, sugerida, aoEscolher,
}: {
  letras: readonly Treino[];
  atual: string;
  sugerida: string | undefined;
  aoEscolher: (letra: string) => void;
}) {
  return (
    <View style={estilos.letras} accessibilityRole="radiogroup" accessibilityLabel="Treino de hoje">
      {letras.map((t) => {
        const ativa = t.id === atual;
        return (
          <Pressable
            key={t.id}
            onPress={() => aoEscolher(t.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: ativa }}
            accessibilityLabel={`Treino ${t.id}, ${t.nome}${t.id === sugerida ? ', o da vez no rodízio' : ''}`}
            hitSlop={(hit.min - LETRA) / 2}
            style={({ pressed }) => [estilos.letra, ativa && estilos.letraAtiva, pressed && !ativa && estilos.pressionada]}
          >
            <Texto style={[estilos.letraTexto, ativa && estilos.letraTextoAtiva]}>{t.id}</Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

/** "4 × 8–12 · 42,5 kg". Peso do corpo, ou carga ainda sem número: só séries × faixa. */
function prescricaoDeHoje(item: ItemDeTreino, exercicio: Exercicio | undefined, alvo: Alvo): string {
  const series = `${item.series} × ${item.faixa.min}–${item.faixa.max}`;
  if (exercicio?.unidade === 'corporal' || !(alvo.cargaKg > 0)) return series;
  return `${series} · ${formatarKg(alvo.cargaKg)} kg`;
}

/* ─────────────────────────────────── o ano ─────────────────────────────────── */

function CartaoDoAno({
  colunas, sessoes, agora, meta, porId,
}: {
  colunas: readonly DiaDoCalendario[][];
  sessoes: readonly SessaoFechada[];
  agora: number;
  /** RN-16 — a meta semanal é a quantidade de dias do plano. */
  meta: number;
  porId: ReadonlyMap<string, Treino>;
}) {
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const passados = useMemo(() => colunas.flat().filter((d) => !d.futuro), [colunas]);
  const vazio = sessoes.length === 0;
  const noAno = treinosNoUltimoAno(sessoes, agora);
  const ano = new Date(agora).getFullYear();

  // Abre no dia de hoje (o último que já passou). Um dia escolhido que saiu da grade volta para hoje.
  const achado = escolhido ? passados.findIndex((d) => d.data === escolhido) : -1;
  const i = achado >= 0 ? achado : passados.length - 1;
  const dia: DiaDoCalendario | undefined = passados[i];

  return (
    <View style={estilos.secao}>
      <View style={estilos.numeros}>
        <Texto papel="eyebrow" accessibilityRole="header">Seu ano</Texto>
        {noAno === 0 ? (
          <Texto papel="corpo" cor={neutral.n200}>
            {vazio ? 'Seu primeiro treino acende o primeiro quadrado.' : 'Seu próximo treino acende o primeiro quadrado.'}
          </Texto>
        ) : (
          <>
            <Texto papel="h2">{noAno} {noAno === 1 ? 'treino' : 'treinos'} em 12 meses</Texto>
            {meta > 0 && <Texto papel="desc">{fraseDaSequencia(semanasSeguidasNaMeta(sessoes, meta, agora))}</Texto>}
          </>
        )}
      </View>

      <Heatmap
        colunas={colunas}
        selecionado={vazio ? null : (dia?.data ?? null)}
        aoSelecionar={vazio ? undefined : setEscolhido}
      />
      <LegendaDoHeatmap />

      {!vazio && dia && (
        <DiaSelecionado
          dia={dia}
          ano={ano}
          sessoes={sessoesDoDia(sessoes, dia.data)}
          porId={porId}
          aoAnterior={i > 0 ? () => setEscolhido(passados[i - 1].data) : undefined}
          aoProximo={i < passados.length - 1 ? () => setEscolhido(passados[i + 1].data) : undefined}
        />
      )}
    </View>
  );
}

/** RN-53 — a sequência em semanas. Zero não é bronca: é o convite para a primeira. */
function fraseDaSequencia(semanas: number): string {
  if (semanas === 0) return 'Bata a meta desta semana para começar uma sequência.';
  if (semanas === 1) return '1 semana na meta';
  return `${semanas} semanas seguidas na meta`;
}

/** O dia tocado no heatmap: a data, o ouro se teve recorde, e os treinos dele. */
function DiaSelecionado({
  dia, ano, sessoes, porId, aoAnterior, aoProximo,
}: {
  dia: DiaDoCalendario;
  ano: number;
  sessoes: readonly SessaoFechada[];
  porId: ReadonlyMap<string, Treino>;
  aoAnterior?: () => void;
  aoProximo?: () => void;
}) {
  const titulo = dia.hoje ? `Hoje, ${diaEMes(dia.inicioMs, ano)}` : maiuscula(dataPorExtenso(dia.inicioMs, ano));
  return (
    <View style={estilos.dia}>
      <View style={estilos.diaTopo}>
        <View style={estilos.diaTitulo}>
          <Texto papel="corpo" accessibilityLiveRegion="polite">{titulo}</Texto>
          {dia.recorde && <Texto papel="eyebrow" cor={accent.signal}>Recorde neste dia</Texto>}
        </View>
        <Seta direcao="anterior" onPress={aoAnterior} />
        <Seta direcao="proximo" onPress={aoProximo} />
      </View>
      {sessoes.length === 0 ? (
        <Texto papel="desc">Nenhum treino neste dia.</Texto>
      ) : (
        sessoes.map((s, j) => (
          <LinhaDaSessao key={s.id} sessao={s} treino={porId.get(s.treinoId)} ultima={j === sessoes.length - 1} />
        ))
      )}
    </View>
  );
}

/**
 * Passo de um dia, para trás ou para a frente. A célula do heatmap é pequena demais para o dedo
 * acertar sempre (`CAR-11.3`); a seta tem 44 pt e acerta o dia vizinho. Sem `onPress`, apagada.
 */
function Seta({ direcao, onPress }: { direcao: 'anterior' | 'proximo'; onPress?: () => void }) {
  const ativa = !!onPress;
  return (
    <Pressable
      onPress={onPress}
      disabled={!ativa}
      accessibilityRole="button"
      accessibilityLabel={direcao === 'anterior' ? 'Dia anterior' : 'Próximo dia'}
      accessibilityState={{ disabled: !ativa }}
      style={({ pressed }) => [estilos.seta, pressed && estilos.pressionada]}
    >
      <View style={direcao === 'anterior' && estilos.virada}>
        <Chevron cor={ativa ? neutral.n100 : neutral.n400} />
      </View>
    </Pressable>
  );
}

/** Um treino do dia: letra, nome, séries e volume (`CAR-7`). Abre o treino no histórico. */
function LinhaDaSessao({ sessao, treino, ultima }: { sessao: SessaoFechada; treino: Treino | undefined; ultima: boolean }) {
  // O nome vem do plano de hoje; a letra que saiu do plano (RN-10) fica "Treino X".
  const nome = treino?.nome ?? `Treino ${sessao.treinoId}`;
  const n = sessao.series.length;
  const volume = tonelagem(sessao.series);
  const detalhe = `${n} ${n === 1 ? 'série' : 'séries'}${volume > 0 ? ` · ${formatarMilhar(volume)} kg` : ''}`;
  return (
    <Pressable
      // `/historico/[id]` nasce em paralelo: o `.expo/types` (gerado pelo dev server) ainda não a conhece.
      onPress={() => router.push(`/historico/${sessao.id}` as Href)}
      accessibilityRole="button"
      accessibilityLabel={`Treino ${sessao.treinoId}, ${nome}, ${detalhe}`}
      style={({ pressed }) => [estilos.sessao, !ultima && estilos.divisor, pressed && estilos.pressionada]}
    >
      <View style={estilos.selo}>
        <Texto style={estilos.seloTexto}>{sessao.treinoId}</Texto>
      </View>
      <View style={estilos.sessaoTexto}>
        <Texto papel="corpo" numberOfLines={1}>{nome}</Texto>
        <Texto papel="desc" numberOfLines={1}>{detalhe}</Texto>
      </View>
      <Chevron />
    </Pressable>
  );
}

/* ─────────────────────────────────── a semana ─────────────────────────────────── */

/** RN-23 — a semana de domingo a sábado, contra a meta (os dias do plano). Os pontos são os da tela 10. */
/* ─────────────────────────────────── texto ─────────────────────────────────── */

const DIAS_DA_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "Terça, 6 out" — a data do cabeçalho, curta. */
function dataCurta(ms: number): string {
  const d = new Date(ms);
  return `${DIAS_DA_SEMANA[d.getDay()]}, ${d.getDate()} ${MESES_CURTOS[d.getMonth()]}`;
}

/** "na quarta", "no sábado", "amanhã", "na terça que vem". */
function comPreposicao(quando: string): string {
  if (quando === 'amanhã') return 'amanhã';
  return `${quando.startsWith('sábado') || quando.startsWith('domingo') ? 'no' : 'na'} ${quando}`;
}

function saudacao(hora: number): string {
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** "joão da silva" → "João". Sem nome, a saudação fica sem vírgula. */
function primeiroNome(nome: string): string {
  const primeiro = nome.trim().split(/\s+/)[0] ?? '';
  return maiuscula(primeiro);
}

function maiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "o A" · "o A e o B" · "o A, o B e o C" — as letras feitas hoje, sem repetir. */
function listaDeLetras(letras: readonly string[]): string {
  const unicas = [...new Set(letras)].map((l) => `o ${l}`);
  if (unicas.length <= 1) return unicas[0] ?? '';
  return `${unicas.slice(0, -1).join(', ')} e ${unicas[unicas.length - 1]}`;
}

/** O id da sessão mais recente: muda quando um treino fecha ou é apagado. */
function idDaMaisRecente(sessoes: readonly SessaoFechada[]): string {
  let maisRecente: SessaoFechada | undefined;
  for (const s of sessoes) if (!maisRecente || s.fimMs > maisRecente.fimMs) maisRecente = s;
  return maisRecente?.id ?? '';
}

/** O selo da letra no dia selecionado — o mesmo da tela 17, menor. */
const SELO = space.s6;

/** O chip da letra no treino de hoje: pequeno, ao lado do rótulo de cima. */
const LETRA = space.s6;

const estilos = StyleSheet.create({
  // Cabeçalho compacto: a saudação na fonte de TEXTO (o título grande ficou para os números).
  cabecalho: { gap: 2 },
  linhaDoCabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s3 },
  saudacao: { flex: 1, fontFamily: font.textMedium, fontSize: size.h2, lineHeight: size.h2 * 1.3, color: neutral.n100 },

  // Seções abertas sobre o fundo, como no Progresso: sem cartão, uma divisória fina entre elas.
  secao: { gap: space.s4 },
  secaoComDivisoria: { borderTopWidth: 1, borderTopColor: surface.line, paddingTop: space.s5 },
  // O rótulo em cima e, logo abaixo, as letras para trocar o treino de hoje (RN-22).
  topoDoCartao: { alignItems: 'flex-start', gap: space.s2 },
  rotuloDoCartao: { flexShrink: 1 },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: space.s4 },
  tituloTexto: { flex: 1, gap: space.s1 },
  // "O que o app já sabe" e "Hoje você faz": dentro do card, separados por um fio — card dentro
  // de card seria uma superfície a mais sem significado.
  bloco: { borderTopWidth: 1, borderTopColor: surface.line, paddingTop: space.s4, gap: space.s2 },
  lista: { gap: space.s3 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s4 },
  linhaNome: { flex: 1 },

  // Com 6 letras (RN-10) num celular de 360 px o grupo não cabe ao lado do rótulo: desce de linha
  // e, se ainda assim não couber, encolhe e quebra — sem `flexShrink` ele vazaria do card na web.
  // Letras pequenas (32), com o alvo de toque completado pelo `hitSlop` até os 44 do `hit.min`;
  // o espaço entre elas é o dobro da folga, para os alvos não se sobreporem.
  letras: { flexDirection: 'row', flexWrap: 'wrap', gap: (hit.min - LETRA) },
  letra: {
    width: LETRA,
    height: LETRA,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: surface.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letraAtiva: { backgroundColor: neutral.n100, borderColor: neutral.n100 },
  letraTexto: { fontFamily: font.display, fontSize: size.desc, color: neutral.n300 },
  letraTextoAtiva: { color: neutral.n1000 },
  pressionada: { backgroundColor: surface.rowActive },

  numeros: { gap: space.s1 },
  dia: { borderTopWidth: 1, borderTopColor: surface.line, paddingTop: space.s2 },
  diaTopo: { flexDirection: 'row', alignItems: 'center' },
  diaTitulo: { flex: 1, gap: space.s1 },
  seta: { width: hit.min, height: hit.min, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  virada: { transform: [{ rotate: '180deg' }] },
  sessao: { flexDirection: 'row', alignItems: 'center', gap: space.s3, minHeight: hit.row, paddingVertical: space.s2 },
  divisor: { borderBottomWidth: 1, borderBottomColor: surface.line },
  selo: {
    width: SELO,
    height: SELO,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: surface.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seloTexto: { fontFamily: font.display, fontSize: size.body, color: neutral.n100 },
  sessaoTexto: { flex: 1 },

  pontos: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: space.s2 },
  // Os pontos da semana: o vazio é um degrau acima do card (n600) para aparecer sobre ele.
  ponto: { width: space.s2, height: space.s2, borderRadius: radius.full, backgroundColor: neutral.n600 },
  pontoCheio: { backgroundColor: neutral.n100 },
});
