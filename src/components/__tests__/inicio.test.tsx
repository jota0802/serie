/**
 * O Início (tela 10, rota `/hoje`) e o heatmap, montados de verdade (react-test-renderer), com o
 * roteador, o histórico, o perfil e a sessão simulados. Cobre o que no aparelho é olhar e tocar:
 * a letra do rodízio (RN-20), o descanso (RN-21), a troca de letra (RN-22), o retomar (RN-31), o
 * dia tocado no heatmap (RN-50 a RN-52) e o relógio relido quando a tela volta ao foco.
 */
import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';

import { Heatmap } from '@/components/heatmap';
import { calendarioDoHeatmap } from '@/domain/calendario';
import type { SessaoFechada } from '@/domain/historico';
import type { SerieRegistrada, Treino } from '@/domain/types';
import { useHistorico } from '@/estado/historico';
import { usePerfil, usePlano } from '@/estado/perfil';
import { useSessao } from '@/estado/sessao';

import Inicio from '../../app/hoje';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// O foco da tela: guarda os efeitos para o teste "voltar" a ela depois de um treino.
const mockFocos: (() => void)[] = [];

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    router: { push: jest.fn(), replace: jest.fn() },
    useFocusEffect: (efeito: () => void) =>
      React.useEffect(() => {
        mockFocos.push(efeito);
        efeito();
      }, [efeito]),
  };
});
jest.mock('react-native-safe-area-context', () =>
  jest.requireActual<{ default: unknown }>('react-native-safe-area-context/jest/mock').default);
jest.mock('@/estado/sessao', () => ({ useSessao: jest.fn() }));
jest.mock('@/estado/historico', () => ({ useHistorico: jest.fn() }));
jest.mock('@/estado/perfil', () => ({ usePerfil: jest.fn(), usePlano: jest.fn() }));

const SEGUNDA = new Date(2026, 9, 5, 21, 0, 0).getTime(); // segunda, 5 de outubro de 2026, 21h
const TERCA = new Date(2026, 9, 6, 9, 0, 0).getTime();

const item = (exercicioId: string, cargaKg: number, series = 4, faixa = { min: 8, max: 12 }) => ({
  exercicioId, series, faixa, cargaKg,
});
const A: Treino = {
  id: 'A', nome: 'Peito e tríceps', ordem: 0,
  itens: [item('supino-reto-barra', 40), item('crossover', 12, 3, { min: 12, max: 15 })],
};
const B: Treino = { id: 'B', nome: 'Costas e bíceps', ordem: 1, itens: [item('remada-curvada', 40)] };
const C: Treino = { id: 'C', nome: 'Pernas', ordem: 2, itens: [item('agachamento-livre', 60)] };
// Segunda, quarta e sexta: meta de 3 treinos por semana.
const PLANO = { treinos: [A, B, C], porId: new Map([A, B, C].map((t) => [t.id, t])), dias: [1, 3, 5] };

const series = (exercicioId: string, n: number, reps: number, cargaKg: number): SerieRegistrada[] =>
  Array.from({ length: n }, (_, indice) => ({ exercicioId, indice, reps, cargaKg, foiAlvo: true }));
const fechada = (id: string, treinoId: string, fimMs: number, s: SerieRegistrada[]): SessaoFechada => ({
  id, treinoId, inicioMs: fimMs - 3_600_000, fimMs, series: s,
});

// Quarta 30/09: A, com o supino 4 × 12 a 40 kg (fecha a faixa → sobe para 42,5). Sexta 02/10: C.
const S_A = fechada('sessao-a', 'A', new Date(2026, 8, 30, 19).getTime(), [
  ...series('supino-reto-barra', 4, 12, 40), ...series('crossover', 3, 12, 12),
]);
const S_C = fechada('sessao-c', 'C', new Date(2026, 9, 2, 19).getTime(), series('agachamento-livre', 4, 10, 60));

let sessoes: SessaoFechada[];
let sessao: object | null;
let carregado: boolean;
const comecar = jest.fn();

