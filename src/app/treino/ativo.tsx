import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BotaoPrimario } from '@/components/botao-primario';
import { Fundo } from '@/components/fundo';
import { Chevron, Fechar, SetaCima, Troca } from '@/components/icones';
import { LinhaDeSerie } from '@/components/linha-de-serie';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { nomeCurtoDe } from '@/data/exercicios';
import { useSessao } from '@/estado/sessao';
import { useCronometro } from '@/hooks/use-cronometro';
import { useGuardaDaSessao } from '@/hooks/use-guarda-da-sessao';
import { useTreinoComTroca } from '@/hooks/use-treino-com-troca';
import { formatarKg, formatarTempo } from '@/lib/formato';
import { accent, hit, neutral, radius, space, surface } from '@/theme/tokens';

/**
 * Tela 11 · Treino ativo — a tela do app. Todo o resto é apoio.
 * Número dominante: A CARGA ALVO.
 */
export default function TreinoAtivo() {
  const { sessao, iniciarSerie, abandonar } = useSessao();
  // Com a CAR-9.1: depois de trocar, o alvo é estimado, não herdado do outro aparelho.
  const treino = useTreinoComTroca();
  const decorridos = useCronometro(sessao?.inicioMs ?? null);

  // O treino acabou: quem manda na navegação é o estado, não o botão. Sem sessão
  // (recarregou a aba, CAR-8) volta para o Hoje. A guarda faz os dois num efeito —
  // ☠️ `router.replace` durante o render dispara "Cannot update a component while rendering".
  const pode = useGuardaDaSessao();

  if (!pode || !sessao || !treino?.item || !treino.alvo) return <Fundo />;

  const { item, exercicio, alvo, alvos, feitasDoExercicio, proximoExercicio, ultimaVez } = treino;

  const cargaAnterior = ultimaVez[0]?.cargaKg;
  const subiu = alvo.origem === 'progressao';
  const indiceExercicio = sessao.indiceExercicio + 1;
  const corporal = exercicio?.unidade === 'corporal';
  // CAR-9.1: a carga da variação nova é palpite, e o app diz de onde ele veio.
  const notaDaEstimativa = treino.semReferencia
    ? 'Primeira vez, sem base para estimar · escolha a carga e registre no descanso'
    : feitasDoExercicio.length > 0
      ? 'Primeira vez nesta variação · segue a carga da sua 1ª série'
      : treino.baseDaEstimativa
        ? `Estimado pela carga de ${nomeCurtoDe(treino.baseDaEstimativa).toLowerCase()} · ajuste se precisar`
        : 'Estimado · primeira vez nesta variação, ajuste se precisar';

  const comecarSerie = () => {
    iniciarSerie();
    router.push('/treino/execucao');
  };

  // `dismissTo` volta ao Hoje que já está embaixo na pilha; `replace` empilhava um segundo Hoje.
  const sair = () => { router.dismissTo('/hoje'); abandonar(); };

  return (
    <Tela>
      <View style={estilos.topo}>
        <View style={estilos.topoTexto}>
          <Texto papel="eyebrow" cor={neutral.n100}>Treino {treino.treino.id}</Texto>
          <Texto papel="eyebrow">·</Texto>
          <Texto papel="eyebrow">Exercício {indiceExercicio} de {treino.treino.itens.length}</Texto>
        </View>
        <View style={estilos.topoDireita}>
          <Texto papel="desc" cor={neutral.n300}>{formatarTempo(decorridos)}</Texto>
          <Pressable onPress={sair} accessibilityRole="button" accessibilityLabel="Encerrar treino" style={estilos.alvoIcone}>
            <Fechar />
          </Pressable>
        </View>
      </View>

      <View style={estilos.trilho}>
        <View style={[estilos.trilhoCheio, { width: `${Math.round(treino.progresso * 100)}%` }]} />
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <View style={estilos.nome}>
          <Texto papel="h1" numberOfLines={1} style={estilos.nomeTexto}>
            {nomeCurtoDe(exercicio, item.exercicioId)}
          </Texto>
          {/* Tela 15: histórico e prescrição do exercício que está na mão AGORA (já trocado). */}
          <Pressable
            onPress={() => router.push(`/exercicio/${item.exercicioId}`)}
            accessibilityRole="button"
            accessibilityLabel="Histórico do exercício"
            style={estilos.historico}
          >
            <Texto papel="desc" cor={neutral.n300}>Histórico</Texto>
            <Chevron tamanho={16} />
          </Pressable>
        </View>

        <View style={estilos.carga}>
          {/* Sem base para estimar, um traço: "0 kg" no número dominante pareceria sugestão. */}
          <Texto papel="hero">
            {corporal ? 'peso do corpo' : treino.semReferencia ? '—' : formatarKg(alvo.cargaKg)}
          </Texto>
          {!corporal && <Texto papel="h2" cor={neutral.n200}> kg</Texto>}
          <Texto papel="desc" cor={neutral.n150}>  {item.faixa.min}–{item.faixa.max} reps</Texto>
        </View>

        {/* Peso do corpo não tem carga para estimar: a nota seria ruído. */}
        {alvo.origem === 'estimado' && !corporal && (
          <Texto papel="desc" cor={neutral.n300}>{notaDaEstimativa}</Texto>
        )}

        {subiu && cargaAnterior != null && (
          <View style={estilos.subiu}>
            <SetaCima tamanho={15} cor={accent.signal} />
            <Texto papel="desc" cor={accent.signal}>
              Subiu de {formatarKg(cargaAnterior)} kg · você fechou a faixa
            </Texto>
          </View>
        )}

        <View style={estilos.divisor} />

        <View style={estilos.series}>
          {alvos.map((a, i) => {
            const feita = feitasDoExercicio[i];
            return (
              <LinhaDeSerie
                key={i}
                numero={i + 1}
                estado={feita ? 'feita' : i === sessao.indiceSerie ? 'ativa' : 'pendente'}
                reps={feita?.reps}
                cargaKg={feita?.cargaKg ?? a.cargaKg}
                faixa={i === sessao.indiceSerie ? item.faixa : undefined}
              />
            );
          })}
        </View>
      </ScrollView>

      <View style={estilos.rodape}>
        {/* CAR-9 · tela 16: aparelho ocupado. */}
        <Pressable
          onPress={() => router.push('/treino/trocar')}
          accessibilityRole="button"
          style={estilos.trocar}
        >
          <Troca tamanho={17} />
          <Texto papel="corpo" cor={neutral.n200}>Trocar exercício</Texto>
        </Pressable>
        {proximoExercicio && (
          <Texto papel="desc" cor={neutral.n400} numberOfLines={1}>
            Depois: {nomeCurtoDe(proximoExercicio)}
          </Texto>
        )}
      </View>

      <BotaoPrimario onPress={comecarSerie} style={estilos.cta}>Iniciar série</BotaoPrimario>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topoTexto: { flexDirection: 'row', alignItems: 'center', gap: space.s2, flex: 1 },
  topoDireita: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  // O glifo é pequeno; o alvo é 44. CAR-11.3.
  alvoIcone: { width: hit.min, height: hit.min, alignItems: 'flex-end', justifyContent: 'center' },
  trilho: { height: 3, borderRadius: radius.full, backgroundColor: neutral.n800, overflow: 'hidden' },
  trilhoCheio: { height: 3, borderRadius: radius.full, backgroundColor: neutral.n100 },
  conteudo: { paddingTop: space.s5, paddingBottom: space.s4, gap: space.s2 },
  nome: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s3 },
  nomeTexto: { flex: 1 },
  historico: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: hit.min },
  carga: { flexDirection: 'row', alignItems: 'baseline' },
  subiu: { flexDirection: 'row', alignItems: 'center', gap: space.s2, marginTop: space.s1 },
  divisor: { height: 1, backgroundColor: surface.line, marginVertical: space.s4 },
  series: { gap: space.s2 },
  rodape: {
    height: hit.min, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: space.s3,
  },
  trocar: { flexDirection: 'row', alignItems: 'center', gap: space.s2, minHeight: hit.min },
  cta: { marginBottom: space.s5 },
});
