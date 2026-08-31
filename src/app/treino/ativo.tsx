import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BotaoPrimario } from '@/components/botao-primario';
import { Chevron, Fechar, SetaCima, Troca } from '@/components/icones';
import { LinhaDeSerie } from '@/components/linha-de-serie';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { nomeCurtoDe } from '@/data/exercicios';
import { ULTIMA_SESSAO } from '@/data/historico';
import { useSessao, useTreinoEmAndamento } from '@/estado/sessao';
import { useCronometro } from '@/hooks/use-cronometro';
import { formatarKg, formatarTempo } from '@/lib/formato';
import { accent, hit, neutral, radius, space, surface } from '@/theme/tokens';

/**
 * Tela 11 · Treino ativo — a tela do app. Todo o resto é apoio.
 * Número dominante: A CARGA ALVO.
 */
export default function TreinoAtivo() {
  const { sessao, iniciarSerie, abandonar } = useSessao();
  const treino = useTreinoEmAndamento();
  const decorridos = useCronometro(sessao?.inicioMs ?? null);

  // O treino acabou: quem manda na navegação é o estado, não o botão.
  // ☠️ Isto TEM que ser efeito. Chamar `router.replace` durante o render dispara
  // "Cannot update a component while rendering a different component" — o React
  // proíbe efeito colateral em render, e o aviso aparece de verdade.
  const terminou = treino?.terminou ?? false;
  useEffect(() => {
    if (terminou) router.replace('/treino/resumo');
  }, [terminou]);

  if (!sessao || !treino || terminou) return null;

  const { item, exercicio, alvo, alvos, feitasDoExercicio, proximoExercicio } = treino;
  if (!item || !alvo) return null;

  const cargaAnterior = (ULTIMA_SESSAO[item.exercicioId] ?? [])[0]?.cargaKg;
  const subiu = alvo.origem === 'progressao';
  const indiceExercicio = treino.treino.itens.indexOf(item) + 1;

  const comecarSerie = () => {
    iniciarSerie();
    router.push('/treino/execucao');
  };

  const sair = () => { abandonar(); router.replace('/hoje'); };

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
          <View style={estilos.historico}>
            <Texto papel="desc" cor={neutral.n300}>Histórico</Texto>
            <Chevron tamanho={16} />
          </View>
        </View>

        <View style={estilos.carga}>
          <Texto papel="hero">
            {exercicio?.unidade === 'corporal' ? 'peso do corpo' : formatarKg(alvo.cargaKg)}
          </Texto>
          {exercicio?.unidade !== 'corporal' && <Texto papel="h2" cor={neutral.n200}> kg</Texto>}
          <Texto papel="desc" cor={neutral.n150}>  {item.faixa.min}–{item.faixa.max} reps</Texto>
        </View>

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
        <View style={estilos.trocar}>
          <Troca tamanho={17} />
          <Texto papel="corpo" cor={neutral.n200}>Trocar exercício</Texto>
        </View>
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
