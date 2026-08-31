import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Anel } from '@/components/anel';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { useSessao, useTreinoEmAndamento } from '@/estado/sessao';
import { useContagemRegressiva } from '@/hooks/use-cronometro';
import { formatarKg, formatarTempo } from '@/lib/formato';
import { hit, neutral, radius, role, space, surface } from '@/theme/tokens';

/**
 * Tela 13 · Descanso — `CAR-6` e `CAR-11`.
 * Número dominante: O CRONÔMETRO. É a única tela desenhada para ser lida a dois metros.
 *
 * E é AQUI que o registro acontece, não na execução: 90 segundos de mãos livres.
 * Os campos já chegam preenchidos com o alvo (`CAR-2`) — você confirma ou corrige.
 */
export default function Descanso() {
  const { sessao, registrar } = useSessao();
  const treino = useTreinoEmAndamento();

  const item = treino?.item;
  const alvo = treino?.alvo;
  const total = treino?.exercicio?.descansoSegundos ?? 90;

  const [reps, setReps] = useState(() => String(alvo?.reps ?? ''));
  const [carga, setCarga] = useState(() => (alvo ? formatarKg(alvo.cargaKg) : ''));

  // O registro pode chegar por dois caminhos (zerou o cronômetro, ou pulou).
  // Sem esta trava, os dois disparam e a série entra duas vezes.
  const jaRegistrou = useRef(false);

  const concluir = useCallback(() => {
    if (jaRegistrou.current || !item) return;
    jaRegistrou.current = true;
    const r = Number.parseInt(reps, 10);
    const c = Number.parseFloat(carga.replace(',', '.'));
    registrar(
      Number.isFinite(r) ? r : (alvo?.reps ?? 0),
      Number.isFinite(c) ? c : (alvo?.cargaKg ?? 0),
    );
    router.replace('/treino/ativo');
  }, [item, reps, carga, alvo, registrar]);

  const { restante, adicionar } = useContagemRegressiva(total, concluir);


  if (!sessao || !treino || !item || !alvo) return null;

  const ultimaDoExercicio = sessao.indiceSerie + 1 >= item.series;

  return (
    <Tela>
      <View style={estilos.centro}>
        <Texto papel="eyebrow">Descanso</Texto>

        <Anel progresso={restante / total}>
          <Texto papel="mega">{formatarTempo(restante)}</Texto>
          <Texto papel="desc" cor={neutral.n400}>de {formatarTempo(total)}</Texto>
        </Anel>

        <View style={estilos.registro}>
          <Texto papel="eyebrow">O que você fez</Texto>
          <View style={estilos.campos}>
            <View style={estilos.numeroDaSerie}>
              <Texto papel="desc" cor={role.done}>{sessao.indiceSerie + 1}</Texto>
            </View>
            <Campo valor={reps} aoMudar={setReps} unidade="reps" />
            <Campo valor={carga} aoMudar={setCarga} unidade="kg" />
          </View>
          <Texto papel="desc" cor={neutral.n400}>
            {ultimaDoExercicio
              ? `A seguir · ${treino.proximoExercicio ? treino.proximoExercicio.nomeCurto ?? treino.proximoExercicio.nome : 'resumo do treino'}`
              : `A seguir · ${sessao.indiceSerie + 2}ª série · ${item.faixa.min}–${item.faixa.max} × ${formatarKg(alvo.cargaKg)} kg`}
          </Texto>
        </View>
      </View>

      <View style={estilos.botoes}>
        <Pressable onPress={() => adicionar(30)} accessibilityRole="button" style={estilos.ghost}>
          <Texto papel="h2" cor={neutral.n300}>+ 30 s</Texto>
        </Pressable>
        <Pressable onPress={concluir} accessibilityRole="button" style={estilos.ghost}>
          <Texto papel="h2" cor={neutral.n150}>Pular descanso</Texto>
        </Pressable>
      </View>
    </Tela>
  );
}

/** O campo que já vem preenchido. `CAR-2`: confirmar é um toque, corrigir é opcional. */
function Campo({ valor, aoMudar, unidade }: { valor: string; aoMudar: (v: string) => void; unidade: string }) {
  return (
    <View style={estilos.campo}>
      <TextInput
        value={valor}
        onChangeText={aoMudar}
        keyboardType="decimal-pad"
        selectTextOnFocus
        style={estilos.entrada}
        accessibilityLabel={unidade}
      />
      <Texto papel="desc" cor={neutral.n400}>{unidade}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s5 },
  registro: { alignItems: 'center', gap: space.s3, alignSelf: 'stretch' },
  campos: {
    flexDirection: 'row', alignItems: 'center', gap: space.s2,
    alignSelf: 'stretch', padding: space.s2,
    borderRadius: radius.lg, borderWidth: 1, borderColor: surface.line,
    // Sem isto o poço tem a mesma cor do canvas e os dois campos desaparecem.
    backgroundColor: surface.raised,
  },
  numeroDaSerie: {
    width: 28, height: 28, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: neutral.n600,
  },
  campo: {
    flex: 1, minHeight: hit.row, borderRadius: radius.md, backgroundColor: neutral.n1000,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  entrada: {
    color: neutral.n100, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 24,
    padding: 0, minWidth: 44, textAlign: 'right',
  },
  botoes: { flexDirection: 'row', gap: space.s3, paddingBottom: space.s5 },
  ghost: {
    flex: 1, minHeight: hit.cta, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', backgroundColor: neutral.n850,
  },
});
