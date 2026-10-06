import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Fundo } from '@/components/fundo';
import { Surgir } from '@/components/surgir';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { nomeCurtoDe } from '@/data/exercicios';
import { duracaoDaSerieAnterior } from '@/domain/sessao';
import { useCronometro } from '@/hooks/use-cronometro';
import { useGuardaDaSessao } from '@/hooks/use-guarda-da-sessao';
import { useSessao } from '@/estado/sessao';
import { useTreinoComTroca } from '@/hooks/use-treino-com-troca';
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
  // CAR-9.1: exercício trocado mostra o alvo da variação, não a carga do aparelho original.
  const treino = useTreinoComTroca();
  const segundos = useCronometro(sessao?.inicioSerieMs ?? null);
  const pode = useGuardaDaSessao();

  if (!pode || !sessao || !treino?.item || !treino.alvo) return <Fundo aquecido />;
  const { item, exercicio, alvo } = treino;

  // CAR-11.2: a duração da série anterior é a única informação em tempo real que
  // ajuda — serve de referência de ritmo. É a anterior DESTA sessão; o histórico
  // só entra na primeira série, quando ainda não há nenhuma.
  const anterior = duracaoDaSerieAnterior(sessao.registradas, treino.ultimaVez);

  // `replace`: a execução sai da pilha e o descanso fica no lugar dela, logo acima
  // do Treino ativo. Pilha estável: Hoje → Ativo → (Execução | Descanso).
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
        <Surgir ordem={0} style={estilos.topo}>
          <Texto papel="eyebrow">
            Série {sessao.indiceSerie + 1} de {item.series}
          </Texto>
          <Texto papel="h1" numberOfLines={1}>{nomeCurtoDe(exercicio, item.exercicioId)}</Texto>
          <View style={estilos.alvo}>
            <Texto papel="h2">
              {exercicio?.unidade === 'corporal'
                ? alvo.cargaKg > 0 ? `peso do corpo + ${formatarKg(alvo.cargaKg)} kg` : 'peso do corpo'
                : `${formatarKg(alvo.cargaKg)} kg`}
            </Texto>
            <Texto papel="desc" cor={neutral.n400}> · {item.faixa.min}–{item.faixa.max} reps</Texto>
          </View>
          {anterior != null && (
            <Texto papel="desc" cor={neutral.n400}>Série anterior: {anterior} s</Texto>
          )}
        </Surgir>

        <View style={estilos.meio} />

        <Surgir ordem={1} style={estilos.rodape}>
          <View style={estilos.contagem}>
            <Texto papel="colossal">{segundos}</Texto>
            <Texto papel="hero" cor={neutral.n400}> s</Texto>
          </View>
          <Texto papel="desc" cor={neutral.n400}>Toque em qualquer lugar para encerrar</Texto>
        </Surgir>
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
