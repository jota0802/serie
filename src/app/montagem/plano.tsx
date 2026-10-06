import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BotaoPrimario } from '@/components/botao-primario';
import { Card } from '@/components/card';
import { TelaDeMontagem } from '@/components/tela-de-montagem';
import { Texto } from '@/components/texto';
import { EXERCICIOS_POR_ID, nomeCurtoDe } from '@/data/exercicios';
import { proximoTreino } from '@/domain/historico';
import { gerarPlano, type Plano } from '@/domain/plano';
import type { Exercicio, ItemDeTreino, Treino } from '@/domain/types';
import { useHistorico } from '@/estado/historico';
import { usePerfil } from '@/estado/perfil';
import { formatarKg } from '@/lib/formato';
import { font, neutral, radius, size, space, surface } from '@/theme/tokens';

import { ROTAS_DA_MONTAGEM, useMontagem, voltar } from './_layout';

/**
 * Tela 09 · Seu plano — o que as três respostas geraram, ANTES de valer. Espelho do frame
 * `09 · Seu plano`: os dias, as letras e, aberto em cada letra, o que entra nela (séries × faixa ·
 * carga). Nada vai para o perfil até o "Usar este plano".
 *
 * A carga de cada exercício é a de PARTIDA, conservadora (`gerarPlano`), e a tela diz isso: a
 * primeira semana é calibração, e a dupla progressão (`CAR-1`) assume depois das primeiras séries.
 *
 * Fora do Figma, de propósito: o "Quero montar do zero" (a tela 18 não existe no app — link que
 * não leva a lugar nenhum é defeito) e o voltar, que o frame não tinha e as perguntas têm.
 */
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** A mesma estimativa do Hoje: ~11 min por exercício, contando o descanso (`CAR-6`). */
const MINUTOS_POR_EXERCICIO = 11;

export default function SeuPlano() {
  const { respostas } = useMontagem();
  const { perfil, salvar } = usePerfil();
  const { sessoes } = useHistorico();
  const [aceito, setAceito] = useState<Plano | null>(null);
  const plano = useMemo(() => (respostas ? gerarPlano(respostas, EXERCICIOS_POR_ID) : null), [respostas]);

  // ⚠️ O Hoje é rota protegida por "tem plano" (src/app/_layout.tsx): um `replace` no mesmo toque
  // do `salvar` ainda veria o perfil sem plano e não acharia a rota. Vai quando o plano entrou.
  useEffect(() => {
    if (aceito && perfil.plano === aceito) router.replace('/hoje');
  }, [aceito, perfil.plano]);

  // Sem peso não há plano: aberta direto pela URL, sem a 06 respondida, volta para ela.
  if (!respostas || !plano) return <Redirect href={ROTAS_DA_MONTAGEM.medidas} />;

  const usarEstePlano = () => {
    if (aceito) return;
    salvar({
      pesoKg: respostas.pesoKg,
      idade: respostas.idade ?? null,
      alturaCm: respostas.alturaCm ?? null,
      diasPorSemana: respostas.diasPorSemana,
      objetivo: respostas.objetivo,
      plano,
    });
    setAceito(plano);
  };

  const letras = plano.treinos.map((t) => t.id).join('');
  const exercicios = plano.treinos.reduce((total, t) => total + t.itens.length, 0);
  // A letra cheia é a próxima, como na 17: para quem refaz o plano, o rodízio continua de onde parou.
  const proxima = proximoTreino(sessoes, plano.treinos).id;

  return (
    <TelaDeMontagem
      rotulo="Pronto"
      // `gerarPlano`: 2 dias é corpo inteiro A/B; de 3 a 6, A/B/C em rodízio.
      titulo={respostas.diasPorSemana === 2 ? 'Corpo inteiro' : `Divisão ${letras}`}
      descricao={
        `${listaDeDias(plano.dias)}. ${exercicios} exercícios no total. ` +
        'As cargas são só o ponto de partida: depois das primeiras séries, o app ajusta sozinho.'
      }
      onVoltar={() => voltar(ROTAS_DA_MONTAGEM.objetivo)}
      rodape={<BotaoPrimario onPress={usarEstePlano}>Usar este plano</BotaoPrimario>}
    >
      <View style={estilos.letras}>
        {plano.treinos.map((treino) => (
          <CartaoDaLetra key={treino.id} treino={treino} proxima={treino.id === proxima} />
        ))}
      </View>
    </TelaDeMontagem>
  );
}

function CartaoDaLetra({ treino, proxima }: { treino: Treino; proxima: boolean }) {
  const n = treino.itens.length;
  return (
    <Card style={estilos.cartao}>
      <View
        style={estilos.cabecalho}
        accessible
        accessibilityLabel={`Treino ${treino.id}, ${treino.nome}, ${n} exercícios${proxima ? ', o próximo' : ''}`}
      >
        <View style={[estilos.letra, proxima && estilos.letraCheia]}>
          <Texto style={[estilos.letraTexto, proxima && estilos.letraTextoCheia]}>{treino.id}</Texto>
        </View>
        <View style={estilos.textos}>
          <Texto papel="h2" numberOfLines={1}>{treino.nome}</Texto>
          <Texto papel="desc" cor={neutral.n400} numberOfLines={1}>
            {n} exercícios · ~{n * MINUTOS_POR_EXERCICIO} min
          </Texto>
        </View>
      </View>

      <View style={estilos.exercicios}>
        {treino.itens.map((item) => {
          const exercicio = EXERCICIOS_POR_ID.get(item.exercicioId);
          return (
            <View key={item.exercicioId} style={estilos.exercicio}>
              <Texto papel="corpo" numberOfLines={1} style={estilos.nome}>
                {nomeCurtoDe(exercicio, item.exercicioId)}
              </Texto>
              <Texto papel="desc">{prescricaoDe(item, exercicio)}</Texto>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

/** "4 × 8–12 · 40 kg". Barra fixa: "peso do corpo". Sem carga de partida, só séries × faixa. */
function prescricaoDe(item: ItemDeTreino, exercicio: Exercicio | undefined): string {
  const series = `${item.series} × ${item.faixa.min}–${item.faixa.max}`;
  if (exercicio?.unidade === 'corporal') return `${series} · peso do corpo`;
  return item.cargaKg > 0 ? `${series} · ${formatarKg(item.cargaKg)} kg` : series;
}

/** [1, 2, 4, 5] → "Segunda, terça, quinta e sexta". */
function listaDeDias(dias: readonly number[]): string {
  const nomes = dias.map((d) => DIAS[d]);
  const texto = nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}` : nomes.join('');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** O selo da letra, o mesmo da tela 17 (Meus treinos). */
const LETRA = space.s6 + space.s2;

const estilos = StyleSheet.create({
  letras: { gap: space.s3 },
  cartao: { gap: space.s4 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: space.s4 },
  letra: {
    width: LETRA,
    height: LETRA,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: surface.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A próxima a fazer é a tinta cheia — a mesma lógica da série feita: o que importa agora.
  letraCheia: { backgroundColor: neutral.n100, borderColor: neutral.n100 },
  letraTexto: { fontFamily: font.display, fontSize: size.body, color: neutral.n100 },
  letraTextoCheia: { color: neutral.n1000 },
  textos: { flex: 1, gap: space.s1 },
  exercicios: {
    gap: space.s2,
    paddingTop: space.s4,
    borderTopWidth: 1,
    borderTopColor: surface.line,
  },
  exercicio: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s3 },
  nome: { flex: 1 },
});
