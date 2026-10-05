import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BotaoPrimario } from '@/components/botao-primario';
import { Card } from '@/components/card';
import { Fundo } from '@/components/fundo';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { EXERCICIOS_POR_ID, nomeCurtoDe } from '@/data/exercicios';
import { TREINOS } from '@/data/treinos';
import { melhor1RM, tonelagem } from '@/domain';
import { proximoTreino } from '@/domain/historico';
import { comparacaoDoResumo, exerciciosComCargaMaior } from '@/domain/resumo';
import { fecharSessao } from '@/domain/sessao';
import { useSessao, useTreinoEmAndamento } from '@/estado/sessao';
import { useGuardaDaSessao } from '@/hooks/use-guarda-da-sessao';
import { formatarKg, formatarMilhar, formatarTempo } from '@/lib/formato';
import { accent, neutral, space, surface } from '@/theme/tokens';

/**
 * Tela 14 · Resumo — `CAR-7`. Fecha o ciclo com um número que subiu.
 * Número dominante: A TONELAGEM, comparada com a MESMA LETRA da vez anterior
 * (comparar A com B não significaria nada, então não se compara).
 */
export default function Resumo() {
  const { sessao, abandonar } = useSessao();
  const treino = useTreinoEmAndamento();
  const pode = useGuardaDaSessao('resumo');
  if (!pode || !sessao || !treino) return <Fundo />;

  const total = treino.tonelagem;
  // CAR-7 sem punir a progressão: a decisão e a conta estão em `src/domain/resumo.ts`.
  const comparacao = comparacaoDoResumo({
    tonelagem: total,
    tonelagemAnterior: treino.tonelagemAnterior,
    cargasQueSubiram: exerciciosComCargaMaior(sessao.registradas, treino.anteriores),
    letra: treino.treino.id,
  });
  const minutos = Math.max(1, Math.round(((sessao.fimMs ?? sessao.inicioMs) - sessao.inicioMs) / 60000));
  const series = sessao.registradas.length;
  const reps = sessao.registradas.reduce((s, r) => s + r.reps, 0);
  const tensao = sessao.registradas.reduce((s, r) => s + (r.duracaoSegundos ?? 0), 0);

  // Tonelagem por exercício, do maior para o menor.
  const porExercicio = [...new Set(sessao.registradas.map((r) => r.exercicioId))]
    .map((id) => ({
      id,
      nome: nomeCurtoDe(EXERCICIOS_POR_ID.get(id), id),
      kg: tonelagem(sessao.registradas.filter((r) => r.exercicioId === id)),
    }))
    .sort((a, b) => b.kg - a.kg);

  // CAR-5: o único momento do app que tem cor.
  const recordes = porExercicio
    .map(({ id, nome }) => {
      const novo = melhor1RM(sessao.registradas.filter((r) => r.exercicioId === id));
      const antigo = treino.recordeAnterior(id);
      // Primeira vez no exercício (ex.: a variação que entrou pela troca, CAR-9) não é recorde
      // batido: não havia o que bater, e o ouro diria "antes 0 kg".
      return { nome, novo, antigo, bateu: antigo > 0 && novo > antigo };
    })
    .filter((r) => r.bateu)
    .sort((a, b) => b.novo - a.novo);
  const recorde = recordes[0];

  // A próxima letra conta ESTA sessão mesmo que o efeito que a grava no histórico ainda
  // não tenha rodado — senão o rodapé diria "Próximo: A" logo depois de um A.
  const fechada = fecharSessao(sessao);
  const proximo = proximoTreino(fechada ? [...treino.anteriores, fechada] : treino.anteriores, TREINOS);

  // `dismissTo` volta ao Hoje que já está na base da pilha (o `replace` criava um segundo).
  // Navega ANTES de zerar a sessão: a guarda desta tela não pode reagir ao `null`.
  const fechar = () => { router.dismissTo('/hoje'); abandonar(); };

  return (
    <Tela>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <View>
          <Texto papel="eyebrow">Treino {treino.treino.id} concluído</Texto>
          <View style={estilos.numero}>
            <Texto papel="mega">{formatarMilhar(total)}</Texto>
            <Texto papel="h2" cor={neutral.n200}> kg</Texto>
          </View>
          <Texto papel="corpo" cor={neutral.n300}>{comparacao.destaque}</Texto>
          {comparacao.detalhe && (
            <Texto papel="desc" cor={neutral.n400}>{comparacao.detalhe}</Texto>
          )}
        </View>

        <View style={estilos.estatisticas}>
          {/* Singular no 1: o piso de `minutos` é 1, e "1 MINUTOS" saía em caixa alta. */}
          <Estatistica valor={String(minutos)} rotulo={minutos === 1 ? 'minuto' : 'minutos'} />
          <Estatistica valor={String(series)} rotulo={series === 1 ? 'série' : 'séries'} />
          <Estatistica valor={String(reps)} rotulo={reps === 1 ? 'rep' : 'reps'} />
          <Estatistica valor={formatarTempo(tensao)} rotulo="tensão" />
        </View>

        {recorde && (
          <Card ouro>
            <Texto papel="eyebrow" cor={accent.signal}>Recorde</Texto>
            <Texto papel="h2" cor={accent.signal}>Recorde no {recorde.nome.toLowerCase()}</Texto>
            <Texto papel="desc" cor={neutral.n300}>
              1RM estimado {formatarKg(recorde.novo)} kg · antes {formatarKg(recorde.antigo)} kg
            </Texto>
          </Card>
        )}

        <View style={estilos.lista}>
          {porExercicio.map((e) => (
            <View key={e.id} style={estilos.linha}>
              <Texto papel="corpo" numberOfLines={1} style={estilos.linhaNome}>{e.nome}</Texto>
              <Texto papel="corpo" cor={neutral.n400}>{formatarMilhar(e.kg)} kg</Texto>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={estilos.rodape}>
        <Texto papel="desc" cor={neutral.n400} style={estilos.proximo}>
          Próximo: Treino {proximo.id} · {proximo.nome}
        </Texto>
        <BotaoPrimario onPress={fechar}>Fechar</BotaoPrimario>
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

const estilos = StyleSheet.create({
  conteudo: { paddingTop: space.s4, paddingBottom: space.s4, gap: space.s5 },
  numero: { flexDirection: 'row', alignItems: 'baseline' },
  estatisticas: { flexDirection: 'row', gap: space.s4 },
  estatistica: { flex: 1, gap: 2 },
  lista: { gap: space.s3, borderTopWidth: 1, borderTopColor: surface.line, paddingTop: space.s4 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s4 },
  linhaNome: { flex: 1 },
  rodape: { paddingBottom: space.s5, gap: space.s3 },
  proximo: { textAlign: 'center' },
});
