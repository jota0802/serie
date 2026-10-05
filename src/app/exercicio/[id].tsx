import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BarrasDeCarga } from '@/components/barras-de-carga';
import { BotaoPrimario } from '@/components/botao-primario';
import { Card } from '@/components/card';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Voltar } from '@/components/voltar';
import { EXERCICIOS_POR_ID, NOME_DO_GRUPO, NOME_DO_PADRAO, nomeCurtoDe } from '@/data/exercicios';
import { TREINOS } from '@/data/treinos';
import { melhor1RM, type Alvo, type ItemDeTreino, type SerieRegistrada } from '@/domain';
import { ordenarPorFim, recordeDe, type SessaoFechada } from '@/domain/historico';
import { useHistorico } from '@/estado/historico';
import { useSessao } from '@/estado/sessao';
import { alvosSeTrocar, useTreinoComTroca } from '@/hooks/use-treino-com-troca';
import { formatarKg } from '@/lib/formato';
import { accent, neutral, space, surface } from '@/theme/tokens';

/** Quantas sessões as barras mostram — as do Figma. */
const SESSOES_NAS_BARRAS = 6;

/** "dd/mm" à mão, sem `Intl`: igual no Hermes e no navegador (mesma razão de `lib/formato`). */
function dataCurta(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** "12 · 12 · 11 × 40 kg" quando a carga não mudou; senão "12×40 · 10×42,5". */
function resumoDasSeries(series: SerieRegistrada[], corporal: boolean): string {
  if (corporal) return `${series.map((s) => s.reps).join(' · ')} reps`;
  const mesmaCarga = series.every((s) => s.cargaKg === series[0].cargaKg);
  return mesmaCarga
    ? `${series.map((s) => s.reps).join(' · ')} × ${formatarKg(series[0].cargaKg)} kg`
    : series.map((s) => `${s.reps}×${formatarKg(s.cargaKg)}`).join(' · ');
}

/** O porquê do alvo, na língua de quem treina. */
const MOTIVO_DO_ALVO: Record<Alvo['origem'], string> = {
  progressao: 'subiu, você fechou a faixa',
  repetir: 'sobe ao fechar a faixa',
  deload: 'carga reduzida para recuperar',
  estimado: 'estimado, primeira vez nesta variação',
  inicial: 'carga do plano',
};

type Prescricao = { item: ItemDeTreino; alvo: Alvo; treinoId: string; semReferencia: boolean };

function prescricaoDe(
  id: string | undefined,
  emAndamento: ReturnType<typeof useTreinoComTroca>,
  sessoes: readonly SessaoFechada[],
): Prescricao | null {
  if (!id) return null;
  if (emAndamento?.item?.exercicioId === id && emAndamento.alvo) {
    return {
      item: emAndamento.item, alvo: emAndamento.alvo, treinoId: emAndamento.treino.id,
      semReferencia: emAndamento.semReferencia,
    };
  }
  for (const t of TREINOS) {
    const item = t.itens.find((i) => i.exercicioId === id);
    const alvo = item && alvosSeTrocar(item, id, sessoes)?.alvos[0];
    if (item && alvo) return { item, alvo, treinoId: t.id, semReferencia: false };
  }
  return null;
}

/**
 * Tela 15 · Exercício — histórico E prescrição juntos.
 * Número dominante: O 1RM RECORDE (`CAR-5`). Aberta da 11 ("Histórico ›") e das 17/20
 * por `/exercicio/<id>`.
 */
export default function TelaExercicio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercicio = id ? EXERCICIOS_POR_ID.get(id) : undefined;
  const { sessoes } = useHistorico();
  const { sessao } = useSessao();
  const emAndamento = useTreinoComTroca();

  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/hoje'));

  // Só as sessões em que o exercício apareceu, mais recente primeiro.
  const passadas = useMemo(
    () =>
      ordenarPorFim(sessoes)
        .map((s) => ({ id: s.id, fimMs: s.fimMs, series: s.series.filter((x) => x.exercicioId === id) }))
        .filter((s) => s.series.length > 0),
    [sessoes, id],
  );

  // A prescrição: se é o exercício na mão agora, o alvo da sessão (com troca); senão, o do plano.
  const prescricao = prescricaoDe(id, emAndamento, sessoes);

  if (!exercicio) {
    return (
      <Tela>
        <Voltar onPress={voltar} />
        <Texto papel="h1">Exercício não encontrado</Texto>
      </Tela>
    );
  }

  const corporal = exercicio.unidade === 'corporal';
  // Peso do corpo não tem 1RM em kg: o recorde é a maior série em repetições.
  const recorde = corporal
    ? Math.max(0, ...passadas.flatMap((s) => s.series.map((x) => x.reps)))
    : recordeDe(sessoes, exercicio.id);
  const ultima = passadas[0];
  const anterioresAUltima = passadas.slice(1);
  // ⚠️ Ouro só se a ÚLTIMA sessão superou todas as outras — a tese visual do app.
  const ultimaFoiRecorde =
    !!ultima && anterioresAUltima.length > 0 &&
    (corporal
      ? Math.max(...ultima.series.map((s) => s.reps)) > Math.max(...anterioresAUltima.flatMap((s) => s.series.map((x) => x.reps)))
      : melhor1RM(ultima.series) > Math.max(...anterioresAUltima.map((s) => melhor1RM(s.series))));

  const barras = passadas
    .slice(0, SESSOES_NAS_BARRAS)
    .reverse()
    .map((s) => Math.max(...s.series.map((x) => (corporal ? x.reps : x.cargaKg))));

  // A troca só cabe no exercício da vez, numa sessão aberta (CAR-9).
  const eDaVez = !!sessao && emAndamento?.item?.exercicioId === exercicio.id;

  return (
    <Tela>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        {/* Um botão só, com o texto dentro: o Pressable em volta do <Voltar> era <button> em <button> na web. */}
        <Voltar onPress={voltar} rotulo="Voltar" />

        <Texto papel="h1">{nomeCurtoDe(exercicio)}</Texto>
        <Texto papel="desc" style={estilos.subtitulo}>
          {NOME_DO_PADRAO[exercicio.padrao].replace(/^./, (c) => c.toUpperCase())} · {NOME_DO_GRUPO[exercicio.grupo]}
        </Texto>

        <View style={estilos.hero}>
          <Texto papel="hero" cor={ultimaFoiRecorde ? accent.signal : neutral.n100}>
            {recorde > 0 ? formatarKg(recorde) : '—'}
          </Texto>
          {recorde > 0 && (
            <Texto papel="h2" cor={ultimaFoiRecorde ? accent.signal : neutral.n200}>{corporal ? ' reps' : ' kg'}</Texto>
          )}
        </View>
        <Texto papel="eyebrow">
          {corporal ? 'Máximo de repetições' : '1RM estimado'}
          {recorde > 0 ? (ultimaFoiRecorde ? ' · recorde na última sessão' : ' · recorde') : ' · sem histórico ainda'}
        </Texto>

        {barras.length > 0 && ultima && (
          <View style={estilos.secao}>
            <Texto papel="eyebrow">
              {corporal ? 'Repetições' : 'Carga'} nas últimas {barras.length} {barras.length === 1 ? 'sessão' : 'sessões'}
            </Texto>
            <BarrasDeCarga valores={barras} destacarUltima={ultimaFoiRecorde} />
            <Texto papel="desc">
              {dataCurta(ultima.fimMs)} · {ultima.series.map((s) => s.reps).join(' · ')} reps
            </Texto>
          </View>
        )}

        <View style={[estilos.secao, estilos.divisor]}>
          <Texto papel="eyebrow">
            {prescricao ? `Prescrição no treino ${prescricao.treinoId}` : 'Prescrição'}
          </Texto>
          {prescricao ? (
            <Card>
              <Texto papel="h2">
                {prescricao.item.series} séries · {prescricao.item.faixa.min}–{prescricao.item.faixa.max} reps
              </Texto>
              <Texto papel="desc">
                {/* Sem base para estimar não há carga a prescrever: "0 kg" seria inventar (CAR-9.1). */}
                {prescricao.semReferencia
                  ? 'Primeira vez nesta variação · escolha a carga'
                  : `${corporal ? 'peso do corpo' : `${formatarKg(prescricao.alvo.cargaKg)} kg`} · ${MOTIVO_DO_ALVO[prescricao.alvo.origem]}`}
              </Texto>
            </Card>
          ) : (
            <Texto papel="desc">Fora dos seus treinos. Entra pela troca (aparelho ocupado) ou ao montar um treino.</Texto>
          )}
        </View>

        {passadas.length > 0 && (
          <View style={[estilos.secao, estilos.divisor]}>
            <Texto papel="eyebrow">Sessões</Texto>
            {passadas.map((s) => (
              <View key={s.id} style={estilos.sessao}>
                <Texto papel="desc" cor={neutral.n300}>{dataCurta(s.fimMs)}</Texto>
                <Texto papel="desc" cor={neutral.n150} style={estilos.sessaoSeries} numberOfLines={1}>
                  {resumoDasSeries(s.series, corporal)}
                </Texto>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {eDaVez && (
        <BotaoPrimario onPress={() => router.push('/treino/trocar')} style={estilos.cta}>
          Trocar por outro exercício
        </BotaoPrimario>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  conteudo: { paddingBottom: space.s6, gap: space.s2 },
  subtitulo: { marginBottom: space.s5 },
  hero: { flexDirection: 'row', alignItems: 'baseline' },
  secao: { marginTop: space.s6, gap: space.s4 },
  divisor: { borderTopWidth: 1, borderTopColor: surface.line, paddingTop: space.s5, marginTop: space.s5 },
  sessao: { flexDirection: 'row', justifyContent: 'space-between', gap: space.s4 },
  sessaoSeries: { flex: 1, textAlign: 'right' },
  cta: { marginBottom: space.s5 },
});
