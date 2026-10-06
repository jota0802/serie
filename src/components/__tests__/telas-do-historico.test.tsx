/**
 * As telas do histórico e o painel do X do Treino ativo, montadas de verdade (react-test-renderer),
 * com o roteador, o histórico, o plano e a sessão simulados. Exercita os fluxos que no aparelho
 * são toques: corrigir na linha, a recusa com motivo, tirar série, apagar treino, terminar e
 * descartar o treino — e o voltar do Android, que recua um passo de cada vez.
 */
import { router, useLocalSearchParams } from 'expo-router';
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';

import { PainelDeEncerrar } from '@/components/painel-de-encerrar';
import type { SessaoFechada } from '@/domain/historico';
import type { SerieRegistrada } from '@/domain/types';

import DetalheDoTreino from '../../app/historico/[id]';
import Historico from '../../app/historico/index';
import TreinoAtivo from '../../app/treino/ativo';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: jest.fn(() => ({ id: 'sessao-2' })),
}));

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual<{ default: object }>('react-native-safe-area-context/jest/mock').default);

// O voltar do Android: guarda os ouvintes e chama do último para o primeiro, como o sistema.
jest.mock('react-native/Libraries/Utilities/BackHandler', () => {
  const ouvintes: (() => boolean | null | undefined)[] = [];
  return {
    __esModule: true,
    default: {
      exitApp: jest.fn(),
      addEventListener: (_evento: string, ouvinte: () => boolean) => {
        ouvintes.push(ouvinte);
        return { remove: () => ouvintes.splice(ouvintes.lastIndexOf(ouvinte), 1) };
      },
      mockVoltar: () => [...ouvintes].reverse().some((o) => o()),
    },
  };
});

// O histórico como uma loja pequena: corrigir e apagar mudam a lista e a tela redesenha.
const mockLoja = {
  sessoes: [] as SessaoFechada[],
  pendentes: 0,
  ouvintes: new Set<() => void>(),
  definir(sessoes: SessaoFechada[]) {
    this.sessoes = sessoes;
    this.ouvintes.forEach((ouvinte) => ouvinte());
  },
};
const mockCorrigirSessao = jest.fn((corrigida: SessaoFechada) =>
  mockLoja.definir(mockLoja.sessoes.map((s) => (s.id === corrigida.id ? corrigida : s))));
const mockApagarSessao = jest.fn((id: string) => mockLoja.definir(mockLoja.sessoes.filter((s) => s.id !== id)));

jest.mock('@/estado/historico', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useHistorico: () => {
      const sessoes = React.useSyncExternalStore(
        (ouvinte: () => void) => {
          mockLoja.ouvintes.add(ouvinte);
          return () => mockLoja.ouvintes.delete(ouvinte);
        },
        () => mockLoja.sessoes,
      );
      return {
        sessoes, carregado: true, pendentes: mockLoja.pendentes,
        corrigirSessao: mockCorrigirSessao, apagarSessao: mockApagarSessao,
      };
    },
  };
});

jest.mock('@/estado/perfil', () => {
  const treinos = [{ id: 'A', nome: 'Peito e tríceps', ordem: 0, itens: [] }];
  return { usePlano: () => ({ treinos, porId: new Map(treinos.map((t) => [t.id, t])), dias: [] }) };
});

// A sessão em andamento para o Treino ativo (só o que a tela 11 lê).
const mockSessao = { atual: { registradas: [] as SerieRegistrada[], inicioMs: 0, indiceSerie: 0, indiceExercicio: 0 } };
const mockTerminarAgora = jest.fn(() => 'salvo');
const mockAbandonar = jest.fn();
jest.mock('@/estado/sessao', () => ({
  useSessao: () => ({ sessao: mockSessao.atual, iniciarSerie: jest.fn(), terminarAgora: mockTerminarAgora, abandonar: mockAbandonar }),
}));
jest.mock('@/hooks/use-guarda-da-sessao', () => ({ useGuardaDaSessao: () => true }));
jest.mock('@/hooks/use-cronometro', () => ({ useCronometro: () => 0 }));
jest.mock('@/hooks/use-treino-com-troca', () => ({
  useTreinoComTroca: () => {
    const item = { exercicioId: 'supino-reto-barra', series: 3, faixa: { min: 8, max: 12 }, cargaKg: 40 };
    return {
      treino: { id: 'A', nome: 'Peito e tríceps', ordem: 0, itens: [item, { ...item, exercicioId: 'crossover' }] },
      item, exercicio: undefined, alvo: { cargaKg: 40, reps: 8, origem: 'repetir' }, alvos: [],
      feitasDoExercicio: [], proximoExercicio: undefined, ultimaVez: [], progresso: 0,
      semReferencia: false, baseDaEstimativa: undefined,
    };
  },
}));