function montar(elemento: ReactElement = <Inicio />): ReactTestRenderer {
  (useSessao as jest.Mock).mockImplementation(() => ({ sessao, carregada: true, comecar }));
  (useHistorico as jest.Mock).mockImplementation(() => ({ sessoes, carregado, pendentes: 0 }));
  (usePerfil as jest.Mock).mockImplementation(() => ({ perfil: { nome: 'jotinha franco' }, carregado: true }));
  (usePlano as jest.Mock).mockImplementation(() => PLANO);
  let tela!: ReactTestRenderer;
  act(() => {
    tela = create(elemento);
  });
  return tela;
}

const textoDe = (no: ReactTestInstance): string =>
  ([] as unknown[]).concat(no.props.children)
    .map((c) => (typeof c === 'string' || typeof c === 'number' ? String(c) : ''))
    .join('');
const temTexto = (tela: ReactTestRenderer, texto: string) =>
  tela.root.findAllByType(Text).some((no) => textoDe(no) === texto);
// O cabeçalho junta o dia, a semana e o próximo treino numa linha só: confere por trecho.
const contemTexto = (tela: ReactTestRenderer, trecho: string) =>
  tela.root.findAllByType(Text).some((no) => textoDe(no).includes(trecho));
const tocavel = (tela: ReactTestRenderer, rotulo: string) =>
  tela.root.find((no) => no.props.accessibilityLabel === rotulo && typeof no.props.onPress === 'function');
const tocar = (tela: ReactTestRenderer, rotulo: string) => act(() => tocavel(tela, rotulo).props.onPress());
const botaoComTexto = (tela: ReactTestRenderer, texto: string) =>
  tela.root.find((no) =>
    typeof no.props.onPress === 'function' && no.findAllByType(Text).some((t) => textoDe(t) === texto));
/** O título do card do treino (a letra grande e o nome), como o leitor de tela diz. */
const titulo = (tela: ReactTestRenderer) =>
  tela.root.findAll((no) =>
    typeof no.props.accessibilityLabel === 'string' && / exercícios?, cerca de \d+ minutos$/.test(no.props.accessibilityLabel),
  )[0]?.props.accessibilityLabel;

let avisos: string[];
let espiao: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers({ now: SEGUNDA });
  sessoes = [S_A, S_C];
  sessao = null;
  carregado = true;
  comecar.mockClear();
  (router.push as jest.Mock).mockClear();
  mockFocos.length = 0;
  avisos = [];
  espiao = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (!String(args[0]).includes('react-test-renderer is deprecated')) avisos.push(args.map(String).join(' '));
  });
});

afterEach(() => {
  espiao.mockRestore();
  jest.useRealTimers();
  // Nenhum aviso do React (chave repetida, prop inválida, update fora do act) passa calado.
  expect(avisos).toEqual([]);
});

