import { StyleSheet, Text, View } from 'react-native';

import { Campo, type CampoProps } from './campo';
import { font, hit, neutral, space } from '@/theme/tokens';

/**
 * O <Campo> com a unidade colada no número, como na tela 06 do Figma: "78 kg", "24 anos",
 * "1,78 m". O campo guarda só o número — a unidade não entra no texto, então não há o que
 * apagar nem o que limpar antes de ler.
 *
 * Por cima do poço vai uma linha que não recebe toque: o mesmo texto do campo, INVISÍVEL, empurra
 * a unidade para logo depois do último algarismo. Vazio, ela segue o placeholder, no cinza dele.
 * ⚠️ Depende da geometria do poço do <Campo> (altura `hit.row`, margem `space.s4`, Manrope 17):
 * mexeu lá, confira aqui.
 */
export function CampoComUnidade({
  unidade, value = '', placeholder = '', ...rest
}: CampoProps & { unidade: string }) {
  const vazio = value.length === 0;
  return (
    <View>
      <Campo value={value} placeholder={placeholder} {...rest} />
      <View style={estilos.linha} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={[estilos.texto, estilos.fantasma]} numberOfLines={1}>
          {vazio ? placeholder : value}
        </Text>
        {/* Espaço FIXO (U+00A0): no navegador, uma linha só (`nowrap`) come o espaço comum do começo. */}
        <Text style={[estilos.texto, { color: vazio ? neutral.n400 : neutral.n100 }]} numberOfLines={1}>
          {` ${unidade}`}
        </Text>
      </View>
    </View>
  );
}

/** O corpo do valor no <Campo> (Manrope Regular 17). Outro corpo, e a unidade descola do número. */
const CORPO_DO_CAMPO = 17;

const estilos = StyleSheet.create({
  linha: {
    position: 'absolute',
    left: space.s4,
    right: space.s4,
    bottom: 0,
    height: hit.row,
    flexDirection: 'row',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  texto: { fontFamily: font.text, fontSize: CORPO_DO_CAMPO },
  fantasma: { opacity: 0 },
});
