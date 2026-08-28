import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario } from '@/components/botao-primario';
import { Marca } from '@/components/marca';
import { Texto } from '@/components/texto';
import { EXERCICIOS_POR_ID } from '@/data/exercicios';
import { proximoAlvo, type SerieRegistrada } from '@/domain';
import { formatarKg } from '@/lib/formato';
import { hit, neutral, radius, role, space, surface } from '@/theme/tokens';

/**
 * Tela 10 · Hoje — a porta de entrada do caminho crítico (10 → 11 → 12 → 13 → 14).
 *
 * Número dominante: A LETRA DO TREINO. A única decisão da tela é uma: começo ou não.
 *
 * Os alvos abaixo saem da `CAR-1` de verdade, rodando sobre um histórico de exemplo —
 * é a `CAR-2` (nunca campo vazio) visível: o app já chega com o número preenchido.
 * Os dados mockados entram no CP5; aqui eles servem de prova de que a regra roda.
 */

const TREINO_DE_HOJE = {
  letra: 'A',
  nome: 'Peito e tríceps',
  itens: [
    { exercicioId: 'supino-reto-barra', series: 4, faixa: { min: 8, max: 12 }, cargaKg: 60 },
    { exercicioId: 'supino-inclinado-halter', series: 3, faixa: { min: 8, max: 12 }, cargaKg: 22 },
    { exercicioId: 'paralelas', series: 3, faixa: { min: 6, max: 10 }, cargaKg: 0 },
    { exercicioId: 'triceps-corda', series: 3, faixa: { min: 10, max: 15 }, cargaKg: 25 },
  ],
};

/** Histórico de exemplo: no supino ele FECHOU a faixa (12 em todas) — a carga sobe sozinha. */
const ULTIMA_SESSAO: Record<string, SerieRegistrada[]> = {
  'supino-reto-barra': [0, 1, 2, 3].map((i) => ({ exercicioId: 'supino-reto-barra', indice: i, reps: 12, cargaKg: 60, foiAlvo: true })),
  'supino-inclinado-halter': [0, 1, 2].map((i) => ({ exercicioId: 'supino-inclinado-halter', indice: i, reps: 9, cargaKg: 22, foiAlvo: true })),
};

export default function Hoje() {
  return (
    <SafeAreaView style={estilos.tela}>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <Marca largura={44} />

        <View style={estilos.cabecalho}>
          <Texto papel="eyebrow">Hoje · treino do dia</Texto>
          <View style={estilos.letra}>
            <Texto papel="mega">{TREINO_DE_HOJE.letra}</Texto>
            <Texto papel="h2" cor={neutral.n300}>{TREINO_DE_HOJE.nome}</Texto>
          </View>
        </View>

        <View style={estilos.lista}>
          {TREINO_DE_HOJE.itens.map((item) => {
            const exercicio = EXERCICIOS_POR_ID.get(item.exercicioId);
            const alvos = proximoAlvo({
              ultimaSessao: ULTIMA_SESSAO[item.exercicioId] ?? [],
              faixa: item.faixa,
              cargaAtualKg: item.cargaKg,
              incrementoKg: exercicio?.incrementoKg ?? 2.5,
              series: item.series,
            });
            const alvo = alvos[0];
            const subiu = alvo.origem === 'progressao';

            return (
              <View key={item.exercicioId} style={estilos.linha}>
                <View style={estilos.linhaTexto}>
                  <Texto papel="corpo" numberOfLines={1}>{exercicio?.nome ?? item.exercicioId}</Texto>
                  <Texto papel="desc">
                    {item.series} séries · {item.faixa.min}–{item.faixa.max} reps
                  </Texto>
                </View>
                <View style={estilos.alvo}>
                  <Texto papel="h2" cor={subiu ? role.record : role.target}>
                    {exercicio?.unidade === 'corporal' ? '—' : `${formatarKg(alvo.cargaKg)} kg`}
                  </Texto>
                  <Texto papel="desc" cor={subiu ? role.record : neutral.n400}>
                    {subiu ? 'subiu' : `alvo ${alvo.reps}`}
                  </Texto>
                </View>
              </View>
            );
          })}
        </View>

        <BotaoPrimario onPress={() => {}}>Começar treino</BotaoPrimario>
        <Texto papel="desc" style={estilos.rodape}>
          CP4 · idealização. As telas de execução chegam no CP5.
        </Texto>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  // O fundo tem dois gradientes radiais no Figma (grafite frio + brasa quente).
  // Em RN isso pede expo-linear-gradient; entra junto com as telas do CP5.
  tela: { flex: 1, backgroundColor: surface.base },
  conteudo: { padding: space.s5, gap: space.s6, paddingBottom: space.s7 },
  cabecalho: { gap: space.s3 },
  letra: { gap: space.s1 },
  lista: { gap: space.s2 },
  linha: {
    minHeight: hit.row,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.s4,
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
    backgroundColor: surface.raised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surface.line,
  },
  linhaTexto: { flex: 1, gap: 2 },
  alvo: { alignItems: 'flex-end' },
  rodape: { textAlign: 'center' },
});