const BackHandlerFalso = jest.requireMock<{ default: { mockVoltar: () => boolean } }>(
  'react-native/Libraries/Utilities/BackHandler',
).default;

// ---- ajudantes ------------------------------------------------------------------------------

const textoDe = (no: ReactTestInstance | string): string =>
  typeof no === 'string' ? no : no.children.map(textoDe).join('');

const tudo = (tela: ReactTestRenderer) => textoDe(tela.root);

function tocar(tela: ReactTestRenderer, rotulo: string) {
  const alvo = tela.root.findAll((n) => typeof n.props.onPress === 'function' && textoDe(n) === rotulo)[0];
  if (!alvo) throw new Error(`Nenhum botão "${rotulo}" na tela:\n${tudo(tela)}`);
  act(() => alvo.props.onPress());
}

/** A correção está aberta quando há campo de texto na tela (a linha virou os campos de reps e carga). */
const corrigindo = (tela: ReactTestRenderer) => tela.root.findAll((n) => n.type === TextInput).length > 0;

function digitar(tela: ReactTestRenderer, campo: string, texto: string) {
  const entrada = tela.root.findAll((n) => n.type === TextInput && n.props.accessibilityLabel === campo)[0];
  act(() => entrada.props.onChangeText(texto));
}

const montadas: ReactTestRenderer[] = [];
function montar(elemento: ReactElement) {
  let tela!: ReactTestRenderer;
  act(() => {
    tela = create(elemento);
  });
  montadas.push(tela);
  return tela;
}

// Desmonta tudo: senão os ouvintes do voltar de um teste vazam para o próximo.
afterEach(() => {
  act(() => montadas.splice(0).forEach((tela) => tela.unmount()));
});

const em = (dia: number, h: number, min = 0) => new Date(2026, 9, dia, h, min, 0).getTime();
const series = (exercicioId: string, reps: number[], cargaKg: number): SerieRegistrada[] =>
  reps.map((r, indice) => ({ exercicioId, indice, reps: r, cargaKg, foiAlvo: true }));

const ANTERIOR: SessaoFechada = {
  id: 'sessao-1', treinoId: 'A', inicioMs: em(1, 18), fimMs: em(1, 19), series: series('supino-reto-barra', [10, 10], 40),
};
// Segunda, 5/out, 19:00 às 19:52: supino com carga maior (recorde) e a flexão sem carga.
// Volume: 42,5 × (10 + 9) = 807,5 kg → "808 kg".
const DE_HOJE: SessaoFechada = {
  id: 'sessao-2', treinoId: 'A', inicioMs: em(5, 19), fimMs: em(5, 19, 52),
  series: [...series('supino-reto-barra', [10, 9], 42.5), ...series('flexao', [15], 0)],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockLoja.sessoes = [ANTERIOR, DE_HOJE];
  mockLoja.pendentes = 0;
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'sessao-2' });
});

// ---- a lista --------------------------------------------------------------------------------

describe('Histórico (lista)', () => {
  it('por mês, do mais novo ao mais antigo, com o selo de recorde só no treino que bateu', () => {
    mockLoja.pendentes = 1;
    const tela = montar(<Historico />);
    const texto = tudo(tela);
    expect(texto).toContain('Outubro de 2026');
    expect(texto).toContain('2 treinos');
    expect(texto.indexOf('seg, 5 out')).toBeLessThan(texto.indexOf('qui, 1 out'));
    expect(texto.match(/Recorde/g)).toHaveLength(1);
    expect(texto).toContain('3 séries · 808 kg · 52 min');
    expect(texto).toContain('1 treino aguardando conexão');
  });

  it('tocar no treino abre o detalhe dele', () => {
    const tela = montar(<Historico />);
    const linha = tela.root.findAll((n) => typeof n.props.onPress === 'function' && textoDe(n).includes('seg, 5 out'))[0];
    act(() => linha.props.onPress());
    expect(router.push).toHaveBeenCalledWith('/historico/sessao-2');
  });

  it('sem treino nenhum: o estado vazio, com o caminho para o treino de hoje', () => {
    mockLoja.sessoes = [];
    const tela = montar(<Historico />);
    expect(tudo(tela)).toContain('Nenhum treino concluído ainda');
    tocar(tela, 'Ver o treino de hoje');
    expect(router.dismissTo).toHaveBeenCalledWith('/hoje');
  });
});

