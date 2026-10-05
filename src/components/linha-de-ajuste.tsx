import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Chevron } from './icones';
import { Texto } from './texto';
import { hit, space, surface } from '@/theme/tokens';

/**
 * Linha "rótulo ······ valor" das listas de apoio (Perfil, recordes do Progresso).
 *
 * ⚠️ Só ganha chevron e toque quando tem `onPress`: linha só-leitura com cara de botão
 * é afordância que não leva a lugar nenhum. Altura de `hit.row` (56) — mão suada.
 */
export function LinhaDeAjuste({
  rotulo, valor, onPress, corDoValor, ultima = false, acessorio,
}: {
  rotulo: string;
  valor?: string;
  onPress?: () => void;
  corDoValor?: string;
  ultima?: boolean;
  acessorio?: ReactNode;
}) {
  const conteudo = (
    <>
      <Texto papel="corpo" numberOfLines={1} style={valor === undefined ? estilos.rotulo : estilos.rotuloComValor}>
        {rotulo}
      </Texto>
      {valor !== undefined && (
        <Texto papel="desc" cor={corDoValor} numberOfLines={2} style={estilos.valor}>{valor}</Texto>
      )}
      {acessorio}
      {onPress && <Chevron />}
    </>
  );

  if (!onPress) return <View style={[estilos.linha, !ultima && estilos.divisor]}>{conteudo}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={valor ? `${rotulo}, ${valor}` : rotulo}
      style={({ pressed }) => [estilos.linha, !ultima && estilos.divisor, pressed && estilos.pressionada]}
    >
      {conteudo}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', minHeight: hit.row, gap: space.s3 },
  divisor: { borderBottomWidth: 1, borderBottomColor: surface.line },
  rotulo: { flex: 1 },
  // Com valor, o rótulo é o que diz o que é a linha: fica inteiro (até 65%) e quem cede é o
  // VALOR, em até 2 linhas à direita. Antes, "2,5 kg · 5 kg pernas · 2 kg halter" deixava só
  // "Incremento de …" a 390 px. Sem `flex: 0` aqui: no navegador ele vira `0 1 0%` e encolhe.
  rotuloComValor: { flexShrink: 0, maxWidth: '65%' },
  valor: { flex: 1, textAlign: 'right' },
  pressionada: { backgroundColor: surface.rowActive },
});
