import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { nomeCurtoDe } from '@/data/exercicios';
import { ULTIMA_SESSAO } from '@/data/historico';
import { useSessao, useTreinoEmAndamento } from '@/estado/sessao';
import { useCronometro } from '@/hooks/use-cronometro';
import { formatarKg } from '@/lib/formato';
import { neutral, space } from '@/theme/tokens';

/**
 * Tela 12 · Execução — `CAR-11`. A tela inteira é o alvo de toque.
 * Número dominante: O TEMPO CORRENDO.
 *
 * Mostra o exercício, qual série, o alvo e o tempo — e mais nada. Não é minimalismo
 * por estética:
 *
 * > Durante a série você não consegue tocar no celular. Qualquer campo aqui é campo
 * > que ninguém preenche.
 *
 * Por isso o registro migrou para o descanso, que são 90 s de mãos livres.
 *
 * O fundo usa a variante AQUECIDA: a brasa intensifica embaixo, então a tela esquenta
 * enquanto você levanta — sem inventar cor nova.
 */
export default function Execucao() {
  const { sessao, encerrarSerie } = useSessao();
  const treino = useTreinoEmAndamento();
  const segundos = useCronometro(sessao?.inicioSerieMs ?? null);

  if (!sessao || !treino?.item || !treino.alvo) return null;
  const { item, exercicio, alvo } = treino;

  // CAR-11.2: a duração da série anterior é a única informação em tempo real que
  // ajuda — serve de referência de ritmo.
  const anterior =
    sessao.duracaoUltimaSerieS ??
    (ULTIMA_SESSAO[item.exercicioId] ?? [])[0]?.duracaoSegundos;

  const encerrar = () => {
    encerrarSerie();
    router.replace('/treino/descanso');
  };

  return (
    <Pressable
      onPress={encerrar}
      accessibilityRole="button"
      accessibilityLabel="Encerrar série"
      style={estilos.toque}
    >
      <Tela aquecido>
        <View style={estilos.topo}>
          <Texto papel="eyebrow">
            Série {sessao.indiceSerie + 1} de {item.series}
          </Texto>
          <Texto papel="h1" numberOfLines={1}>{nomeCurtoDe(exercicio, item.exercicioId)}</Texto>
          <View style={estilos.alvo}>
            <Texto papel="h2">
              {exercicio?.unidade === 'corporal' ? 'peso do corpo' : `${formatarKg(alvo.cargaKg)} kg`}
            </Texto>
            <Texto papel="desc" cor={neutral.n400}> · {item.faixa.min}–{item.faixa.max} reps</Texto>
          </View>
          {anterior != null && (
            <Texto papel="desc" cor={neutral.n400}>Série anterior: {anterior} s</Texto>
          )}
        </View>

        <View style={estilos.meio} />

        <View style={estilos.rodape}>
          <View style={estilos.contagem}>
            <Texto papel="colossal">{segundos}</Texto>
            <Texto papel="hero" cor={neutral.n400}> s</Texto>
          </View>
          <Texto papel="desc" cor={neutral.n400}>Toque em qualquer lugar para encerrar</Texto>
        </View>
      </Tela>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  toque: { flex: 1 },
  topo: { paddingTop: space.s4, gap: space.s1 },
  alvo: { flexDirection: 'row', alignItems: 'baseline' },
  meio: { flex: 1 },
  rodape: { paddingBottom: space.s6, gap: space.s2 },
  contagem: { flexDirection: 'row', alignItems: 'baseline' },
});
