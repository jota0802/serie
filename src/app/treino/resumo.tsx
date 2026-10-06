import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BotaoPrimario } from '@/components/botao-primario';
import { Fundo } from '@/components/fundo';
import { Surgir } from '@/components/surgir';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { EXERCICIOS_POR_ID, nomeCurtoDe } from '@/data/exercicios';
import { chaveDoDia, inicioDaSemana, semanasSeguidasNaMeta } from '@/domain/calendario';
import { proximoTreino } from '@/domain/historico';
import {
  fraseDoProgresso, frasesDaComparacao, progressoDoTreino, proximoDiaDeTreino, recordesDoDia, resumoPorExercicio,
  type ExercicioDoResumo,
} from '@/domain/resumo';
import { fecharSessao, idDaSessao, itemDaSessao } from '@/domain/sessao';
import type { ItemDeTreino, SerieRegistrada } from '@/domain/types';
import { usePlano } from '@/estado/perfil';
import { useSessao, useTreinoEmAndamento } from '@/estado/sessao';
import { useGuardaDaSessao } from '@/hooks/use-guarda-da-sessao';
import { formatarKg, formatarTempo } from '@/lib/formato';
import { accent, font, hit, neutral, radius, size, space, surface } from '@/theme/tokens';

/**
 * Tela 14 · Resumo — fecha o ciclo com o que é ÚTIL depois de treinar, nesta ordem:
 *  0. os números de relance: minutos, séries, reps e tempo sob tensão (`CAR-11.1`);
 *  1. o que evoluiu: em quantos exercícios você subiu carga ou repetições (o destaque);
 *  2. os recordes do dia (`CAR-5`) — o único lugar de cor;
 *  3. NA PRÓXIMA VEZ: o alvo de cada exercício (`CAR-1` aplicada às séries de hoje) — a tese do
 *     app: ele te diz o que bater —, com as séries de hoje e a comparação com a última vez;
 *  4. a semana: quantos de quantos, a sequência (RN-53) e quando é o próximo.
 *
 * ⚠️ A tonelagem (Σ carga × reps) SAIU do destaque, a pedido de quem usa: "esse número não vale de
 * nada". Ninguém treina para mover 3.705 kg; treina para subir a carga e as repetições — que é o
 * que a dupla progressão mede (ver `CAR-7` em `docs/regras.md`).
 *
 * Sem cartões (o padrão aberto do app). Treino terminado antes (RN-30) diz isso com honestidade.
 * Errou um número? "Corrigir uma série" leva ao treino no histórico (RN-40).
 */
