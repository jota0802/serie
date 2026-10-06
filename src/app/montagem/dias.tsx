import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BotaoPrimario } from '@/components/botao-primario';
import { Opcao } from '@/components/opcao';
import { TelaDeMontagem } from '@/components/tela-de-montagem';
import { DIAS_POSSIVEIS } from '@/domain/plano';
import { space } from '@/theme/tokens';

import { DIAS_RECOMENDADOS, ROTAS_DA_MONTAGEM, useMontagem, voltar } from './_layout';

/**
 * Tela 07 · Montagem 2 de 3 — quantos dias por semana. Espelho do frame `07 · Montagem 2 de 3`,
 * com o topo das irmãs 06 e 08 (o voltar, que o frame 07 não tinha).
 *
 * O detalhe de cada opção diz a divisão que o `gerarPlano` monta de verdade: 2 dias é corpo
 * inteiro A/B; de 3 a 6, A/B/C em rodízio. ⚠️ O Figma prometia "Divisão ABCDE" para 5 dias e
 * "push / pull / pernas 2×" para 6 — o plano não tem letra D nem E, então a tela não promete.
 */
const DIVISAO: Record<(typeof DIAS_POSSIVEIS)[number], string> = {
  2: 'Corpo inteiro',
  3: 'Divisão ABC',
  4: 'ABC + A',
  5: 'ABC + AB',
  6: 'ABC 2×',
};

export default function MontagemDias() {
  const { rascunho, mudar } = useMontagem();

  return (
    <TelaDeMontagem
      passo={{ atual: 2, de: 3 }}
      rotulo="Pergunta 2 de 3"
      titulo="Quantos dias por semana você treina?"
      descricao="Isso define a divisão. Dá pra mudar depois sem perder histórico."
      onVoltar={() => voltar(ROTAS_DA_MONTAGEM.medidas)}
      rodape={<BotaoPrimario onPress={() => router.push(ROTAS_DA_MONTAGEM.objetivo)}>Continuar</BotaoPrimario>}
    >
      <View accessibilityRole="radiogroup" style={estilos.opcoes}>
        {DIAS_POSSIVEIS.map((dias) => (
          <Opcao
            key={dias}
            titulo={`${dias} dias`}
            detalhe={dias === DIAS_RECOMENDADOS ? `${DIVISAO[dias]} · recomendado` : DIVISAO[dias]}
            escolhida={rascunho.diasPorSemana === dias}
            onPress={() => mudar({ diasPorSemana: dias })}
          />
        ))}
      </View>
    </TelaDeMontagem>
  );
}

const estilos = StyleSheet.create({
  opcoes: { gap: space.s2 },
});
