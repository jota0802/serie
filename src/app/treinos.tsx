import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Fundo } from '@/components/fundo';
import { Chevron } from '@/components/icones';
import { LinhaDeAjuste } from '@/components/linha-de-ajuste';
import { TelaDeAba } from '@/components/tela-de-aba';
import { Texto } from '@/components/texto';
import { EXERCICIOS_POR_ID, nomeCurtoDe } from '@/data/exercicios';
import { TREINOS } from '@/data/treinos';
import { proximoTreino } from '@/domain/historico';
import { dataRelativa, ultimaSessaoDe } from '@/domain/progresso';
import { useHistorico } from '@/estado/historico';
import { font, hit, neutral, radius, size, space, surface } from '@/theme/tokens';

/**
 * Tela 17 · Meus treinos — as letras do plano.
 *
 * "Último há 4 dias" e qual letra é a próxima saem do histórico, não de campo guardado:
 * é a mesma conta da tela Hoje (`proximoTreino`), então as duas nunca discordam.
 *
 * ⚠️ Sem o "+" e sem "Arquivados" do Figma: montar treino do zero (tela 18) está fora do
 * escopo do CP5, e botão que não leva a lugar nenhum é defeito, não enfeite.
 */
export default function Treinos() {
  const { sessoes, carregado } = useHistorico();
  const [aberto, setAberto] = useState<string | null>(null);
  // Relógio lido UMA vez, na montagem: render tem que ser puro (react-hooks/purity), e
  // "há 4 dias" não muda enquanto a tela está aberta.
  const [agora] = useState(() => Date.now());
  // Antes do AsyncStorage responder `sessoes` é []: o A destacado como próximo e "nunca feito"
  // em toda letra, trocando em seguida. A tela inteira espera, como o Hoje — canvas vazio.
  if (!carregado) return <Fundo />;
  const proximo = proximoTreino(sessoes, TREINOS).id;

  return (
    <TelaDeAba titulo="Treinos" aba="treinos">
      <View style={estilos.lista}>
        {TREINOS.map((treino) => {
          const ultima = ultimaSessaoDe(sessoes, treino.id);
          const eProximo = treino.id === proximo;
          const eAberto = aberto === treino.id;
          const quando = ultima ? `último ${dataRelativa(ultima.fimMs, agora)}` : 'nunca feito';

          return (
            <View key={treino.id} style={estilos.card}>
              <Pressable
                onPress={() => setAberto(eAberto ? null : treino.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: eAberto }}
                accessibilityLabel={`Treino ${treino.id}, ${treino.nome}${eProximo ? ', o próximo' : ''}`}
                style={({ pressed }) => [estilos.cabecalho, pressed && estilos.pressionado]}
              >
                <View style={[estilos.letra, eProximo && estilos.letraProxima]}>
                  <Texto style={[estilos.letraTexto, eProximo && estilos.letraTextoProxima]}>{treino.id}</Texto>
                </View>
                <View style={estilos.textos}>
                  <Texto papel="h2" numberOfLines={1}>{treino.nome}</Texto>
                  <Texto papel="desc" numberOfLines={1}>
                    {treino.itens.length} exercícios · {quando}
                  </Texto>
                  {eProximo && <Texto papel="eyebrow" cor={neutral.n100}>Próximo treino</Texto>}
                </View>
                <View style={eAberto && estilos.chevronAberto}>
                  <Chevron />
                </View>
              </Pressable>

              {eAberto && (
                <View style={estilos.exercicios}>
                  {treino.itens.map((item, i) => (
                    <LinhaDeAjuste
                      key={item.exercicioId}
                      rotulo={nomeCurtoDe(EXERCICIOS_POR_ID.get(item.exercicioId), item.exercicioId)}
                      valor={`${item.series} × ${item.faixa.min}–${item.faixa.max}`}
                      ultima={i === treino.itens.length - 1}
                      // Tela 15 · Exercício (rota da frente que faz o histórico por exercício).
                      onPress={() => router.push(`/exercicio/${item.exercicioId}`)}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </TelaDeAba>
  );
}

const LETRA = 40;

const estilos = StyleSheet.create({
  lista: { gap: space.s3 },
  card: {
    backgroundColor: surface.raised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: surface.line,
    overflow: 'hidden',
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s4,
    minHeight: hit.row + space.s5,
    paddingHorizontal: space.s4,
    paddingVertical: space.s4,
  },
  pressionado: { backgroundColor: surface.rowActive },
  letra: {
    width: LETRA,
    height: LETRA,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: surface.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A próxima letra é a tinta cheia — a mesma lógica da série feita: o que importa agora.
  letraProxima: { backgroundColor: neutral.n100, borderColor: neutral.n100 },
  letraTexto: { fontFamily: font.display, fontSize: size.body, color: neutral.n100 },
  letraTextoProxima: { color: neutral.n1000 },
  textos: { flex: 1, gap: 2 },
  chevronAberto: { transform: [{ rotate: '90deg' }] },
  exercicios: {
    borderTopWidth: 1,
    borderTopColor: surface.line,
    paddingHorizontal: space.s4,
  },
});