const DIAS_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function Resumo() {
  const { sessao, abandonar } = useSessao();
  const treino = useTreinoEmAndamento();
  const plano = usePlano();
  const pode = useGuardaDaSessao('resumo');
  if (!pode || !sessao || !treino) return <Fundo />;

  // O "agora" da tela é o fim do treino: render puro, e a semana é a do treino.
  const fimMs = sessao.fimMs ?? sessao.inicioMs;
  const fechada = fecharSessao(sessao);
  const comEsta = fechada ? [...treino.anteriores, fechada] : treino.anteriores;

  const minutos = Math.max(1, Math.round((fimMs - sessao.inicioMs) / 60000));
  const series = sessao.registradas.length;
  const reps = sessao.registradas.reduce((s, r) => s + r.reps, 0);
  // `CAR-11.1`: o tempo sob tensão cai de graça do cronômetro de cada série.
  const tensao = sessao.registradas.reduce((s, r) => s + (r.duracaoSegundos ?? 0), 0);

  // RN-30: terminou antes? O previsto é a soma das séries do treino como ele começou.
  const previstas = treino.treino.itens.reduce((t, i) => t + i.series, 0);
  const terminouAntes = series < previstas;

  const itensDeHoje = treino.treino.itens
    .map((_, i) => itemDaSessao(treino.treino, sessao, i))
    .filter((i): i is ItemDeTreino => !!i);
  const exercicios = resumoPorExercicio({
    registradas: sessao.registradas,
    anteriores: treino.anteriores,
    itens: itensDeHoje,
    incrementoDe: (id) => EXERCICIOS_POR_ID.get(id)?.incrementoKg ?? 2.5,
  });
  const progresso = fraseDoProgresso(progressoDoTreino(exercicios));
  const recordes = recordesDoDia(sessao.registradas, treino.recordeAnterior);

  // A semana do treino, contando ESTE treino (o efeito que grava no histórico pode não ter rodado).
  const domingo = inicioDaSemana(fimMs);
  const diasComTreino = new Set(comEsta.filter((s) => s.fimMs >= domingo).map((s) => chaveDoDia(s.fimMs)));
  const naSemana = comEsta.filter((s) => s.fimMs >= domingo && s.fimMs <= fimMs).length;
  const meta = plano.dias.length;
  const sequencia = semanasSeguidasNaMeta(comEsta, meta, fimMs);
  const hojeNaSemana = new Date(fimMs).getDay();

  const proximo = plano.treinos.length > 0 ? proximoTreino(comEsta, plano.treinos) : null;
  const quando = proximoDiaDeTreino(plano.dias, fimMs);

  // `dismissTo` volta ao Início que já está na base da pilha (o `replace` criava um segundo).
  // Navega ANTES de zerar a sessão: a guarda desta tela não pode reagir ao `null`.
  const fechar = () => {
    router.dismissTo('/hoje');
    abandonar();
  };
  // RN-40: o treino já está no histórico; a correção acontece lá, com o Início embaixo na pilha.
  const corrigir = () => {
    const id = idDaSessao(sessao);
    router.dismissTo('/hoje');
    abandonar();
    router.push(`/historico/${id}` as Href);
  };

  const quandoTerminou = new Date(fimMs);
  const data = `${DIAS[quandoTerminou.getDay()]}, ${quandoTerminou.getDate()} de ${MESES[quandoTerminou.getMonth()]}`;

  return (
    <Tela>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <Surgir ordem={0} style={estilos.topo}>
          <Texto papel="eyebrow">
            Treino {treino.treino.id} {terminouAntes ? '· terminado antes' : 'concluído'}
          </Texto>
          <Texto papel="h1" accessibilityRole="header">{treino.treino.nome}</Texto>
          <Texto papel="desc" cor={neutral.n400}>{data}</Texto>
        </Surgir>

        {/* Os números do treino de relance — minutos, séries, reps e tempo sob tensão (CAR-11.1). */}
        <Surgir ordem={1} style={estilos.estatisticas}>
          <Estatistica valor={String(minutos)} rotulo={minutos === 1 ? 'minuto' : 'minutos'} />
          <Estatistica valor={String(series)} rotulo={series === 1 ? 'série' : 'séries'} />
          <Estatistica valor={String(reps)} rotulo={reps === 1 ? 'rep' : 'reps'} />
          <Estatistica valor={formatarTempo(tensao)} rotulo="tensão" />
        </Surgir>

        {/* O destaque: o que evoluiu (não a tonelagem). Na fonte de texto, como a saudação do Início. */}
        <Surgir ordem={2} style={estilos.topo}>
          <Texto style={estilos.destaque}>{progresso.destaque}</Texto>
          {progresso.detalhe && <Texto papel="desc" cor={neutral.n300}>{progresso.detalhe}</Texto>}
          {terminouAntes && (
            <Texto papel="desc" cor={neutral.n400}>
              Você fez {series} de {previstas} séries. Tudo foi salvo; o que faltou só não conta para subir a carga.
            </Texto>
          )}
        </Surgir>

        {/* CAR-5: o único momento do app que tem cor — sem caixa, só o ouro no texto. */}
        {recordes.length > 0 && (
          <Surgir ordem={3} style={estilos.secao}>
            <Texto papel="eyebrow" cor={accent.signal}>
              {recordes.length === 1 ? 'Recorde' : `${recordes.length} recordes`}
            </Texto>
            <View>
              {recordes.map((r) => (
                <View key={r.exercicioId} style={estilos.linha}>
                  <Texto papel="corpo" cor={accent.signal} numberOfLines={1} style={estilos.flex}>
                    {nomeCurtoDe(EXERCICIOS_POR_ID.get(r.exercicioId), r.exercicioId)}
                  </Texto>
                  <Texto papel="desc" cor={neutral.n400}>antes {formatarKg(r.antigo)}</Texto>
                  <Texto papel="corpo" cor={accent.signal}>{formatarKg(r.novo)} kg</Texto>
                </View>
              ))}
            </View>
            <Texto papel="desc" cor={neutral.n400}>1RM estimado pela fórmula de Epley.</Texto>
          </Surgir>
        )}

        <Surgir ordem={4} style={estilos.secao}>
          <Texto papel="eyebrow">Na próxima vez</Texto>
          <View>
            {exercicios.map((e) => (
              <LinhaDoExercicio key={e.exercicioId} e={e} />
            ))}
          </View>
        </Surgir>

        {meta > 0 && (
          <Surgir ordem={5} style={estilos.secao}>
            <Texto papel="eyebrow">Sua semana</Texto>
            <View style={estilos.semana}>
              <View style={estilos.flex}>
                <Texto papel="h2">
                  {naSemana} de {meta} {meta === 1 ? 'treino' : 'treinos'}
                </Texto>
                <Texto papel="desc" cor={neutral.n400}>
                  {sequencia > 0
                    ? `${sequencia} ${sequencia === 1 ? 'semana' : 'semanas seguidas'} na meta`
                    : naSemana >= meta
                      ? 'Meta da semana batida.'
                      : `Faltam ${meta - naSemana} para a meta da semana.`}
                </Texto>
              </View>
              <View style={estilos.dias} accessibilityLabel={`${naSemana} de ${meta} treinos nesta semana`}>
                {DIAS_CURTOS.map((letra, d) => {
                  const ms = domingo + d * 86_400_000;
                  // o dia é contado pela data local (`chaveDoDia`), não por 24 h
                  const treinou = diasComTreino.has(chaveDoDia(ms + 12 * 3_600_000));
                  return (
                    <View key={d} style={estilos.dia}>
                      <View
                        style={[
                          estilos.ponto,
                          plano.dias.includes(d) && estilos.pontoDePlano,
                          treinou && estilos.pontoCheio,
                          d === hojeNaSemana && estilos.pontoHoje,
                        ]}
                      />
                      <Texto papel="nav" cor={d === hojeNaSemana ? neutral.n100 : neutral.n400}>{letra}</Texto>
                    </View>
                  );
                })}
              </View>
            </View>
          </Surgir>
        )}
      </ScrollView>

      <View style={estilos.rodape}>
        {proximo && (
          <Texto papel="desc" cor={neutral.n400} style={estilos.centro}>
            Próximo: Treino {proximo.id} · {proximo.nome}{quando ? ` · ${quando}` : ''}
          </Texto>
        )}
        <BotaoPrimario onPress={fechar}>Fechar</BotaoPrimario>
        <Pressable onPress={corrigir} accessibilityRole="button" style={estilos.corrigir} hitSlop={space.s2}>
          <Texto papel="desc" cor={neutral.n300}>Errou um número? Corrigir uma série</Texto>
        </Pressable>
      </View>
    </Tela>
  );
}

