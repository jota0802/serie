import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BarraDeVolume } from '@/components/barra-de-volume';
import { Card } from '@/components/card';
import { LinhaDeAjuste } from '@/components/linha-de-ajuste';
import { TelaDeAba } from '@/components/tela-de-aba';
import { Texto } from '@/components/texto';
import { EXERCICIOS_POR_ID, nomeCurtoDe } from '@/data/exercicios';
import { PLANO, TREINOS } from '@/data/treinos';
import { duracaoMediaDaSerie } from '@/domain/forca';
import { sessoesDaSemana } from '@/domain/historico';
import {
  completarGrupos, dataRelativa, frequenciaSemanal, gruposDoPlano, maisNegligenciado,
  recordesRecentes, seriesDosUltimosDias, treinoQueTrabalha,
} from '@/domain/progresso';
import type { GrupoMuscular } from '@/domain/types';
import { FAIXA_DE_VOLUME, volumeSemanal } from '@/domain/volume';
import { useHistorico } from '@/estado/historico';
import { formatarKg } from '@/lib/formato';
import { accent, hit, neutral, radius, space, surface } from '@/theme/tokens';

/**
 * Tela 20 · Progresso — `CAR-4`.
 *
 * Número dominante: TREINOS POR SEMANA. Abaixo, o volume por grupo contra a faixa 10–20,
 * que responde a única pergunta "de treinador" do app: o que estou negligenciando?
 * O grupo mais abaixo da faixa vira "uma coisa pra arrumar" — uma, não uma lista.
 *
 * Tudo sai do histórico real (`useHistorico`): treinou hoje, a barra já mexeu.
 */
const PERIODOS = [
  { rotulo: '4 semanas', semanas: 4 },
  { rotulo: '3 meses', semanas: 13 },
  { rotulo: 'Tudo', semanas: Infinity },
] as const;

const NOME_DO_GRUPO: Record<GrupoMuscular, string> = {
  peito: 'Peito', costas: 'Costas', ombro: 'Ombros', biceps: 'Bíceps', triceps: 'Tríceps',
  quadriceps: 'Quadríceps', posterior: 'Posterior', gluteo: 'Glúteo', panturrilha: 'Panturrilha', core: 'Core',
};

const GRUPOS_DO_PLANO = gruposDoPlano(TREINOS, EXERCICIOS_POR_ID);

