import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View,
} from 'react-native';

import { BotaoPrimario } from '@/components/botao-primario';
import { AcaoDestrutiva, ConfirmacaoDestrutiva } from '@/components/confirmacao-destrutiva';
import {
  diaCurto, diaPorExtenso, hora, minutosDoTreino, nomeDoTreino, recordesPorSessao, repsDe, seriesPorExercicio,
} from '@/components/formato-do-historico';
import { Fundo } from '@/components/fundo';
import { Chevron } from '@/components/icones';
import { SerieCorrigivel } from '@/components/serie-corrigivel';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Voltar } from '@/components/voltar';
import { EXERCICIOS_POR_ID, nomeCurtoDe } from '@/data/exercicios';
import { corrigirSerie, removerSerie } from '@/domain/historico';
import { useHistorico } from '@/estado/historico';
import { usePlano } from '@/estado/perfil';
import { formatarKg, formatarMilhar, formatarTempo } from '@/lib/formato';
import { accent, hit, neutral, space, surface } from '@/theme/tokens';

/**
 * Detalhe de um treino concluído — onde ele é corrigido ou apagado (RN-40 a RN-43).
 *
 * No topo, os números de relance do resumo (minutos, séries, reps e tempo sob tensão), recalculados
 * das séries como elas estão agora. Sem a tonelagem de destaque: o total de kg levantado não diz
 * nada sobre o treino (a mesma decisão do resumo, `CAR-7`). Os recordes vêm em ouro, sem caixa.
 *
 * - Tocar numa série abre a correção NA LINHA (reps e carga); quem aceita ou recusa é o domínio
 *   (`corrigirSerie`, que também tira o `foiAlvo` — RN-41) e o motivo da recusa fica na linha.
 * - "Tirar esta série" pergunta antes; a última série do treino não sai sozinha (RN-42).
 * - "Apagar treino" pergunta antes, na própria tela (no navegador o `Alert` não faz nada).
 * - RN-43: nada é guardado à parte, então a correção vale na hora no app inteiro — e sobe para a
 *   nuvem substituindo a versão antiga (`corrigirSessao` marca o treino como pendente).
 */