describe('Início · o que eu faço hoje', () => {
  it('antes do histórico responder: só o cabeçalho, sem letra que piscaria', () => {
    carregado = false;
    const tela = montar();
    expect(contemTexto(tela, 'Segunda, 5 out')).toBe(true);
    expect(temTexto(tela, 'Boa noite, Jotinha')).toBe(true);
    expect(titulo(tela)).toBeUndefined();
    expect(temTexto(tela, 'Começar treino')).toBe(false);
  });

  it('a aba se chama Início', () => {
    const tela = montar();
    const aba = tela.root.findAll((no) => no.props.accessibilityRole === 'tab' && no.props.accessibilityLabel === 'Início')[0];
    expect(aba.props.accessibilityState).toEqual({ selected: true });
  });

  it('RN-20 + CAR-1: a letra do rodízio, o que o app já sabe e os alvos', () => {
    const tela = montar();
    expect(temTexto(tela, 'Treino de hoje')).toBe(true);
    expect(titulo(tela)).toBe('Treino A, Peito e tríceps, 2 exercícios, cerca de 22 minutos');
    expect(temTexto(tela, 'Supino reto sobe para 42,5 kg')).toBe(true);
    expect(temTexto(tela, 'Você fechou 12 repetições nas quatro séries da última vez.')).toBe(true);
    expect(temTexto(tela, '4 × 8–12 · 42,5 kg')).toBe(true);
    expect(temTexto(tela, '3 × 12–15 · 12 kg')).toBe(true);
    expect(temTexto(tela, 'Começar treino')).toBe(true);
  });

  it('RN-22: outra letra hoje troca o card, e o começar usa a escolhida', () => {
    const tela = montar();
    expect(tocavel(tela, 'Treino A, Peito e tríceps, o da vez no rodízio').props.accessibilityState).toEqual({ checked: true });
    tocar(tela, 'Treino B, Costas e bíceps');
    expect(titulo(tela)).toBe('Treino B, Costas e bíceps, 1 exercício, cerca de 11 minutos');
    expect(temTexto(tela, 'Supino reto sobe para 42,5 kg')).toBe(false);
    act(() => botaoComTexto(tela, 'Começar treino').props.onPress());
    expect(comecar).toHaveBeenCalledWith('B');
    expect(router.push).toHaveBeenCalledWith('/treino/ativo');
  });

  it('RN-21: terça não é dia do plano → descanso, e treinar mesmo assim (sem relevo)', () => {
    jest.setSystemTime(TERCA);
    const tela = montar();
    expect(temTexto(tela, 'Bom dia, Jotinha')).toBe(true);
    expect(temTexto(tela, 'Dia de descanso')).toBe(true);
    expect(temTexto(tela, 'Recuperar também é treino.')).toBe(true);
    expect(temTexto(tela, 'Hoje você faz')).toBe(false);
    expect(botaoComTexto(tela, 'Treinar mesmo assim').props.variante).toBe('secundario');
  });

  it('treino do dia já feito: diz qual foi, e a letra já é a próxima', () => {
    sessoes = [S_A, S_C, fechada('sessao-hoje', 'A', new Date(2026, 9, 5, 19).getTime(), series('supino-reto-barra', 4, 8, 42.5))];
    const tela = montar();
    expect(temTexto(tela, 'Treino de hoje feito')).toBe(true);
    expect(temTexto(tela, 'Você fez o A. Bom descanso.')).toBe(true);
    expect(titulo(tela)).toBe('Treino B, Costas e bíceps, 1 exercício, cerca de 11 minutos');
    expect(botaoComTexto(tela, 'Treinar mesmo assim').props.variante).toBe('secundario');
  });

  it('RN-31: com sessão aberta, retomar a letra dela — e a troca de letra some', () => {
    sessao = { treinoId: 'B', inicioMs: SEGUNDA - 600_000, fimMs: null, registradas: [], indiceExercicio: 0, indiceSerie: 0, trocas: {} };
    const tela = montar();
    expect(temTexto(tela, 'Treino em andamento')).toBe(true);
    expect(titulo(tela)).toBe('Treino B, Costas e bíceps, 1 exercício, cerca de 11 minutos');
    expect(tela.root.findAll((no) => no.props.accessibilityRole === 'radio')).toHaveLength(0);
    act(() => botaoComTexto(tela, 'Retomar treino B').props.onPress());
    expect(comecar).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/treino/ativo');
  });
});