function Estatistica({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View style={estilos.estatistica}>
      <Texto papel="h1">{valor}</Texto>
      <Texto papel="eyebrow">{rotulo}</Texto>
    </View>
  );
}

function rotuloDaSerie(s: SerieRegistrada): string {
  const corporal = EXERCICIOS_POR_ID.get(s.exercicioId)?.unidade === 'corporal';
  return corporal && s.cargaKg === 0 ? `${s.reps}` : `${s.reps}×${formatarKg(s.cargaKg)}`;
}

/**
 * Um exercício: o nome e, à direita, o alvo da PRÓXIMA vez (↑ quando a carga sobe). Embaixo, o que
 * foi feito hoje e a comparação com a última vez.
 */
function LinhaDoExercicio({ e }: { e: ExercicioDoResumo }) {
  const exercicio = EXERCICIOS_POR_ID.get(e.exercicioId);
  const corporal = exercicio?.unidade === 'corporal';
  const sobe = e.proximaVez?.origem === 'progressao';
  const proxima = e.proximaVez
    ? corporal && e.proximaVez.cargaKg === 0
      ? `${e.proximaVez.reps} reps`
      : `${formatarKg(e.proximaVez.cargaKg)} kg × ${e.proximaVez.reps}`
    : null;
  const evoluiu = e.comparacao.tipo === 'carga-subiu' || e.comparacao.tipo === 'mais-reps';

  return (
    <View style={estilos.exercicio}>
      <View style={estilos.linhaSemBorda}>
        <Texto papel="corpo" numberOfLines={1} style={estilos.flex}>{nomeCurtoDe(exercicio, e.exercicioId)}</Texto>
        {proxima && (
          <Texto papel="corpo" cor={sobe ? neutral.n100 : neutral.n200} style={estilos.proxima}>
            {proxima}{sobe ? ' ↑' : ''}
          </Texto>
        )}
      </View>
      <Texto papel="desc" cor={neutral.n400} numberOfLines={2}>
        {e.series.map(rotuloDaSerie).join('  ')}
        {' · '}
        <Texto papel="desc" cor={evoluiu ? neutral.n200 : neutral.n400}>{frasesDaComparacao(e.comparacao, formatarKg)}</Texto>
      </Texto>
    </View>
  );
}