export default function Progresso() {
  const { sessoes, carregado } = useHistorico();
  const [periodo, setPeriodo] = useState<number>(PERIODOS[0].semanas);
  // Relógio lido uma vez, na montagem — render puro (react-hooks/purity). Troca de aba é
  // `replace`, então voltar ao Progresso remonta a tela e relê a hora.
  const [agora] = useState(() => Date.now());

  const frequencia = frequenciaSemanal(sessoes, agora, periodo);
  // A mesma janela da frequência — `semanas` é arredondado e cortaria a primeira sessão.
  const doPeriodo = sessoes.filter((s) => s.fimMs >= frequencia.desdeMs && s.fimMs <= agora);
  const serieMedia = Math.round(duracaoMediaDaSerie(doPeriodo.flatMap((s) => s.series)));
  const nestaSemana = sessoesDaSemana(sessoes, agora).length;

  const volume = completarGrupos(
    volumeSemanal(seriesDosUltimosDias(sessoes, agora), EXERCICIOS_POR_ID),
    GRUPOS_DO_PLANO,
  );
  // A régua vai até o teto da faixa — ou além, se alguém passou dele.
  const escala = Math.max(FAIXA_DE_VOLUME.max, ...volume.map((v) => v.series));
  const pior = maisNegligenciado(volume);
  const ondeArrumar = pior && treinoQueTrabalha(pior.grupo, TREINOS, EXERCICIOS_POR_ID);
  const recordes = recordesRecentes(sessoes);

  return (
    <TelaDeAba titulo="Progresso" aba="progresso">
      <View style={estilos.chips} accessibilityRole="radiogroup">
        {PERIODOS.map(({ rotulo, semanas }) => {
          const ativo = semanas === periodo;
          return (
            <Pressable
              key={rotulo}
              onPress={() => setPeriodo(semanas)}
              accessibilityRole="radio"
              accessibilityState={{ selected: ativo }}
              style={[estilos.chip, ativo && estilos.chipAtivo]}
            >
              <Texto papel="desc" cor={ativo ? neutral.n1000 : neutral.n300}>{rotulo}</Texto>
            </Pressable>
          );
        })}
      </View>

      {carregado && (
        <>
          <View style={estilos.resumo}>
            <View style={estilos.numero}>
              <Texto papel="hero">{formatarKg(frequencia.media)}</Texto>
              <Texto papel="h2" cor={neutral.n300}>treinos / semana</Texto>
            </View>
            <Texto papel="desc">
              Meta {PLANO.dias.length} · {frequencia.total} treinos em {frequencia.semanas}{' '}
              {frequencia.semanas === 1 ? 'semana' : 'semanas'}
            </Texto>
            <Texto papel="desc">
              Esta semana {nestaSemana} de {PLANO.dias.length}
              {serieMedia > 0 ? ` · série média ${serieMedia} s` : ''}
            </Texto>
          </View>

          <View style={estilos.secao}>
            <Texto papel="eyebrow">Séries por grupo, últimos 7 dias</Texto>
            {volume.map((v) => (
              <BarraDeVolume
                key={v.grupo}
                rotulo={NOME_DO_GRUPO[v.grupo]}
                series={v.series}
                estado={v.estado}
                escala={escala}
                piso={FAIXA_DE_VOLUME.min}
              />
            ))}
            <Texto papel="desc" cor={neutral.n400}>
              Faixa de referência: {FAIXA_DE_VOLUME.min} a {FAIXA_DE_VOLUME.max} séries por grupo.
            </Texto>
          </View>

          {pior && (
            <Card>
              <Texto papel="eyebrow">Uma coisa pra arrumar</Texto>
              <Texto papel="corpo" cor={neutral.n200}>
                {NOME_DO_GRUPO[pior.grupo]} está abaixo da faixa: {pior.series} de {FAIXA_DE_VOLUME.min}{' '}
                séries nos últimos 7 dias.
                {ondeArrumar ? ` É o treino ${ondeArrumar.id} que trabalha ${NOME_DO_GRUPO[pior.grupo].toLowerCase()}.` : ''}
              </Texto>
            </Card>
          )}

          {recordes.length > 0 && (
            <View>
              <View style={estilos.divisor} />
              <Texto papel="eyebrow" style={estilos.tituloRecordes}>Recordes recentes</Texto>
              {recordes.map((r, i) => (
                <LinhaDeAjuste
                  key={r.exercicioId}
                  rotulo={nomeCurtoDe(EXERCICIOS_POR_ID.get(r.exercicioId), r.exercicioId)}
                  // Ouro só para o recorde que acabou de cair (`CAR-5`): o resto é histórico.
                  valor={r.novo ? `${formatarKg(r.kg)} kg` : `${formatarKg(r.kg)} kg · ${dataRelativa(r.fimMs, agora)}`}
                  corDoValor={r.novo ? accent.signal : undefined}
                  ultima={i === recordes.length - 1}
                  onPress={() => router.push(`/exercicio/${r.exercicioId}`)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </TelaDeAba>
  );
}

const estilos = StyleSheet.create({
  chips: { flexDirection: 'row', gap: space.s2, marginTop: -space.s2 },
  chip: {
    minHeight: hit.min,
    paddingHorizontal: space.s4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: surface.line2,
    justifyContent: 'center',
  },
  chipAtivo: { backgroundColor: neutral.n100, borderColor: neutral.n100 },
  resumo: { gap: space.s1 },
  numero: { flexDirection: 'row', alignItems: 'baseline', gap: space.s3, marginBottom: space.s2 },
  secao: { gap: space.s4 },
  divisor: { height: 1, backgroundColor: surface.line, marginBottom: space.s4 },
  tituloRecordes: { marginBottom: space.s1 },
});