export default function DetalheDoTreino() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessoes, carregado, corrigirSessao, apagarSessao } = useHistorico();
  const { porId } = usePlano();
  // Relógio lido uma vez (render puro): só decide se a data precisa do ano.
  const [agora] = useState(() => Date.now());
  /** A série aberta para correção, pela posição em `sessao.series`. Uma de cada vez. */
  const [editando, setEditando] = useState<number | null>(null);
  const [apagando, setApagando] = useState(false);
  const [saindo, setSaindo] = useState(false);

  const sessao = sessoes.find((s) => s.id === id);
  const recordes = useMemo(() => (id ? (recordesPorSessao(sessoes).get(id) ?? []) : []), [sessoes, id]);

  // Android: o voltar do sistema fecha primeiro o que está aberto na linha (correção ou pergunta).
  const algoAberto = editando !== null || apagando;
  useEffect(() => {
    if (!algoAberto) return;
    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
      setEditando(null);
      setApagando(false);
      return true;
    });
    return () => assinatura.remove();
  }, [algoAberto]);

  // Aberta por link (ou com a aba recarregada) não há para onde voltar: vai para a lista.
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/historico' as Href));

  // Apagado: a tela some com o fundo, não com um "não encontrado" piscando na transição.
  if (saindo) return <Fundo />;

  if (!carregado) {
    return (
      <Tela>
        <Voltar onPress={voltar} rotulo="Voltar" />
      </Tela>
    );
  }

  if (!sessao) {
    return (
      <Tela>
        <Voltar onPress={voltar} rotulo="Voltar" />
        <View style={estilos.vazio}>
          <View style={estilos.textos}>
            <Texto papel="h1" accessibilityRole="header">Esse treino não está mais aqui</Texto>
            <Texto papel="desc">Ele pode ter sido apagado. O resto do histórico continua no lugar.</Texto>
          </View>
          <BotaoPrimario onPress={() => router.dismissTo('/historico' as Href)} style={estilos.cta}>
            Ver o histórico
          </BotaoPrimario>
        </View>
      </Tela>
    );
  }

  const nomeDe = (exercicioId: string) => nomeCurtoDe(EXERCICIOS_POR_ID.get(exercicioId), exercicioId);
  const corporal = (exercicioId: string) => EXERCICIOS_POR_ID.get(exercicioId)?.unidade === 'corporal';

  const reps = repsDe(sessao.series);
  // `CAR-11.1`: o cronômetro de cada série. Treino antigo ou digitado pode não ter: aí não aparece.
  const tensao = sessao.series.reduce((soma, s) => soma + (s.duracaoSegundos ?? 0), 0);
  const minutos = minutosDoTreino(sessao);
  const grupos = seriesPorExercicio(sessao.series);
  const nome = nomeDoTreino(sessao.treinoId, porId);
  const titulo = porId.has(sessao.treinoId) ? `Treino ${sessao.treinoId} · ${nome}` : nome;
  // RN-42: a regra é do domínio — pergunta a ele se a série aberta pode sair, não repete a regra aqui.
  const tirada = editando !== null ? removerSerie(sessao, editando) : null;
  const bloqueioAoTirar = tirada && !tirada.ok ? tirada.motivo : null;

  const salvar = (posicao: number, correcao: { reps?: number; cargaKg?: number }): string | null => {
    const resultado = corrigirSerie(sessao, posicao, correcao);
    if (!resultado.ok) return resultado.motivo;
    // Nada mudou, nada a reenviar: corrigir marca o treino como pendente de subir de novo.
    if (resultado.sessao !== sessao) {
      corrigirSessao(resultado.sessao);
      AccessibilityInfo.announceForAccessibility('Série corrigida');
    }
    setEditando(null);
    return null;
  };

  const tirar = (posicao: number) => {
    const resultado = removerSerie(sessao, posicao);
    if (!resultado.ok) return;
    corrigirSessao(resultado.sessao);
    setEditando(null);
    AccessibilityInfo.announceForAccessibility('Série tirada do treino');
  };

  const apagar = () => {
    setSaindo(true);
    voltar();
    apagarSessao(sessao.id);
    AccessibilityInfo.announceForAccessibility('Treino apagado');
  };

  return (
    <Tela>
      {/* Fora da rolagem: num treino de 18 séries, o voltar não pode sumir lá em cima. */}
      <Voltar onPress={voltar} rotulo="Voltar" />
      {/* Teclado: no Android (edge-to-edge) o `adjustResize` não encolhe a janela, então o
          KeyboardAvoidingView empurra a rolagem e a ScrollView nativa segura o campo à vista; no iOS
          a própria ScrollView abre o espaço e rola até o campo (`automaticallyAdjustKeyboardInsets`). */}
      <KeyboardAvoidingView style={estilos.flex} behavior="padding" enabled={Platform.OS === 'android'}>
        <ScrollView
          contentContainerStyle={estilos.conteudo}
          showsVerticalScrollIndicator={false}
          // O toque em Salvar vale de primeira com o teclado aberto; no vazio, fecha o teclado.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets
        >
          <View style={estilos.textos}>
            <Texto papel="eyebrow">{diaPorExtenso(sessao.fimMs, agora)}</Texto>
            <Texto papel="h2" accessibilityRole="header">{titulo}</Texto>
            <Texto papel="desc">{hora(sessao.inicioMs)} às {hora(sessao.fimMs)}</Texto>
          </View>

          {/* Os números de relance, os mesmos do resumo. Singular no 1: "1 MINUTOS" sai em caixa alta. */}
          <View style={estilos.estatisticas}>
            <Estatistica valor={String(minutos)} rotulo={minutos === 1 ? 'minuto' : 'minutos'} />
            <Estatistica valor={String(sessao.series.length)} rotulo={sessao.series.length === 1 ? 'série' : 'séries'} />
            <Estatistica valor={formatarMilhar(reps)} rotulo={reps === 1 ? 'rep' : 'reps'} />
            {tensao > 0 && <Estatistica valor={formatarTempo(tensao)} rotulo="tensão" />}
          </View>

          {/* CAR-5: o único momento de cor — sem caixa, só o ouro no texto, como no resumo.
              Recalculado das séries: corrigir pode acender ou apagar o ouro. */}
          {recordes.length > 0 && (
            <View style={estilos.recordes}>
              <Texto papel="eyebrow" cor={accent.signal}>
                {recordes.length === 1 ? 'Recorde' : `${recordes.length} recordes`}
              </Texto>
              <View>
                {recordes.map((r) => (
                  <View key={r.exercicioId} style={estilos.linha}>
                    <Texto papel="corpo" cor={accent.signal} numberOfLines={1} style={estilos.flex}>
                      {nomeDe(r.exercicioId)}
                    </Texto>
                    <Texto papel="desc" cor={neutral.n400}>antes {formatarKg(r.antes)}</Texto>
                    <Texto papel="corpo" cor={accent.signal}>{formatarKg(r.novo)} kg</Texto>
                  </View>
                ))}
              </View>
              <Texto papel="desc" cor={neutral.n400}>1RM estimado pela fórmula de Epley.</Texto>
            </View>
          )}

          <View style={estilos.secao}>
            <View style={estilos.textos}>
              <Texto papel="eyebrow">Séries</Texto>
              {/* RN-43, discreta: é a resposta a "e o que eu já fiz depois disso?". */}
              <Texto papel="desc">Toque numa série para corrigir. Recordes e progresso se recalculam na hora.</Texto>
            </View>

            {grupos.map((grupo) => {
              const exercicio = nomeDe(grupo.exercicioId);
              return (
                <View key={grupo.exercicioId} style={estilos.exercicio}>
                  {/* Tela 15: o histórico e a prescrição do exercício. */}
                  <Pressable
                    onPress={() => router.push(`/exercicio/${grupo.exercicioId}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`${exercicio}: ver o exercício`}
                    style={({ pressed }) => [estilos.exercicioTopo, pressed && estilos.pressionado]}
                  >
                    <Texto papel="h2" numberOfLines={1} style={estilos.exercicioNome}>{exercicio}</Texto>
                    <Chevron />
                  </Pressable>

                  {grupo.series.map(({ serie, posicao }, k) => (
                    <SerieCorrigivel
                      key={posicao}
                      ordinal={k + 1}
                      serie={serie}
                      corporal={corporal(grupo.exercicioId)}
                      exercicio={exercicio}
                      aberta={editando === posicao}
                      aoAbrir={() => {
                        setApagando(false);
                        setEditando(posicao);
                      }}
                      aoFechar={() => setEditando(null)}
                      aoSalvar={(correcao) => salvar(posicao, correcao)}
                      aoTirar={() => tirar(posicao)}
                      bloqueioAoTirar={editando === posicao ? bloqueioAoTirar : null}
                    />
                  ))}
                </View>
              );
            })}
          </View>

          <View style={estilos.apagar}>
            {apagando ? (
              <ConfirmacaoDestrutiva
                pergunta={`Apagar o treino de ${diaCurto(sessao.fimMs)}?`}
                detalhe="Some do aparelho e da nuvem."
                acao="Apagar"
                rotuloDaAcao={`Apagar o treino de ${diaPorExtenso(sessao.fimMs, agora)}`}
                aoConfirmar={apagar}
                aoCancelar={() => setApagando(false)}
              />
            ) : (
              <AcaoDestrutiva
                onPress={() => {
                  setEditando(null);
                  setApagando(true);
                }}
              >
                Apagar treino
              </AcaoDestrutiva>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { paddingTop: space.s2, paddingBottom: space.s6, gap: space.s5 },
  textos: { gap: space.s1 },
  estatisticas: { flexDirection: 'row', justifyContent: 'space-between' },
  estatistica: { gap: space.s1 },
  recordes: { gap: space.s2 },
  // Linhas abertas com divisória fina, como as listas do resumo (sem cartão).
  linha: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.s3,
    paddingVertical: space.s3,
    borderBottomWidth: 1,
    borderBottomColor: surface.line,
  },
  secao: { gap: space.s3 },
  // Aberto, como o resto do app: o nome do exercício e as séries em linhas, sem cartão em volta.
  exercicio: { borderBottomWidth: 1, borderBottomColor: surface.line },
  exercicioTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
    minHeight: hit.row,
  },
  exercicioNome: { flex: 1 },
  pressionado: { backgroundColor: surface.rowActive },
  apagar: { borderTopWidth: 1, borderTopColor: surface.line, paddingTop: space.s4 },
  vazio: { flex: 1, justifyContent: 'space-between', paddingTop: space.s4 },
  cta: { marginBottom: space.s5 },
});
