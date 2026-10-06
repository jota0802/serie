import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BotaoPrimario } from '@/components/botao-primario';
import { Fundo } from '@/components/fundo';
import { Chevron, Fechar, SetaCima, Troca } from '@/components/icones';
import { LinhaDeSerie } from '@/components/linha-de-serie';
import { PainelDeEncerrar } from '@/components/painel-de-encerrar';
import { Surgir } from '@/components/surgir';
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
  const { sessao, iniciarSerie, terminarAgora, abandonar } = useSessao();
  // Com a CAR-9.1: depois de trocar, o alvo é estimado, não herdado do outro aparelho.
  const treino = useTreinoComTroca();
  const decorridos = useCronometro(sessao?.inicioMs ?? null);

  // O treino acabou: quem manda na navegação é o estado, não o botão. Sem sessão
  // (recarregou a aba, CAR-8) volta para o Hoje. A guarda faz os dois num efeito —
  // ☠️ `router.replace` durante o render dispara "Cannot update a component while rendering".
  const pode = useGuardaDaSessao();
  // O X abre o painel de encerrar (RN-30 e RN-32); antes ele descartava o treino direto.
  const [encerrando, setEncerrando] = useState(false);

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
  // Navega ANTES de zerar a sessão: a guarda desta tela não pode reagir ao `null`.
  const sair = () => { router.dismissTo('/hoje'); abandonar(); };
  // RN-30: salva como está. Quem navega é a guarda — viu o fim, leva ao resumo (como na última série).
  const terminarESalvar = () => { setEncerrando(false); terminarAgora(); };
  const seriesPrevistas = treino.treino.itens.reduce((total, i) => total + i.series, 0);

  const extra = corporal && alvo.cargaKg > 0;

  const tela = (
    <Tela>
      <View style={estilos.topo}>
        <View style={estilos.topoTexto}>
          <Texto papel="eyebrow" cor={neutral.n100}>Treino {treino.treino.id}</Texto>
          <Texto papel="eyebrow">·</Texto>
          <Texto papel="eyebrow">Exercício {indiceExercicio} de {treino.treino.itens.length}</Texto>
        </View>
        <View style={estilos.topoDireita}>
          <Texto papel="desc" cor={neutral.n300}>{formatarTempo(decorridos)}</Texto>
          <Pressable onPress={() => setEncerrando(true)} accessibilityRole="button" accessibilityLabel="Encerrar treino" style={estilos.alvoIcone}>
            <Fechar />
          </Pressable>
        </View>
      </View>

      <View style={estilos.trilho}>
        <View style={[estilos.trilhoCheio, { width: `${Math.round(treino.progresso * 100)}%` }]} />
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <Surgir ordem={0} style={estilos.nome}>
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
        </Surgir>

        <Surgir ordem={1} style={estilos.carga}>
          {/* Sem base para estimar, um traço: "0 kg" no número dominante pareceria sugestão. */}
          <Texto papel="hero">
            {/* Peso do corpo COM carga extra (cinto, colete): o número é a extra, senão o topo
                dizia "peso do corpo" e as séries embaixo, "7,5 kg". */}
            {corporal
              ? (extra ? `+${formatarKg(alvo.cargaKg)}` : 'peso do corpo')
              : treino.semReferencia ? '—' : formatarKg(alvo.cargaKg)}
          </Texto>
          {(!corporal || extra) && <Texto papel="h2" cor={neutral.n200}> kg</Texto>}
          <Texto papel="desc" cor={neutral.n150}>  {item.faixa.min}–{item.faixa.max} reps</Texto>
        </Surgir>
        {extra && <Texto papel="desc" cor={neutral.n300}>Peso do corpo + carga extra</Texto>}

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

        <Surgir ordem={2} style={estilos.series}>
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
        </Surgir>
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

  return (
    <View style={estilos.raiz}>
      {/* Com o painel aberto, a tela embaixo sai da árvore do leitor de tela (o painel é modal). */}
      <View style={estilos.raiz} aria-hidden={encerrando}>{tela}</View>
      {encerrando && (
        <PainelDeEncerrar
          feitas={sessao.registradas.length}
          previstas={seriesPrevistas}
          aoTerminar={terminarESalvar}
          aoDescartar={sair}
          aoContinuar={() => setEncerrando(false)}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
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
