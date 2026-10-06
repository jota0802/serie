import { router } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import { BotaoPrimario } from '@/components/botao-primario';
import { CampoComUnidade } from '@/components/campo-com-unidade';
import { TelaDeMontagem } from '@/components/tela-de-montagem';
import { space } from '@/theme/tokens';

import { ROTAS_DA_MONTAGEM, unidadeDaAltura, useMontagem } from './_layout';

/**
 * Tela 06 · Montagem 1 de 3 — peso, idade e altura. Espelho do frame `06 · Montagem 1 de 3`.
 *
 * Só o peso é obrigatório: é dele que sai a carga de PARTIDA de cada exercício (`gerarPlano`).
 * Idade e altura são opcionais e a tela diz isso no rótulo e na explicação.
 *
 * ⚠️ O texto do Figma dizia que o peso "entra na conta dos exercícios com o peso do corpo" — no
 * plano é o contrário: barra fixa entra como "peso do corpo", e o peso vira a carga dos outros.
 *
 * Inválido, o botão fica desabilitado e diz o PORQUÊ no próprio rótulo ("Peso entre 25 e 300 kg"):
 * a explicação fica onde a pessoa olha, acima do teclado, e a tela não pula a cada tecla.
 */
export default function MontagemMedidas() {
  const { rascunho, mudar, pendencia } = useMontagem();
  // Lido UMA vez, na montagem: para quem não tem plano a 06 é a primeira tela, sem nada embaixo.
  const [podeVoltar] = useState(() => router.canGoBack());

  const continuar = () => {
    if (pendencia) return;
    // Sem isso o teclado numérico do iOS (que não tem "ok") segue aberto na tela seguinte.
    Keyboard.dismiss();
    router.push(ROTAS_DA_MONTAGEM.dias);
  };

  return (
    <TelaDeMontagem
      passo={{ atual: 1, de: 3 }}
      rotulo="Pergunta 1 de 3"
      titulo="Idade, peso e altura"
      descricao="O peso define a carga de partida de cada exercício. Idade e altura são opcionais."
      onVoltar={podeVoltar ? () => router.back() : undefined}
      rodape={
        <BotaoPrimario desabilitado={pendencia !== null} onPress={continuar}>
          {pendencia ?? 'Continuar'}
        </BotaoPrimario>
      }
    >
      <View style={estilos.campos}>
        <CampoComUnidade
          rotulo="Peso"
          unidade="kg"
          value={rascunho.peso}
          onChangeText={(texto) => mudar({ peso: soDecimal(texto, 1) })}
          placeholder="78"
          keyboardType="decimal-pad"
          maxLength={5}
          returnKeyType="done"
          accessibilityLabel="Peso, em quilos"
        />
        <CampoComUnidade
          rotulo="Idade · opcional"
          unidade={rascunho.idade === '1' ? 'ano' : 'anos'}
          value={rascunho.idade}
          onChangeText={(texto) => mudar({ idade: texto.replace(/\D/g, '') })}
          placeholder="24"
          keyboardType="number-pad"
          maxLength={3}
          returnKeyType="done"
          accessibilityLabel="Idade, em anos, opcional"
        />
        <CampoComUnidade
          rotulo="Altura · opcional"
          unidade={unidadeDaAltura(rascunho.altura)}
          value={rascunho.altura}
          onChangeText={(texto) => mudar({ altura: soDecimal(texto, 2) })}
          placeholder="1,78"
          keyboardType="decimal-pad"
          maxLength={4}
          returnKeyType="done"
          accessibilityLabel="Altura, em metros ou centímetros, opcional"
        />
      </View>
    </TelaDeMontagem>
  );
}

/**
 * Só algarismos e UMA vírgula, com no máximo `casas` depois dela. O ponto vira vírgula, e colar
 * "72.5 kg" vira "72,5". O teclado é numérico, mas no navegador e no colar ele não manda nada.
 */
function soDecimal(texto: string, casas: number): string {
  const [inteira = '', ...resto] = texto.replace(/\./g, ',').replace(/[^\d,]/g, '').split(',');
  return resto.length > 0 ? `${inteira},${resto.join('').slice(0, casas)}` : inteira;
}

const estilos = StyleSheet.create({
  // Campos (Figma): 16 entre um e outro.
  campos: { gap: space.s4 },
});
