import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconeHoje, IconePerfil, IconeProgresso, IconeTreinos } from './icones';
import { Texto } from './texto';
import { glass, hit, neutral, space, surface } from '@/theme/tokens';

/**
 * A barra de navegação. Um dos DOIS únicos lugares com vidro no app inteiro
 * (o outro é a folha modal) — e aqui o vidro é o FINO, porque ela só flutua.
 *
 * As quatro abas levam a tela de verdade (10 Hoje, 20 Progresso, 17 Treinos, 21 Perfil).
 * ⚠️ Troca de aba é `router.replace`, não `push`: aba é lugar, não passo. Com `push`,
 * passear pelas abas empilharia telas e o "voltar" do Android desfaria cada toque.
 */
const ABAS = [
  { chave: 'hoje', rotulo: 'Início', rota: '/hoje', Icone: IconeHoje },
  { chave: 'progresso', rotulo: 'Progresso', rota: '/progresso', Icone: IconeProgresso },
  { chave: 'treinos', rotulo: 'Treinos', rota: '/treinos', Icone: IconeTreinos },
  { chave: 'perfil', rotulo: 'Perfil', rota: '/perfil', Icone: IconePerfil },
] as const satisfies readonly { chave: string; rotulo: string; rota: Href; Icone: unknown }[];

export type AbaDaNav = (typeof ABAS)[number]['chave'];

export function Nav({ ativa = 'hoje' }: { ativa?: AbaDaNav }) {
  return (
    <View style={estilos.barra} accessibilityRole="tablist">
      {ABAS.map(({ chave, rotulo, rota, Icone }) => {
        const eAtiva = chave === ativa;
        const cor = eAtiva ? neutral.n100 : neutral.n400;
        return (
          <Pressable
            key={chave}
            accessibilityRole="tab"
            accessibilityLabel={rotulo}
            accessibilityState={{ selected: eAtiva }}
            // Tocar na aba em que já se está não recarrega a tela.
            onPress={() => !eAtiva && router.replace(rota)}
            style={({ pressed }) => [estilos.aba, pressed && !eAtiva && estilos.pressionada]}
          >
            <Icone cor={cor} />
            <Texto papel="nav" cor={cor}>{rotulo}</Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: glass.thin,
    borderTopWidth: 1,
    borderTopColor: surface.line,
    paddingTop: space.s3,
    paddingBottom: space.s2,
  },
  aba: { flex: 1, minHeight: hit.min, alignItems: 'center', justifyContent: 'center', gap: 5 },
  pressionada: { opacity: 0.7 },
});
