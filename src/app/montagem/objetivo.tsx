import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BotaoPrimario } from '@/components/botao-primario';
import { Opcao } from '@/components/opcao';
import { TelaDeMontagem } from '@/components/tela-de-montagem';
import { PRESCRICAO_POR_OBJETIVO, type Objetivo } from '@/domain/plano';
import { space } from '@/theme/tokens';

import { OBJETIVO_RECOMENDADO, ROTAS_DA_MONTAGEM, useMontagem, voltar } from './_layout';

/**
 * Tela 08 · Montagem 3 de 3 — o objetivo. Espelho do frame `08 · Montagem 3 de 3`.
 *
 * O objetivo escolhe a faixa de repetições, que é a entrada da dupla progressão (`CAR-1`). A faixa
 * mostrada é a dos exercícios compostos e sai de `PRESCRICAO_POR_OBJETIVO` — ⚠️ o Figma dizia
 * "3 a 6" para força e "12 a 20" para condicionamento, números que o plano não usa.
 */
const OBJETIVOS: { chave: Objetivo; nome: string }[] = [
  { chave: 'hipertrofia', nome: 'Hipertrofia' },
  { chave: 'forca', nome: 'Força' },
  { chave: 'condicionamento', nome: 'Condicionamento' },
];

export default function MontagemObjetivo() {
  const { rascunho, mudar } = useMontagem();

  return (
    <TelaDeMontagem
      passo={{ atual: 3, de: 3 }}
      rotulo="Pergunta 3 de 3"
      titulo="Qual é o seu objetivo?"
      descricao="É isso que define a faixa de repetições de cada exercício — e é a faixa que faz a carga subir."
      onVoltar={() => voltar(ROTAS_DA_MONTAGEM.dias)}
      rodape={<BotaoPrimario onPress={() => router.push(ROTAS_DA_MONTAGEM.plano)}>Ver meu plano</BotaoPrimario>}
    >
      <View accessibilityRole="radiogroup" style={estilos.opcoes}>
        {OBJETIVOS.map(({ chave, nome }) => {
          const { min, max } = PRESCRICAO_POR_OBJETIVO[chave].composto;
          const faixa = `${min}–${max} repetições`;
          return (
            <Opcao
              key={chave}
              empilhada
              titulo={nome}
              detalhe={chave === OBJETIVO_RECOMENDADO ? `${faixa} · recomendado` : faixa}
              escolhida={rascunho.objetivo === chave}
              onPress={() => mudar({ objetivo: chave })}
            />
          );
        })}
      </View>
    </TelaDeMontagem>
  );
}

const estilos = StyleSheet.create({
  opcoes: { gap: space.s2 },
});