describe('Início · como está a minha constância', () => {
  it('o ano, a sequência e a semana', () => {
    const tela = montar();
    expect(temTexto(tela, '2 treinos em 12 meses')).toBe(true);
    // semana de 27/09 teve 2 de 3; a atual ainda não bateu: zero, com convite e sem bronca
    expect(temTexto(tela, 'Bata a meta desta semana para começar uma sequência.')).toBe(true);
    expect(contemTexto(tela, '0 de 3 na semana')).toBe(true);
    expect(temTexto(tela, 'Hoje, 5 de outubro')).toBe(true);
    expect(temTexto(tela, 'Nenhum treino neste dia.')).toBe(true);
  });

  it('o dia tocado mostra os treinos dele, abre o histórico, e as setas andam um dia', () => {
    const tela = montar();
    tocar(tela, '2 de outubro: 4 séries');
    expect(temTexto(tela, 'Sexta, 2 de outubro')).toBe(true);
    expect(temTexto(tela, 'Pernas')).toBe(true);
    expect(temTexto(tela, '4 séries · 2.400 kg')).toBe(true);
    tocar(tela, 'Treino C, Pernas, 4 séries · 2.400 kg');
    expect(router.push).toHaveBeenCalledWith('/historico/sessao-c');

    tocar(tela, 'Próximo dia');
    expect(temTexto(tela, 'Sábado, 3 de outubro')).toBe(true);
    tocar(tela, 'Próximo dia');
    tocar(tela, 'Próximo dia');
    expect(temTexto(tela, 'Hoje, 5 de outubro')).toBe(true);
    // depois de hoje não há dia: a seta da frente apaga
    expect(tela.root.findAll((no) => no.props.accessibilityLabel === 'Próximo dia' && 'disabled' in no.props)[0].props.disabled).toBe(true);
    tocar(tela, 'Dia anterior');
    expect(temTexto(tela, 'Domingo, 4 de outubro')).toBe(true);
  });

  it('histórico vazio: o ano inteiro vazio, a frase do primeiro quadrado, e nada para tocar', () => {
    sessoes = [];
    const tela = montar();
    expect(temTexto(tela, 'Seu primeiro treino acende o primeiro quadrado.')).toBe(true);
    expect(temTexto(tela, 'Nenhum treino neste dia.')).toBe(false);
    expect(tela.root.findAll((no) => no.props.accessibilityLabel === 'Hoje, 5 de outubro: sem treino').length).toBeGreaterThan(0);
    expect(tela.root.findAll((no) => no.props.accessibilityRole === 'button' && / sem treino$/.test(no.props.accessibilityLabel ?? ''))).toHaveLength(0);
  });

  it('☠️ a tela fica montada embaixo do treino: o relógio é relido no foco, e o treino novo entra', () => {
    const tela = montar();
    expect(contemTexto(tela, '0 de 3 na semana')).toBe(true);
    // 1 h depois: o treino fechou com o Início montado embaixo da pilha
    jest.setSystemTime(SEGUNDA + 3_600_000);
    sessoes = [S_A, S_C, fechada('sessao-noite', 'A', SEGUNDA + 3_000_000, series('supino-reto-barra', 4, 8, 42.5))];
    act(() => tela.update(<Inicio />));
    expect(contemTexto(tela, '0 de 3 na semana')).toBe(true); // ainda com o relógio da montagem
    act(() => mockFocos.forEach((voltarAoFoco) => voltarAoFoco()));
    expect(contemTexto(tela, '1 de 3 na semana')).toBe(true);
    expect(temTexto(tela, '3 treinos em 12 meses')).toBe(true);
  });
});

describe('Heatmap', () => {
  it('RN-50: 53 × 7, o futuro fora do toque, e um rótulo por mês', () => {
    const colunas = calendarioDoHeatmap([S_A, S_C], SEGUNDA);
    const aoSelecionar = jest.fn();
    const tela = montar(<Heatmap colunas={colunas} selecionado="2026-10-05" aoSelecionar={aoSelecionar} />);
    const celulas = tela.root.findAll((no) => no.props.accessibilityRole === 'button' && typeof no.props.onPress === 'function');
    expect(celulas).toHaveLength(53 * 7 - 5); // de terça a sábado ainda não chegaram
    expect(celulas.find((c) => c.props.accessibilityLabel === 'Hoje, 5 de outubro: sem treino')?.props.accessibilityState)
      .toEqual({ selected: true });
    expect(celulas.some((c) => c.props.accessibilityLabel === '30 de setembro: 7 séries')).toBe(true);
    // a grade pega o outubro do ano passado: aí o rótulo diz o ano
    expect(celulas.some((c) => /^\d+ de outubro de 2025: sem treino$/.test(c.props.accessibilityLabel))).toBe(true);
    const meses = tela.root.findAllByType(Text).map(textoDe).filter((t) => /^[a-z]{3}$/.test(t) && !['seg', 'qua', 'sex'].includes(t));
    expect(meses).toEqual(['out', 'nov', 'dez', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out']);
    act(() => celulas[0].props.onPress());
    expect(aoSelecionar).toHaveBeenCalledWith(colunas[0][0].data);
  });

  it('RN-52: o dia do recorde diz "recorde" e é o único quadrado em ouro', () => {
    const recorde = fechada('sessao-r', 'A', new Date(2026, 9, 2, 8).getTime(), series('supino-reto-barra', 4, 8, 45));
    const tela = montar(<Heatmap colunas={calendarioDoHeatmap([S_A, recorde], SEGUNDA)} selecionado={null} />);
    const emOuro = tela.root.findAll((no) => typeof no.type === 'string' && JSON.stringify(no.props.style ?? null).includes('#FFE657'));
    expect(emOuro).toHaveLength(1);
    expect(tela.root.findAll((no) => no.props.accessibilityLabel === '2 de outubro: 4 séries, recorde').length).toBeGreaterThan(0);
  });
});
