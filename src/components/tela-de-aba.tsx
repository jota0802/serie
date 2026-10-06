import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fundo } from './fundo';
import { Nav, type AbaDaNav } from './nav';
import { Surgir } from './surgir';
import { Texto } from './texto';
import { space } from '@/theme/tokens';

/**
 * Moldura das telas de aba (17 Treinos, 20 Progresso, 21 Perfil): título grande, conteúdo
 * que rola e a <Nav> colada embaixo.
 *
 * Não usa <Tela> porque ela põe margem lateral na área segura inteira — e a nav é de
 * borda a borda. Mesmo arranjo da tela 10 (Hoje).
 *
 * Movimento: o título e cada bloco de primeiro nível surgem em sequência (`Surgir`) — a entrada
 * que aparece em todas as plataformas. Fragmentos são achatados, para cada bloco ter a sua vez e
 * o espaçamento continuar o mesmo. `surgir={false}` para a tela que anima os seus blocos à mão.
 */
export function TelaDeAba({
  titulo, aba, children, rodape, surgir = true,
}: { titulo?: string; aba: AbaDaNav; children: ReactNode; rodape?: ReactNode; surgir?: boolean }) {
  const inicio = titulo ? 1 : 0;
  return (
    <View style={estilos.raiz}>
      <Fundo />
      <SafeAreaView style={estilos.seguro}>
        <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
          {titulo && (
            <Surgir ordem={0}>
              <Texto papel="h1" accessibilityRole="header">{titulo}</Texto>
            </Surgir>
          )}
          {surgir
            ? achatar(children).map(([chave, filho], i) => (
                // A chave é a do próprio bloco (estável): quando os dados chegam e um bloco
                // aparece no meio, os outros NÃO remontam — e não piscam de novo.
                <Surgir key={chave} ordem={inicio + i}>
                  {filho}
                </Surgir>
              ))
            : children}
        </ScrollView>
        {rodape}
        <Nav ativa={aba} />
      </SafeAreaView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  seguro: { flex: 1 },
  // Respiro no fim: o último cartão não encosta na barra de abas.
  conteudo: { flexGrow: 1, paddingHorizontal: space.s5, paddingTop: space.s6, paddingBottom: space.s7, gap: space.s5 },
});

/**
 * Os filhos de primeiro nível com uma chave estável cada, e os fragmentos abertos (`<>…</>` vira
 * os seus blocos). A chave vem do `Children.toArray` (posição no código + `key`), prefixada pela
 * do fragmento, para não colidir.
 */
function achatar(filhos: ReactNode, prefixo = ''): [string, ReactNode][] {
  return Children.toArray(filhos).flatMap((filho, i): [string, ReactNode][] => {
    const chave = `${prefixo}${isValidElement(filho) && filho.key != null ? String(filho.key) : i}`;
    return isValidElement(filho) && filho.type === Fragment
      ? achatar((filho as ReactElement<{ children?: ReactNode }>).props.children, `${chave}/`)
      : [[chave, filho]];
  });
}