// ---- o detalhe ------------------------------------------------------------------------------

describe('Detalhe do treino', () => {
  it('cabeçalho, os números de relance (sem tonelagem), o recorde em ouro e as séries por exercício', () => {
    const texto = tudo(montar(<DetalheDoTreino />));
    expect(texto).toContain('Treino A · Peito e tríceps');
    expect(texto).toContain('19:00 às 19:52');
    // Os mesmos números do resumo; sem cronômetro nas séries, a tensão não aparece.
    expect(texto).toContain('52minutos3séries34reps');
    expect(texto).not.toContain('tensão');
    // O total de kg levantado não é destaque (nem aparece) no detalhe.
    expect(texto).not.toContain('808 kg');
    expect(texto).toContain('Supino retoantes 53,356,7 kg');
    expect(texto).toContain('1RM estimado pela fórmula de Epley.');
    expect(texto).toContain('1ª10 × 42,5 kg');
    expect(texto).toContain('1ª15 reps · peso do corpo');
    expect(texto).toContain('Recordes e progresso se recalculam na hora.');
  });

  it('RN-40: corrige na linha — campo vazio é recusado com o motivo, e o número certo é salvo', () => {
    const tela = montar(<DetalheDoTreino />);
    tocar(tela, '1ª10 × 42,5 kg');
    const carga = tela.root.findAll((n) => n.type === TextInput && n.props.accessibilityLabel === 'Carga em quilos')[0];
    expect(carga.props.value).toBe('42,5');

    digitar(tela, 'Repetições', '');
    tocar(tela, 'Salvar');
    expect(tudo(tela)).toContain('Repetições: um número inteiro de 0 a 200.');
    expect(mockCorrigirSessao).not.toHaveBeenCalled();

    digitar(tela, 'Repetições', '8');
    digitar(tela, 'Carga em quilos', '40,5');
    tocar(tela, 'Salvar');
    const corrigida = mockCorrigirSessao.mock.calls[0][0];
    expect(corrigida.series[0]).toMatchObject({ reps: 8, cargaKg: 40.5, foiAlvo: false });
    expect(tudo(tela)).toContain('1ª8 × 40,5 kg');
    expect(corrigindo(tela)).toBe(false);
  });

  it('Salvar sem mexer em nada não reenvia o treino', () => {
    const tela = montar(<DetalheDoTreino />);
    tocar(tela, '2ª9 × 42,5 kg');
    tocar(tela, 'Salvar');
    expect(mockCorrigirSessao).not.toHaveBeenCalled();
    expect(corrigindo(tela)).toBe(false);
  });

  it('RN-42: tirar uma série pergunta antes; a única série do treino não sai sozinha', () => {
    const tela = montar(<DetalheDoTreino />);
    tocar(tela, '2ª9 × 42,5 kg');
    tocar(tela, 'Tirar esta série');
    expect(tudo(tela)).toContain('Tirar a 2ª série de supino reto?');
    tocar(tela, 'Tirar');
    expect(mockCorrigirSessao.mock.calls[0][0].series).toHaveLength(2);

    act(() => mockLoja.definir([{ ...DE_HOJE, series: series('supino-reto-barra', [10], 42.5) }]));
    tocar(tela, '1ª10 × 42,5 kg');
    expect(tudo(tela)).toContain('É a única série do treino. Para tirá-la, apague o treino.');
    expect(tudo(tela)).not.toContain('Tirar esta série');
  });

  it('apagar pergunta na tela, apaga e volta', () => {
    const tela = montar(<DetalheDoTreino />);
    tocar(tela, 'Apagar treino');
    expect(tudo(tela)).toContain('Apagar o treino de seg, 5 out?Some do aparelho e da nuvem.');
    tocar(tela, 'Apagar');
    expect(mockApagarSessao).toHaveBeenCalledWith('sessao-2');
    expect(router.back).toHaveBeenCalled();
  });

  it('o voltar do Android fecha a correção antes de sair da tela', () => {
    const tela = montar(<DetalheDoTreino />);
    tocar(tela, '1ª10 × 42,5 kg');
    expect(corrigindo(tela)).toBe(true);
    expect(tudo(tela)).toContain('1ª sérieCancelarSalvar');
    act(() => {
      expect(BackHandlerFalso.mockVoltar()).toBe(true);
    });
    expect(corrigindo(tela)).toBe(false);
    expect(BackHandlerFalso.mockVoltar()).toBe(false);
  });

  it('id que não existe mais: estado vazio com volta para a lista', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'sessao-apagada' });
    const tela = montar(<DetalheDoTreino />);
    expect(tudo(tela)).toContain('Esse treino não está mais aqui');
    tocar(tela, 'Ver o histórico');
    expect(router.dismissTo).toHaveBeenCalledWith('/historico');
  });
});

