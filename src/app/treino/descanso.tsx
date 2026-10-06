import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Anel } from '@/components/anel';
import { BotaoPrimario } from '@/components/botao-primario';
import { Mais, Menos } from '@/components/icones-de-edicao';
import { Surgir } from '@/components/surgir';
import { Fundo } from '@/components/fundo';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { useSessao } from '@/estado/sessao';
import { useContagemRegressiva } from '@/hooks/use-cronometro';
import { useGuardaDaSessao } from '@/hooks/use-guarda-da-sessao';
import { useTreinoComTroca } from '@/hooks/use-treino-com-troca';
import { formatarKg, formatarTempo } from '@/lib/formato';
import { font, hit, neutral, radius, size, space, surface } from '@/theme/tokens';

/**
 * Tela 13 · Descanso — `CAR-6` e `CAR-11`.
 * Número dominante: O CRONÔMETRO. É a única tela desenhada para ser lida a dois metros.
 *
 * E é AQUI que o registro acontece, não na execução: 90 segundos de mãos livres.
 * Os campos já chegam preenchidos com o alvo (`CAR-2`) — você confirma ou corrige.
 */
export default function Descanso() {
  // ⚠️ A guarda fica FORA do conteúdo: os campos nascem do alvo (`useState` inicial) e a
  // contagem começa na montagem. Montar antes de a sessão voltar do disco (`CAR-8`)
  // criaria campos vazios e um cronômetro que zera sem ter o que registrar.
  const pode = useGuardaDaSessao();
  return pode ? <ConteudoDoDescanso /> : <Fundo />;
}

function ConteudoDoDescanso() {
  const { sessao, registrar } = useSessao();
  // ⚠️ CAR-9.1: o campo nasce do alvo, e confirmar grava. Com o hook comum, a variação
  // trocada herdava a carga do aparelho original e o histórico dela nascia errado.
  const treino = useTreinoComTroca();

  const item = treino?.item;
  const alvo = treino?.alvo;
  // RN-15: o descanso do exercício NO PLANO, quando a pessoa ajustou; senão o padrão da CAR-6.
  const total = treino?.item?.descansoSegundos ?? treino?.exercicio?.descansoSegundos ?? 90;

  const [reps, setReps] = useState(() => String(alvo?.reps ?? ''));
  const [carga, setCarga] = useState(() => (alvo ? formatarKg(alvo.cargaKg) : ''));

  // O registro pode chegar por três caminhos (zerou o cronômetro, pulou, ou o voltar do
  // Android). Sem esta trava, mais de um dispara e a série entra duas vezes.
  const jaRegistrou = useRef(false);

  const concluir = useCallback(() => {
    if (jaRegistrou.current || !item) return;
    jaRegistrou.current = true;
    const r = Number.parseInt(reps, 10);
    const c = Number.parseFloat(carga.replace(',', '.'));
    registrar(
      Number.isFinite(r) ? r : (alvo?.reps ?? 0),
      Number.isFinite(c) ? c : (alvo?.cargaKg ?? 0),
      alvo,
    );
    // Volta para o Treino ativo que JÁ está embaixo na pilha. O `replace` antigo empilhava
    // um Ativo novo a cada série (16 montados na 15ª) e o voltar pedia N+1 toques.
    router.dismissTo('/treino/ativo');
  }, [item, reps, carga, alvo, registrar]);

  const { restante, adicionar } = useContagemRegressiva(total, concluir);

  // Voltar do Android no descanso = pular o descanso. A série JÁ foi feita (a execução
  // encerrou); voltar sem registrar perderia uma série de verdade. No navegador não há
  // botão físico: o voltar do histórico só retorna ao Ativo, sem registrar e sem quebrar nada.
  useEffect(() => {
    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
      concluir();
      return true;
    });
    return () => assinatura.remove();
  }, [concluir]);

  if (!sessao || !treino || !item || !alvo) return <Fundo />;

  const ultimaDoExercicio = sessao.indiceSerie + 1 >= item.series;
  // A carga anda no passo do exercício: 2,5 superior · 5 inferior · 2 halter (peso do corpo: 2,5).
  const incremento = treino.exercicio?.incrementoKg ?? 0;
  const passoDaCarga = incremento > 0 ? incremento : 2.5;

  return (
    <Tela>
      <View style={estilos.centro}>
        <Surgir ordem={0} style={estilos.relogio}>
          <Texto papel="eyebrow">Descanso</Texto>
          <Anel progresso={restante / total}>
            <Texto papel="mega">{formatarTempo(restante)}</Texto>
            <Texto papel="desc" cor={neutral.n400}>de {formatarTempo(total)}</Texto>
          </Anel>
        </Surgir>

        <Surgir ordem={1} style={estilos.registro}>
          <Texto papel="eyebrow">O que você fez · {sessao.indiceSerie + 1}ª série</Texto>
          {/* CAR-2: já vem com o alvo — confirmar é não mexer. Corrigir é um toque no − ou no +
              (mão suada não digita), ou tocar no número para digitar. */}
          <View style={estilos.campos}>
            <Ajuste rotulo="Reps" valor={reps} aoMudar={setReps} passo={1} />
            <Ajuste
              rotulo="Carga · kg"
              valor={carga}
              aoMudar={setCarga}
              passo={passoDaCarga}
              decimal
            />
          </View>
          <Texto papel="desc" cor={neutral.n400}>
            {ultimaDoExercicio
              ? `A seguir · ${treino.proximoExercicio ? treino.proximoExercicio.nomeCurto ?? treino.proximoExercicio.nome : 'resumo do treino'}`
              : `A seguir · ${sessao.indiceSerie + 2}ª série · ${item.faixa.min}–${item.faixa.max} × ${formatarKg(alvo.cargaKg)} kg`}
          </Texto>
        </Surgir>
      </View>

      {/* A ação primária do descanso é seguir para a próxima série (relevo: um por tela). */}
      <Surgir ordem={2} style={estilos.botoes}>
        <Pressable
          onPress={() => adicionar(30)}
          accessibilityRole="button"
          accessibilityLabel="Mais 30 segundos de descanso"
          style={({ pressed }) => [estilos.secundario, pressed && estilos.pressionado]}
        >
          <Texto papel="corpo" cor={neutral.n200}>+30 s</Texto>
        </Pressable>
        <BotaoPrimario onPress={concluir} style={estilos.flex}>Pular descanso</BotaoPrimario>
      </Surgir>
    </Tela>
  );
}

