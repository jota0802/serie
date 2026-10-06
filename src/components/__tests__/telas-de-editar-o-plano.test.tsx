/**
 * As telas que editam o plano (17 Meus treinos, 18 Montar treino, 19 Escolher exercício), montadas
 * de verdade: as regras são as do domínio (`edicao-plano`, `progressao`), só os provedores
 * (perfil, histórico, sessão) e o router são dublês. O que se confere é o que a tela GRAVA.
 */
import { act, type ReactNode } from 'react';
import { create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';

import MontarTreino from '@/app/montar/[letra]';
import EscolherExercicio from '@/app/montar/escolher';
import Treinos from '@/app/treinos';
import { EXERCICIOS_POR_ID } from '@/data/exercicios';
import { removerExercicio, type Resultado } from '@/domain/edicao-plano';
import type { SessaoFechada } from '@/domain/historico';
import { gerarPlano, type Plano } from '@/domain/plano';
import type { Perfil } from '@/estado/perfil';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: jest.fn(() => ({})),
  useNavigation: () => ({ addListener: () => () => {} }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});

jest.mock('expo-linear-gradient', () => ({ LinearGradient: jest.requireActual('react-native').View }));

// O perfil de verdade fala com o Supabase; aqui ele é só estado, e o `salvar` é espionado.
jest.mock('@/estado/perfil', () => {
  const React = jest.requireActual('react');
  const Contexto = React.createContext(null);
  function ProvedorDeTeste({ inicial, aoSalvar, children }: { inicial: unknown; aoSalvar: (m: unknown) => void; children: unknown }) {
    const [perfil, setPerfil] = React.useState(inicial);
    const salvar = (mudanca: object) => {
      aoSalvar(mudanca);
      setPerfil((atual: object) => ({ ...atual, ...mudanca }));
    };
    return React.createElement(Contexto.Provider, { value: { perfil, salvar, carregado: true, pendente: false } }, children);
  }
  return { ProvedorDeTeste, usePerfil: () => React.useContext(Contexto) };
});

jest.mock('@/estado/historico', () => ({ useHistorico: jest.fn() }));
jest.mock('@/estado/sessao', () => ({ useSessao: () => ({ sessao: null }) }));

const { router, useLocalSearchParams } = jest.requireMock('expo-router') as {
  router: Record<'push' | 'back' | 'replace', jest.Mock>;
  useLocalSearchParams: jest.Mock;
};
const { ProvedorDeTeste } = jest.requireMock('@/estado/perfil') as {
  ProvedorDeTeste: (p: { inicial: Perfil; aoSalvar: (m: Partial<Perfil>) => void; children: ReactNode }) => ReactNode;
};
const { useHistorico } = jest.requireMock('@/estado/historico') as { useHistorico: jest.Mock };

const PLANO = gerarPlano({ pesoKg: 80, diasPorSemana: 3, objetivo: 'hipertrofia' }, EXERCICIOS_POR_ID);
const exige = (r: Resultado): Plano => {
  if (!r.ok) throw new Error(r.motivo);
  return r.plano;
};

function perfilCom(plano: Plano): Perfil {
  return { nome: 'Ana', pesoKg: 80, idade: null, alturaCm: null, diasPorSemana: 3, objetivo: 'hipertrofia', plano, atualizadoEmMs: 0 };
}

/** Monta a tela e devolve o renderer e a lista do que ela gravou (cada `salvar`). */
function montar(tela: ReactNode, plano: Plano = PLANO, sessoes: SessaoFechada[] = []) {
  useHistorico.mockReturnValue({ sessoes, carregado: true });
  const gravado: Partial<Perfil>[] = [];
  let r!: ReactTestRenderer;
  act(() => {
    r = create(
      <ProvedorDeTeste inicial={perfilCom(plano)} aoSalvar={(m) => gravado.push(m)}>
        {tela}
      </ProvedorDeTeste>,
    );
  });
  return { r, gravado, ultimoPlano: () => gravado[gravado.length - 1]?.plano as Plano };
}

/** Todo o texto na tela, numa string só. */
function texto(r: ReactTestRenderer): string {
  return r.root
    .findAll((n) => (n.type as unknown) === 'Text')
    .map((n) => (n.children as (string | ReactTestInstance)[]).filter((c) => typeof c === 'string').join(''))
    .join(' | ');
}

/** Toca o elemento com este rótulo de acessibilidade (o primeiro que tem `onPress`). */
function tocar(r: ReactTestRenderer, rotulo: string | RegExp) {
  const alvo = r.root.findAll(
    (n) => typeof n.props.onPress === 'function' &&
      (typeof rotulo === 'string' ? n.props.accessibilityLabel === rotulo : rotulo.test(String(n.props.accessibilityLabel ?? ''))),
  )[0];
  if (!alvo) throw new Error(`Nada tocável com o rótulo ${rotulo}`);
  act(() => alvo.props.onPress());
}

