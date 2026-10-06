import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { BotaoLiso } from './botao-liso';
import { Texto } from './texto';
import { accent, font, hit, size, space } from '@/theme/tokens';

/**
 * Ação destrutiva em dois toques: o texto vermelho que abre (<AcaoDestrutiva>) e a pergunta NA
 * PRÓPRIA LINHA (<ConfirmacaoDestrutiva>) — "Apagar o treino de seg, 5 out?".
 *
 * Na tela, não `Alert.alert`: no react-native-web o Alert não faz nada, e o botão pareceria
 * quebrado no navegador (a mesma decisão do "Apagar meu histórico" do Perfil). Vermelho é SÓ ação
 * destrutiva (`accent.danger`); e jogar fora o que foi feito não pode ser um toque errado (RN-32).
 */
export function AcaoDestrutiva({
  children, onPress, style,
}: { children: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [estilos.acao, pressed && estilos.pressionada, style]}
    >
      <Text style={estilos.acaoTexto}>{children}</Text>
    </Pressable>
  );
}

export function ConfirmacaoDestrutiva({
  pergunta, detalhe, acao, rotuloDaAcao, aoConfirmar, aoCancelar, cancelar = 'Cancelar',
}: {
  pergunta: string;
  detalhe?: string;
  /** O verbo do botão vermelho: "Apagar", "Descartar", "Tirar". */
  acao: string;
  /** O que o leitor de tela anuncia no botão vermelho, se o verbo sozinho não basta. */
  rotuloDaAcao?: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
  cancelar?: string;
}) {
  return (
    <View style={estilos.confirmacao}>
      {/* `polite`: a pergunta é lida quando aparece no lugar do botão que a abriu. */}
      <View style={estilos.textos} accessibilityLiveRegion="polite">
        <Texto papel="corpo">{pergunta}</Texto>
        {detalhe ? <Texto papel="desc">{detalhe}</Texto> : null}
      </View>
      <View style={estilos.botoes}>
        <BotaoLiso onPress={aoCancelar} style={estilos.botao}>{cancelar}</BotaoLiso>
        <BotaoLiso variante="perigo" onPress={aoConfirmar} rotuloDeAcessibilidade={rotuloDaAcao} style={estilos.botao}>
          {acao}
        </BotaoLiso>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  acao: { alignSelf: 'flex-start', minHeight: hit.min, justifyContent: 'center' },
  pressionada: { opacity: 0.7 },
  // Negrito: o vermelho sobre o escuro tem pouco contraste, e o peso ajuda a ler. O passo que
  // de fato destrói é o botão cheio da confirmação (texto n0 sobre o vermelho, 6,7:1).
  acaoTexto: { fontFamily: font.textBold, fontSize: size.body, color: accent.danger },
  confirmacao: { gap: space.s3 },
  textos: { gap: space.s1 },
  botoes: { flexDirection: 'row', gap: space.s3 },
  botao: { flex: 1 },
});
