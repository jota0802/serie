import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BotaoPrimario } from '@/components/botao-primario';
import { Card } from '@/components/card';
import { Fundo } from '@/components/fundo';
import { Nav } from '@/components/nav';
import { Texto } from '@/components/texto';
import { EXERCICIOS_POR_ID, nomeCurtoDe } from '@/data/exercicios';
import { ULTIMA_SESSAO } from '@/data/historico';
import { PLANO, TREINOS_POR_ID } from '@/data/treinos';
import { proximoAlvo } from '@/domain';
import { useSessao } from '@/estado/sessao';
import { formatarKg, porExtenso } from '@/lib/formato';
import { neutral, radius, space } from '@/theme/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Tela 10 · Hoje — a porta de entrada do caminho crítico.
 *
 * Número dominante: A LETRA DO TREINO. A única decisão da tela é uma: começo ou não.
 *
 * ⚠️ Nada aqui é número cravado. "Supino reto sobe para 42,5 kg" sai da `CAR-1`
 * cruzando o plano (40 kg) com o histórico (12 reps nas quatro séries).
 *
 * Substitui a versão provisória desta tela, que trazia `TREINO_DE_HOJE` e `ULTIMA_SESSAO`
 * cravados no próprio arquivo "como prova de que a regra roda" — os mocks agora moram em
 * `src/data/`, e daqui sai o fluxo do treino (`/treino/ativo`).
 */
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export default function Hoje() {
  const { comecar } = useSessao();
  const treino = TREINOS_POR_ID.get(PLANO.treinoDeHoje)!;
  const hoje = new Date();

  // O alvo de cada exercício, pela regra. O primeiro que subiu vira o destaque da tela.
  const linhas = treino.itens.map((item) => {
    const exercicio = EXERCICIOS_POR_ID.get(item.exercicioId);
    const alvo = proximoAlvo({
      ultimaSessao: ULTIMA_SESSAO[item.exercicioId] ?? [],
      faixa: item.faixa,
      cargaAtualKg: item.cargaKg,
      incrementoKg: exercicio?.incrementoKg ?? 2.5,
      series: item.series,
    })[0];
    return { item, exercicio, alvo };
  });

  const subiu = linhas.find((l) => l.alvo.origem === 'progressao');
  const anterior = subiu ? (ULTIMA_SESSAO[subiu.item.exercicioId] ?? []) : [];

  const comecarTreino = () => {
    comecar(treino.id);
    router.push('/treino/ativo');
  };

  return (
    <View style={estilos.raiz}>
      <Fundo />
      <SafeAreaView style={estilos.seguro}>
        <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
          <View style={estilos.cabecalho}>
            <Texto papel="eyebrow">
              {DIAS[hoje.getDay()]}, {hoje.getDate()} de {MESES[hoje.getMonth()]}
            </Texto>
            <View style={estilos.contador}>
              {Array.from({ length: PLANO.totalNaSemana }, (_, i) => (
                <View key={i} style={[estilos.ponto, i < PLANO.sessaoDaSemana && estilos.pontoCheio]} />
              ))}
              <Texto papel="desc" cor={neutral.n400}>
                {PLANO.sessaoDaSemana} de {PLANO.totalNaSemana}
              </Texto>
            </View>
          </View>

          <View style={estilos.titulo}>
            <Texto papel="mega">{treino.id}</Texto>
            <View style={estilos.tituloTexto}>
              <Texto papel="h2">{treino.nome}</Texto>
              <Texto papel="desc">
                {treino.itens.length} exercícios · ~{Math.round(treino.itens.length * 11)} min
              </Texto>
            </View>
          </View>

          {subiu && (
            <Card>
              <Texto papel="eyebrow">O que o app já sabe</Texto>
              <Texto papel="h2">
                {nomeCurtoDe(subiu.exercicio, subiu.item.exercicioId)} sobe para{' '}
                {formatarKg(subiu.alvo.cargaKg)} kg
              </Texto>
              <Texto papel="desc">
                Você fechou {anterior[0]?.reps} repetições nas {porExtenso(anterior.length)} séries da
                última vez.
              </Texto>
            </Card>
          )}

          <View style={estilos.lista}>
            <Texto papel="eyebrow">Hoje você faz</Texto>
            {linhas.map(({ item, exercicio, alvo }) => (
              <View key={item.exercicioId} style={estilos.linha}>
                <Texto papel="corpo" numberOfLines={1} style={estilos.linhaNome}>
                  {nomeCurtoDe(exercicio, item.exercicioId)}
                </Texto>
                <Texto papel="desc" cor={neutral.n400}>
                  {item.series} × {item.faixa.min}–{item.faixa.max}
                  {exercicio?.unidade === 'corporal' ? '' : ` · ${formatarKg(alvo.cargaKg)} kg`}
                </Texto>
              </View>
            ))}
          </View>

        </ScrollView>
        <View style={estilos.rodape}>
          <BotaoPrimario onPress={comecarTreino}>Começar treino</BotaoPrimario>
        </View>
        <Nav ativa="hoje" />
      </SafeAreaView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  seguro: { flex: 1 },
  conteudo: { paddingHorizontal: space.s5, paddingTop: space.s4, paddingBottom: space.s5, gap: space.s5 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  contador: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  ponto: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: neutral.n700 },
  pontoCheio: { backgroundColor: neutral.n100 },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: space.s4 },
  tituloTexto: { flex: 1, gap: 2 },
  lista: { gap: space.s3 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s4 },
  linhaNome: { flex: 1 },
  rodape: { paddingHorizontal: space.s5, paddingBottom: space.s4 },
});