/** Lê "42,5" ou "42.5"; vazio ou inválido vira nulo. */
function paraNumero(texto: string): number | null {
  const n = Number.parseFloat(texto.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * Um número do registro: rótulo em cima, − e + dos lados, o número no meio (tocável para digitar).
 * Nunca desce de zero; a carga sai com vírgula (`formatarKg`), as reps inteiras.
 */
function Ajuste({
  rotulo, valor, aoMudar, passo, decimal = false,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  passo: number;
  decimal?: boolean;
}) {
  const numero = paraNumero(valor) ?? 0;
  const mudar = (delta: number) => {
    const novo = Math.max(0, Math.round((numero + delta) * 100) / 100);
    aoMudar(decimal ? formatarKg(novo) : String(Math.round(novo)));
  };
  return (
    <View style={estilos.ajuste}>
      <Texto papel="eyebrow" cor={neutral.n300}>{rotulo}</Texto>
      <View style={estilos.ajusteLinha}>
        <BotaoRedondo rotulo={`Menos ${rotulo.toLowerCase()}`} desabilitado={numero <= 0} onPress={() => mudar(-passo)}>
          <Menos tamanho={18} cor={numero <= 0 ? neutral.n500 : neutral.n100} />
        </BotaoRedondo>
        <TextInput
          value={valor}
          onChangeText={aoMudar}
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
          style={estilos.numero}
          accessibilityLabel={rotulo}
        />
        <BotaoRedondo rotulo={`Mais ${rotulo.toLowerCase()}`} onPress={() => mudar(passo)}>
          <Mais tamanho={18} cor={neutral.n100} />
        </BotaoRedondo>
      </View>
    </View>
  );
}

function BotaoRedondo({
  rotulo, desabilitado = false, onPress, children,
}: {
  rotulo: string;
  desabilitado?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: desabilitado }}
      style={({ pressed }) => [estilos.redondo, pressed && !desabilitado && estilos.pressionado]}
    >
      {children}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s5 },
  relogio: { alignItems: 'center', gap: space.s5 },
  registro: { alignItems: 'center', gap: space.s3, alignSelf: 'stretch' },
  // Os dois ajustes UM ABAIXO DO OUTRO, em linhas abertas com divisória (o padrão das listas):
  // o rótulo à esquerda, o − número + à direita.
  campos: { alignSelf: 'stretch', borderTopWidth: 1, borderTopColor: surface.line },
  ajuste: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.s3,
    paddingVertical: space.s2,
    borderBottomWidth: 1,
    borderBottomColor: surface.line,
  },
  ajusteLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s2 },
  // O número: display, grande, centrado — e digitável com um toque.
  // Largura FIXA: no navegador o campo de texto nasce com ~20 caracteres de largura e empurra o
  // − e o + para cima do número.
  numero: {
    width: 72,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlign: 'center',
    fontFamily: font.display,
    fontSize: size.h1,
    color: neutral.n100,
  },
  redondo: {
    width: hit.min,
    height: hit.min,
    flexShrink: 0,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: surface.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressionado: { backgroundColor: surface.rowActive },
  botoes: { flexDirection: 'row', gap: space.s3, paddingBottom: space.s5 },
  flex: { flex: 1 },
  secundario: {
    minHeight: hit.cta,
    paddingHorizontal: space.s5,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: surface.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