/** Toca o botão cujo texto é este (sobe do <Text> até quem tem `onPress`). */
function tocarTexto(r: ReactTestRenderer, procurado: string) {
  const noTexto = r.root.findAll(
    (n) => (n.type as unknown) === 'Text' && (n.children as unknown[]).filter((c) => typeof c === 'string').join('') === procurado,
  )[0];
  let alvo: ReactTestInstance | null = noTexto ?? null;
  while (alvo && typeof alvo.props.onPress !== 'function') alvo = alvo.parent;
  if (!alvo) throw new Error(`Nenhum botão com o texto "${procurado}"`);
  const pressionar = alvo.props.onPress as () => void;
  act(() => pressionar());
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('18 · Montar treino', () => {
  beforeEach(() => useLocalSearchParams.mockReturnValue({ letra: 'A' }));

  it('mostra e ajusta a carga do PRÓXIMO treino, e o ajuste é carimbado (RN-19)', () => {
    // Fez 47,5 kg na última vez sem fechar a faixa: o próximo treino pede 47,5, não os 40 do plano.
    const ontem = Date.now() - 24 * 60 * 60 * 1000;
    const supino = [10, 9, 8, 8].map((reps, indice) => ({ exercicioId: 'supino-reto-barra', indice, reps, cargaKg: 47.5, foiAlvo: false }));
    const sessoes: SessaoFechada[] = [{ id: 's1', treinoId: 'A', inicioMs: ontem - 3600000, fimMs: ontem, series: supino }];
    const { r, ultimoPlano } = montar(<MontarTreino />, PLANO, sessoes);

    expect(texto(r)).toContain('4 × 8–12 · 47,5 kg');
    tocar(r, 'Supino reto, 4 × 8–12 · 47,5 kg');
    expect(texto(r)).toContain('a da última vez');

    tocar(r, 'Aumentar carga');
    const item = ultimoPlano().treinos[0].itens[0];
    expect(item.cargaKg).toBe(50);
    expect(item.cargaDefinidaEmMs).toBeGreaterThan(ontem);
    expect(texto(r)).toContain('4 × 8–12 · 50 kg');
    expect(texto(r)).toContain('a que você definiu');
  });

  it('séries e faixa passam pelo domínio; a recusa aparece na tela', () => {
    const { r, ultimoPlano } = montar(<MontarTreino />);
    tocar(r, 'Supino reto, 4 × 8–12 · 40 kg');
    tocar(r, 'Aumentar séries');
    expect(ultimoPlano().treinos[0].itens[0].series).toBe(5);

    for (let i = 0; i < 4; i++) tocar(r, 'Aumentar reps mínimas'); // 8 → 12 = o máximo
    tocar(r, 'Aumentar reps mínimas');
    expect(ultimoPlano().treinos[0].itens[0].faixa).toEqual({ min: 12, max: 12 });
    expect(texto(r)).toContain('O mínimo de repetições não pode passar do máximo.');
  });

  it('descanso: subir e voltar ao número do padrão grava "padrão" (vazio), não o número', () => {
    const { r, ultimoPlano } = montar(<MontarTreino />);
    tocar(r, 'Supino reto, 4 × 8–12 · 40 kg');
    tocar(r, 'Aumentar descanso');
    expect(ultimoPlano().treinos[0].itens[0].descansoSegundos).toBe(105);
    expect(texto(r)).toContain('voltar ao padrão (1:30)');
    tocar(r, 'Diminuir descanso');
    expect(ultimoPlano().treinos[0].itens[0].descansoSegundos).toBeUndefined();
    expect(texto(r)).toContain('padrão do exercício');
  });

  it('o último exercício não sai: a frase do domínio aparece, sem confirmação', () => {
    let soUm = PLANO;
    while (soUm.treinos[0].itens.length > 1) soUm = exige(removerExercicio(soUm, 'A', 1));
    const { r, gravado } = montar(<MontarTreino />, soUm);
    tocar(r, 'Supino reto, 4 × 8–12 · 40 kg');
    tocarTexto(r, 'Remover');
    expect(texto(r)).toContain('O treino precisa de pelo menos um exercício.');
    expect(texto(r)).not.toContain('Tirar supino reto');
    expect(gravado).toHaveLength(0);
  });

  it('remover pede confirmação na linha e tira o exercício', () => {
    const { r, ultimoPlano } = montar(<MontarTreino />);
    tocar(r, 'Supino reto, 4 × 8–12 · 40 kg');
    tocarTexto(r, 'Remover');
    expect(texto(r)).toContain('Tirar supino reto do treino A?');
    tocar(r, 'Remover Supino reto do treino A');
    expect(ultimoPlano().treinos[0].itens.map((i) => i.exercicioId)).not.toContain('supino-reto-barra');
  });

  it('apagar o treino confirma na tela, grava sem a letra e volta', () => {
    const { r, ultimoPlano } = montar(<MontarTreino />);
    tocarTexto(r, 'Apagar treino A');
    expect(texto(r)).toContain('Apagar o treino A, Peito e tríceps?');
    tocar(r, 'Apagar o treino A de vez');
    expect(ultimoPlano().treinos.map((t) => t.id)).toEqual(['B', 'C']);
    expect(router.back).toHaveBeenCalled();
  });

  it('o exercício que chega da 19 abre no ajuste, já com a carga de partida pelo peso (RN-18)', () => {
    // As duas telas montadas juntas, como na pilha: a 18 embaixo, a 19 por cima.
    const { r } = montar(
      <>
        <MontarTreino />
        <EscolherExercicio />
      </>,
    );
    tocar(r, /^Supino na máquina,/);
    expect(r.root.findAll((n) => n.props.accessibilityLabel === 'Subir Supino na máquina no treino').length).toBeGreaterThan(0);
    // A tabela de carga de partida cobre o catálogo todo: 80 kg × 0,45 = 36 → 35 kg na anilha.
    expect(texto(r)).toContain('Supino na máquina | 4 × 8–12 · 35 kg');
    expect(texto(r)).toContain('carga de partida');
  });

  it('letra que não existe: estado vazio com volta', () => {
    useLocalSearchParams.mockReturnValue({ letra: 'F' });
    const { r } = montar(<MontarTreino />);
    expect(texto(r)).toContain('Este treino não está mais no plano');
  });
});

describe('19 · Escolher exercício', () => {
  it('busca sem acento acha pelo nome e pelo músculo; o que já está no treino vem apagado', () => {
    useLocalSearchParams.mockReturnValue({ letra: 'A' });
    const { r } = montar(<EscolherExercicio />);
    const busca = r.root.findAll((n) => n.props.placeholder === 'Buscar exercício' && typeof n.props.onChangeText === 'function')[0];
    act(() => busca.props.onChangeText('TRICEPS'));
    const tela = texto(r);
    expect(tela).toContain('Tríceps testa');
    expect(tela).toContain('Paralelas'); // grupo tríceps
    expect(tela).toContain('Tríceps · isolado · já no treino'); // o tríceps corda do treino A
    expect(tela).not.toContain('Supino');
  });

  it('com ?letra, o exercício entra no fim do treino e a tela volta', () => {
    useLocalSearchParams.mockReturnValue({ letra: 'A' });
    const { r, ultimoPlano } = montar(<EscolherExercicio />);
    tocar(r, /^Supino na máquina,/);
    expect(ultimoPlano().treinos[0].itens.at(-1)).toMatchObject({ exercicioId: 'supino-maquina', series: 4, faixa: { min: 8, max: 12 } });
    expect(router.back).toHaveBeenCalled();
  });

  it('com ?novo=1, nasce o treino D com o exercício e a 18 dele abre no lugar', () => {
    useLocalSearchParams.mockReturnValue({ novo: '1' });
    const { r, ultimoPlano } = montar(<EscolherExercicio />);
    tocar(r, /^Remada baixa,/);
    const d = ultimoPlano().treinos.find((t) => t.id === 'D');
    expect(d).toMatchObject({ nome: 'Treino D', itens: [{ exercicioId: 'remada-baixa' }] });
    expect(router.replace).toHaveBeenCalledWith('/montar/D');
  });
});

describe('17 · Meus treinos', () => {
  it('os dias de treino alternam, e o último não sai (RN-16)', () => {
    const { r, ultimoPlano } = montar(<Treinos />);
    tocar(r, 'Quarta');
    expect(ultimoPlano().dias).toEqual([1, 5]);
    expect(texto(r)).toContain('Meta: 2 treinos por semana');
    tocar(r, 'Segunda');
    tocar(r, 'Sexta');
    expect(texto(r)).toContain('Escolha pelo menos um dia de treino.');
    expect(ultimoPlano().dias).toEqual([5]);
  });

  it('as setas mudam a ordem do rodízio', () => {
    const { r, ultimoPlano } = montar(<Treinos />);
    tocar(r, 'Descer o treino A no rodízio');
    expect([...ultimoPlano().treinos].sort((a, b) => a.ordem - b.ordem).map((t) => t.id)).toEqual(['B', 'A', 'C']);
  });

  it('cada letra abre a 18, e "Novo treino" abre a 19 em modo novo', () => {
    const { r } = montar(<Treinos />);
    tocar(r, /^Treino B, Costas e bíceps/);
    expect(router.push).toHaveBeenCalledWith('/montar/B');
    tocar(r, 'Novo treino');
    expect(router.push).toHaveBeenCalledWith('/montar/escolher?novo=1');
  });
});
