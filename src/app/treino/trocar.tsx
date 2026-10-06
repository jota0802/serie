import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinhaDeAlternativa } from '@/components/linha-de-alternativa';
import { Texto } from '@/components/texto';
import { EXERCICIOS, EXERCICIOS_POR_ID, NOME_DO_PADRAO, nomeCurtoDe } from '@/data/exercicios';
import type { Exercicio, SerieRegistrada } from '@/domain';
import { ultimasSeriesDe } from '@/domain/historico';
import { alternativasNaSessao, type AlvosDaTroca } from '@/domain/troca';
import { useHistorico } from '@/estado/historico';
import { usePlano } from '@/estado/perfil';
import { useSessao, useTreinoEmAndamento } from '@/estado/sessao';
import { alvosSeTrocar, anterioresA, ocupadosNaSessao } from '@/hooks/use-treino-com-troca';
import { formatarKg } from '@/lib/formato';
import { glass, hit, motion, neutral, radius, space, surface } from '@/theme/tokens';

type Motivo = 'ocupado' | 'dor' | 'variar';
const MOTIVOS: { chave: Motivo; rotulo: string }[] = [
  { chave: 'ocupado', rotulo: 'Ocupado' },
  { chave: 'dor', rotulo: 'Senti dor' },
  { chave: 'variar', rotulo: 'Quero variar' },
];

/**
 * Tela 16 · Trocar exercício — `CAR-9`. A folha modal sobe por cima do treino ativo
 * (o vidro ESPESSO do app) com as variações do mesmo padrão e mesmo grupo que NÃO estão
 * em outro item do treino de hoje (`alternativasNaSessao`), e o do plano de volta se já
 * foi trocado. Tocar numa troca o exercício SÓ nesta sessão e volta para a 11.
 */
export default function TrocarExercicio() {
  const { treinos } = usePlano();
  const { sessao, trocarExercicio } = useSessao();
  const treino = useTreinoEmAndamento();
  const { sessoes } = useHistorico();
  const margem = useSafeAreaInsets();
  const [motivo, setMotivo] = useState<Motivo>('ocupado');

  // Sem sessão (recarregou a página na 16) não há o que trocar: volta para o Hoje.
  // Efeito, não render — navegar durante o render é o aviso do React que a 11 já documenta.
  const semSessao = !sessao || !treino?.item;
  useEffect(() => {
    if (semSessao) router.replace('/hoje');
  }, [semSessao]);

  const linhas = useMemo(() => {
    if (!sessao || !treino?.item) return [];
    const original = treino.treino.itens[sessao.indiceExercicio];
    const exOriginal = original && EXERCICIOS_POR_ID.get(original.exercicioId);
    if (!original || !exOriginal) return [];
    const anteriores = anterioresA(sessoes, sessao);
    const opcoes = alternativasNaSessao({
      original: exOriginal,
      atualId: treino.item.exercicioId,
      ocupados: ocupadosNaSessao(treino.treino, sessao),
      catalogo: EXERCICIOS,
    });
    return opcoes.map((alt) => ({
      alt,
      detalhe: detalheDe(
        alt,
        alt.id === exOriginal.id,
        ultimasSeriesDe(anteriores, alt.id),
        alvosSeTrocar(original, alt.id, anteriores, sessao.registradas, treinos),
      ),
    }));
  }, [sessao, treino, sessoes, treinos]);

  if (semSessao || !treino.item) return null;
  const { exercicio, feitasDoExercicio, item } = treino;
  const nome = nomeCurtoDe(exercicio, item.exercicioId);
  // ⚠️ Série já registrada trava a troca: duas cargas de aparelhos diferentes no mesmo
  // item quebrariam a CAR-1 (a "última vez" misturaria barra e halter).
  const travada = feitasDoExercicio.length > 0;

  const escolher = (id: string) => {
    trocarExercicio(id);
    // Sempre para a 11, nunca `back`: aberta pela 15, o `back` caía na 15 do exercício ANTIGO.
    // `dismissTo` desempilha a 16 e a 15 juntas (e vira `replace` se a 11 não estiver na pilha).
    router.dismissTo('/treino/ativo');
  };

  return (
    <View style={estilos.raiz}>
      <Stack.Screen
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          animationDuration: motion.sheet,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Pressable style={estilos.scrim} onPress={() => router.back()} accessibilityLabel="Fechar" />

      <View style={[estilos.folha, { paddingBottom: margem.bottom + space.s4 }]}>
        <View style={estilos.alca} />
        <Texto papel="h2">Trocar {nome.toLowerCase()}</Texto>

        {travada ? (
          <View style={estilos.travada}>
            <Texto papel="corpo" cor={neutral.n200}>
              Você já registrou {feitasDoExercicio.length} {feitasDoExercicio.length === 1 ? 'série' : 'séries'} de {nome.toLowerCase()} hoje.
            </Texto>
            <Texto papel="desc">
              Trocar agora misturaria dois aparelhos no mesmo exercício e a próxima sugestão sairia errada.
              Termine este e troque o próximo.
            </Texto>
          </View>
        ) : (
          <>
            <Texto papel="desc" style={estilos.porque}>Por quê?</Texto>
            <View style={estilos.motivos}>
              {MOTIVOS.map(({ chave, rotulo }) => {
                const ativo = chave === motivo;
                return (
                  <Pressable
                    key={chave}
                    onPress={() => setMotivo(chave)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: ativo }}
                    style={[estilos.motivo, ativo && estilos.motivoAtivo]}
                  >
                    <Texto papel="desc" cor={ativo ? neutral.n1000 : neutral.n200}>{rotulo}</Texto>
                  </Pressable>
                );
              })}
            </View>

            <View style={estilos.divisor} />

            <ScrollView style={estilos.lista} showsVerticalScrollIndicator={false}>
              {linhas.length === 0 ? (
                <Texto papel="desc" style={estilos.vazio}>
                  Nenhuma variação do mesmo padrão e grupo fora do treino de hoje. Espere o aparelho ou siga para o próximo.
                </Texto>
              ) : (
                linhas.map(({ alt, detalhe }, i) => (
                  <LinhaDeAlternativa
                    key={alt.id}
                    nome={alt.nome}
                    detalhe={detalhe}
                    ultima={i === linhas.length - 1}
                    onPress={() => escolher(alt.id)}
                  />
                ))
              )}
            </ScrollView>

            <Texto papel="desc" cor={neutral.n400} style={estilos.nota}>
              {motivo === 'dor'
                ? 'Dor não se atravessa. A variação começa no piso da faixa; se doer de novo, pule o exercício.'
                : `A progressão segue o padrão de movimento, não o aparelho. Trocar não zera seu histórico de ${exercicio ? NOME_DO_PADRAO[exercicio.padrao] : 'movimento'}.`}
            </Texto>
          </>
        )}
      </View>
    </View>
  );
}

