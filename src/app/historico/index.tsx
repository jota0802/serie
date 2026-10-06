import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { BotaoPrimario } from '@/components/botao-primario';
import { agruparPorMes, mesPorExtenso, nomeDoTreino, plural, recordesPorSessao } from '@/components/formato-do-historico';
import { LinhaDoHistorico } from '@/components/linha-do-historico';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Voltar } from '@/components/voltar';
import { useHistorico } from '@/estado/historico';
import { usePlano } from '@/estado/perfil';
import { neutral, space, surface } from '@/theme/tokens';

/**
 * Histórico — todos os treinos concluídos, do mais novo ao mais antigo, agrupados por mês.
 * Número dominante: QUANTOS TREINOS.
 *
 * Cada linha leva ao detalhe (`/historico/<id>`), onde o treino é corrigido ou apagado (RN-40).
 * Nada aqui é guardado à parte (RN-43): volume, duração e o selo de recorde saem das séries de
 * `useHistorico()`, então a correção feita no detalhe já volta diferente para esta lista.
 * Offline-first à vista (RN-03): o que ainda não subiu aparece como "aguardando conexão".
 */
export default function Historico() {
  const { sessoes, carregado, pendentes } = useHistorico();
  const { porId } = usePlano();
  const meses = useMemo(() => agruparPorMes(sessoes), [sessoes]);
  // CAR-5 por treino, em ordem cronológica: a régua do heatmap (RN-52), uma sessão de cada vez.
  const recordes = useMemo(() => recordesPorSessao(sessoes), [sessoes]);

  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/progresso'));

  // Vazio de verdade só depois de o aparelho (ou a nuvem) responder: antes disso `sessoes` é [] e
  // a tela diria "nenhum treino" para quem tem trinta.
  if (carregado && sessoes.length === 0) {
    return (
      <Tela>
        <Voltar onPress={voltar} rotulo="Voltar" />
        <View style={estilos.vazio}>
          <View style={estilos.cabecalho}>
            <Texto papel="h1" accessibilityRole="header">Histórico</Texto>
            <Texto papel="h2" style={estilos.vazioTitulo}>Nenhum treino concluído ainda</Texto>
            <Texto papel="desc">
              Cada treino que você terminar aparece aqui, com as séries, o volume e o tempo. Errou um
              número no descanso? Dá para corrigir depois.
            </Texto>
          </View>
          <BotaoPrimario onPress={() => router.dismissTo('/hoje')} style={estilos.cta}>Ver o treino de hoje</BotaoPrimario>
        </View>
      </Tela>
    );
  }

  const ultimoMes = meses[meses.length - 1];
  const primeiro = ultimoMes?.data[ultimoMes.data.length - 1];

  return (
    <Tela>
      <Voltar onPress={voltar} rotulo="Voltar" />
      <SectionList
        sections={carregado ? meses : []}
        keyExtractor={(sessao) => sessao.id}
        // Cabeçalho grudado precisaria de fundo sólido — e cobriria o gradiente do canvas.
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.conteudo}
        ListHeaderComponent={
          <View style={estilos.cabecalho}>
            <Texto papel="h1" accessibilityRole="header">Histórico</Texto>
            {primeiro && (
              <>
                <View style={estilos.numero}>
                  <Texto papel="hero">{sessoes.length}</Texto>
                  <Texto papel="h2" cor={neutral.n300}>{sessoes.length === 1 ? 'treino' : 'treinos'}</Texto>
                </View>
                <Texto papel="desc">desde {mesPorExtenso(primeiro.fimMs).toLowerCase()}</Texto>
                {/* RN-03: o treino do subsolo não se perdeu — está no aparelho, esperando a rede. */}
                {pendentes > 0 && (
                  <Texto papel="desc" cor={neutral.n200}>
                    {plural(pendentes, 'treino aguardando', 'treinos aguardando')} conexão.{' '}
                    {pendentes === 1 ? 'Já está salvo no aparelho.' : 'Já estão salvos no aparelho.'}
                  </Texto>
                )}
                <Texto papel="desc">Toque num treino para ver as séries, corrigir ou apagar.</Texto>
              </>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={estilos.mes}>
            <Texto papel="eyebrow" accessibilityRole="header">{section.titulo}</Texto>
            <Texto papel="eyebrow">{plural(section.data.length, 'treino', 'treinos')}</Texto>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <LinhaDoHistorico
            sessao={item}
            nome={nomeDoTreino(item.treinoId, porId)}
            recorde={recordes.has(item.id)}
            ultima={index === section.data.length - 1}
            // Rota nova: os tipos do expo-router só a conhecem depois de regerados.
            onPress={() => router.push(`/historico/${item.id}` as Href)}
          />
        )}
      />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  conteudo: { paddingBottom: space.s6 },
  cabecalho: { gap: space.s1 },
  numero: { flexDirection: 'row', alignItems: 'baseline', gap: space.s3, marginTop: space.s4 },
  mes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.s3,
    marginTop: space.s6,
    paddingBottom: space.s2,
    borderBottomWidth: 1,
    borderBottomColor: surface.line,
  },
  vazio: { flex: 1, justifyContent: 'space-between' },
  vazioTitulo: { marginTop: space.s5 },
  cta: { marginBottom: space.s5 },
});
