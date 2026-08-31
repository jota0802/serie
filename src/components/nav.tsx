import { StyleSheet, View } from 'react-native';
import { IconeHoje, IconePerfil, IconeProgresso, IconeTreinos } from './icones';
import { Texto } from './texto';
import { glass, hit, neutral, space, surface } from '@/theme/tokens';

/**
 * A barra de navegação. Um dos DOIS únicos lugares com vidro no app inteiro
 * (o outro é a folha modal) — e aqui o vidro é o FINO, porque ela só flutua.
 *
 * ⚠️ Hoje só a aba `Hoje` tem tela. As outras três aparecem apagadas e NÃO recebem
 * toque: afordância clicável que não leva a lugar nenhum é o mesmo defeito que campo
 * que ninguém preenche. Elas acendem quando as telas 17, 20 e 21 existirem.
 */
const ABAS = [
  { chave: 'hoje', rotulo: 'Hoje', Icone: IconeHoje },
  { chave: 'progresso', rotulo: 'Progresso', Icone: IconeProgresso },
  { chave: 'treinos', rotulo: 'Treinos', Icone: IconeTreinos },
  { chave: 'perfil', rotulo: 'Perfil', Icone: IconePerfil },
] as const;

export function Nav({ ativa = 'hoje' }: { ativa?: (typeof ABAS)[number]['chave'] }) {
  return (
    <View style={estilos.barra}>
      {ABAS.map(({ chave, rotulo, Icone }) => {
        const eAtiva = chave === ativa;
        const cor = eAtiva ? neutral.n100 : neutral.n400;
        return (
          <View
            key={chave}
            accessibilityRole="tab"
            accessibilityState={{ selected: eAtiva, disabled: !eAtiva }}
            style={estilos.aba}
          >
            <Icone cor={cor} />
            <Texto papel="nav" cor={cor}>{rotulo}</Texto>
          </View>
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
});