/**
 * O subtítulo de cada variação. Já fez → a última carga real; nunca fez → a sugestão
 * da CAR-9.1, que é palpite e se apresenta como tal. Sem base para estimar, o app pede
 * a carga em vez de sugerir "0 kg" — a 11 diz o mesmo.
 */
function detalheDe(alt: Exercicio, doPlano: boolean, ultima: SerieRegistrada[], troca: AlvosDaTroca | null): string {
  const porque = doPlano ? 'Do plano' : 'Mesmo padrão';
  if (alt.unidade === 'corporal') {
    return ultima.length > 0
      ? `${porque} · última vez: ${ultima.map((s) => s.reps).join(' · ')} reps`
      : `${porque} · sem equipamento`;
  }
  const cada = alt.equipamento === 'halteres' && alt.unilateral ? ' cada' : '';
  if (ultima.length > 0) {
    const maior = Math.max(...ultima.map((s) => s.cargaKg));
    return `${porque} · última vez: ${formatarKg(maior)} kg${cada}`;
  }
  const sugestaoKg = troca?.alvos[0]?.cargaKg ?? 0;
  return troca && !troca.semReferencia && sugestaoKg > 0
    ? `${porque} · sugestão: ${formatarKg(sugestaoKg)} kg${cada}`
    : `${porque} · primeira vez, escolha a carga`;
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: surface.scrim },
  folha: {
    maxHeight: '85%',
    backgroundColor: glass.thick,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: glass.line,
    paddingHorizontal: space.s5,
    paddingTop: space.s3,
  },
  alca: {
    alignSelf: 'center', width: 36, height: 4, borderRadius: radius.full,
    backgroundColor: neutral.n600, marginBottom: space.s4,
  },
  porque: { marginTop: space.s1 },
  motivos: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2, marginTop: space.s3 },
  motivo: {
    minHeight: hit.min - space.s1, paddingHorizontal: space.s4, borderRadius: radius.full,
    borderWidth: 1, borderColor: surface.line2, alignItems: 'center', justifyContent: 'center',
  },
  motivoAtivo: { backgroundColor: neutral.n100, borderColor: neutral.n100 },
  divisor: { height: 1, backgroundColor: surface.line, marginTop: space.s4 },
  lista: { flexGrow: 0 },
  vazio: { paddingVertical: space.s5 },
  nota: { marginTop: space.s4 },
  travada: { gap: space.s2, marginTop: space.s3, marginBottom: space.s2 },
});
