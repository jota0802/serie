// O Reanimated 4 roda sobre o react-native-worklets; no Jest, os dois usam os mocks oficiais.
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// No Jest as telas renderizam sem a animação de entrada. O `Surgir` agenda um timer (o atraso de
// cada bloco) com o driver nativo; quando ele dispara depois que o Jest já desmontou o ambiente
// do arquivo de teste, derruba o processo inteiro.
jest.mock('@/components/surgir', () => {
  const { createElement } = require('react');
  const { View } = require('react-native');
  return {
    Surgir: ({ children, style }: { children: unknown; style?: unknown }) => createElement(View, { style }, children),
  };
});