const PONTO = 10;

const estilos = StyleSheet.create({
  conteudo: { paddingTop: space.s4, paddingBottom: space.s5, gap: space.s6 },
  topo: { gap: space.s1 },
  estatisticas: { flexDirection: 'row', justifyContent: 'space-between' },
  estatistica: { gap: space.s1 },
  // O destaque em fonte de TEXTO, maior — o mesmo tom da saudação do Início.
  destaque: { fontFamily: font.textMedium, fontSize: size.h2, lineHeight: size.h2 * 1.3, color: neutral.n100 },
  secao: { gap: space.s2 },
  flex: { flex: 1 },
  // Linhas abertas com divisória fina, como as listas do app (sem cartão).
  linha: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.s3,
    paddingVertical: space.s3,
    borderBottomWidth: 1,
    borderBottomColor: surface.line,
  },
  linhaSemBorda: { flexDirection: 'row', alignItems: 'baseline', gap: space.s3 },
  exercicio: {
    gap: space.s1,
    paddingVertical: space.s3,
    borderBottomWidth: 1,
    borderBottomColor: surface.line,
  },
  proxima: { fontFamily: font.textMedium },
  semana: { flexDirection: 'row', alignItems: 'center', gap: space.s4 },
  dias: { flexDirection: 'row', gap: space.s2 },
  dia: { alignItems: 'center', gap: space.s1 },
  ponto: { width: PONTO, height: PONTO, borderRadius: radius.full, backgroundColor: surface.raised },
  pontoDePlano: { borderWidth: 1, borderColor: neutral.n500 },
  pontoCheio: { backgroundColor: neutral.n100, borderColor: neutral.n100 },
  pontoHoje: { borderWidth: 2, borderColor: neutral.n100 },
  // O rodapé com divisória: a lista termina nela, em vez de "entrar" embaixo do botão.
  rodape: {
    gap: space.s3,
    paddingTop: space.s3,
    paddingBottom: space.s2,
    borderTopWidth: 1,
    borderTopColor: surface.line,
  },
  centro: { textAlign: 'center' },
  corrigir: { minHeight: hit.min, alignItems: 'center', justifyContent: 'center' },
});