// ---- o X do Treino ativo --------------------------------------------------------------------

describe('Treino ativo: o X abre o painel em vez de descartar', () => {
  const comSeries = (n: number) => {
    mockSessao.atual = { ...mockSessao.atual, registradas: series('supino-reto-barra', Array(n).fill(10), 40) };
  };

  it('com série registrada, a ação primária é terminar e salvar (RN-30)', () => {
    comSeries(2);
    const tela = montar(<TreinoAtivo />);
    expect(tudo(tela)).not.toContain('Terminar o treino?');
    tocar(tela, '');  // o X não tem texto: é o único botão sem rótulo escrito
    expect(tudo(tela)).toContain('Você fez 2 de 6 séries.');
    tocar(tela, 'Terminar e salvar (2 séries)');
    expect(mockTerminarAgora).toHaveBeenCalled();
    expect(mockAbandonar).not.toHaveBeenCalled();
  });

  it('descartar pede confirmação (RN-32), e só então joga fora e volta ao Hoje', () => {
    comSeries(3);
    const tela = montar(<TreinoAtivo />);
    tocar(tela, '');
    tocar(tela, 'Descartar treino');
    expect(mockAbandonar).not.toHaveBeenCalled();
    expect(tudo(tela)).toContain('Descartar as 3 séries?Não dá para desfazer.');
    tocar(tela, 'Descartar');
    expect(router.dismissTo).toHaveBeenCalledWith('/hoje');
    expect(mockAbandonar).toHaveBeenCalled();
  });

  it('sem nenhuma série: sair sem salvar é um toque; continuar fecha o painel', () => {
    comSeries(0);
    const tela = montar(<TreinoAtivo />);
    tocar(tela, '');
    expect(tudo(tela)).toContain('Sair do treino?');
    expect(tudo(tela)).not.toContain('Descartar treino');
    tocar(tela, 'Continuar treinando');
    expect(tudo(tela)).not.toContain('Sair do treino?');
    tocar(tela, '');
    tocar(tela, 'Sair sem salvar');
    expect(mockAbandonar).toHaveBeenCalled();
    expect(mockTerminarAgora).not.toHaveBeenCalled();
  });

  it('com o painel aberto, a tela embaixo sai do leitor de tela', () => {
    comSeries(1);
    const tela = montar(<TreinoAtivo />);
    const escondida = () => tela.root.findAll((n) => n.props['aria-hidden'] === true && textoDe(n).includes('Iniciar série'));
    expect(escondida()).toHaveLength(0);
    tocar(tela, '');
    expect(escondida().length).toBeGreaterThan(0);
  });
});

describe('Painel de encerrar: o voltar do Android recua um passo de cada vez', () => {
  it('confirmação → painel → treino', () => {
    const aoContinuar = jest.fn();
    const tela = montar(
      <PainelDeEncerrar feitas={4} previstas={12} aoTerminar={jest.fn()} aoDescartar={jest.fn()} aoContinuar={aoContinuar} />,
    );
    tocar(tela, 'Descartar treino');
    act(() => {
      BackHandlerFalso.mockVoltar();
    });
    expect(tudo(tela)).toContain('Terminar o treino?');
    expect(aoContinuar).not.toHaveBeenCalled();
    act(() => {
      BackHandlerFalso.mockVoltar();
    });
    expect(aoContinuar).toHaveBeenCalled();
  });
});
