import { EXERCICIOS, alternativasDoMesmoPadrao } from '@/data/exercicios';
import { formatarKg, formatarMilhar, formatarTempo } from '@/lib/formato';
import {
  arredondarParaAnilha, classificarVolume, melhor1RM, proximoAlvo,
  sugerirDeload, tonelagem, umRepMaximo, volumeSemanal,
  type Exercicio, type SerieRegistrada,
} from '..';

/** Atalho para montar uma série registrada. */
const serie = (reps: number, cargaKg: number, indice = 0): SerieRegistrada =>
  ({ exercicioId: 'x', indice, reps, cargaKg, foiAlvo: true });

const FAIXA = { min: 8, max: 12 };

describe('CAR-1 · dupla progressão', () => {
  it('fecha o topo da faixa em todas as séries → a carga sobe um incremento e as reps voltam ao piso', () => {
    const alvos = proximoAlvo({
      ultimaSessao: [serie(12, 60, 0), serie(12, 60, 1), serie(12, 60, 2)],
      faixa: FAIXA, cargaAtualKg: 60, incrementoKg: 2.5, series: 3,
    });
    expect(alvos).toHaveLength(3);
    expect(alvos.every((a) => a.cargaKg === 62.5 && a.reps === 8)).toBe(true);
    expect(alvos[0].origem).toBe('progressao');
  });

  it('não fechou a faixa → mesma carga, e cada série mira uma repetição a mais', () => {
    const alvos = proximoAlvo({
      ultimaSessao: [serie(12, 60, 0), serie(12, 60, 1), serie(10, 60, 2)],
      faixa: FAIXA, cargaAtualKg: 60, incrementoKg: 2.5, series: 3,
    });
    expect(alvos.map((a) => a.reps)).toEqual([12, 12, 11]);
    expect(alvos.every((a) => a.cargaKg === 60)).toBe(true);
  });

  it('nunca passa do topo da faixa', () => {
    const alvos = proximoAlvo({
      ultimaSessao: [serie(12, 60, 0), serie(11, 60, 1)],
      faixa: FAIXA, cargaAtualKg: 60, incrementoKg: 2.5, series: 2,
    });
    expect(alvos.map((a) => a.reps)).toEqual([12, 12]);
  });

  it('série faltando não conta como faixa fechada — senão a carga subiria por um treino incompleto', () => {
    const alvos = proximoAlvo({
      ultimaSessao: [serie(12, 60, 0), serie(12, 60, 1)],
      faixa: FAIXA, cargaAtualKg: 60, incrementoKg: 2.5, series: 3,
    });
    expect(alvos[0].origem).toBe('repetir');
    expect(alvos[0].cargaKg).toBe(60);
  });

  it('CAR-2 · sem histórico o campo ainda vem preenchido: carga do plano, piso da faixa', () => {
    const alvos = proximoAlvo({
      ultimaSessao: [], faixa: FAIXA, cargaAtualKg: 40, incrementoKg: 2.5, series: 2,
    });
    expect(alvos.map((a) => [a.cargaKg, a.reps, a.origem]))
      .toEqual([[40, 8, 'inicial'], [40, 8, 'inicial']]);
  });

  it('a carga sempre cai num múltiplo de anilha — academia não tem meia anilha', () => {
    expect(arredondarParaAnilha(57, 5)).toBe(55);
    expect(arredondarParaAnilha(61.3, 2.5)).toBe(62.5);
    expect(arredondarParaAnilha(30, 0)).toBe(30);
  });
});

describe('CAR-3 · deload', () => {
  it('duas sessões seguidas falhando o piso na mesma carga → sugere −10%', () => {
    const s = sugerirDeload({
      ultimasSessoes: [[serie(6, 60)], [serie(7, 60)]],
      faixa: FAIXA, cargaAtualKg: 60, incrementoKg: 2.5,
    });
    expect(s).toEqual({ cargaKg: 55, reps: 8, origem: 'deload' });
  });

  it('uma sessão ruim só não dispara nada — um dia ruim não é tendência', () => {
    expect(sugerirDeload({
      ultimasSessoes: [[serie(6, 60)], [serie(9, 60)]],
      faixa: FAIXA, cargaAtualKg: 60, incrementoKg: 2.5,
    })).toBeNull();
  });

  it('some depois de duas recusas — sugere, não impõe', () => {
    expect(sugerirDeload({
      ultimasSessoes: [[serie(6, 60)], [serie(6, 60)]],
      faixa: FAIXA, cargaAtualKg: 60, incrementoKg: 2.5, recusas: 2,
    })).toBeNull();
  });
});

describe('CAR-5 / CAR-7 · força', () => {
  it('1RM estimado por Epley', () => {
    expect(umRepMaximo(100, 10)).toBeCloseTo(133.33, 2);
    expect(umRepMaximo(100, 1)).toBe(100);
  });

  it('não explode com entrada degenerada', () => {
    expect(umRepMaximo(100, 0)).toBe(0);
    expect(umRepMaximo(0, 10)).toBe(0);
  });

  it('o recorde é a melhor série, não a última', () => {
    expect(Math.round(melhor1RM([serie(10, 60), serie(5, 80)]))).toBe(93);
  });

  it('tonelagem é a soma de carga × reps', () => {
    expect(tonelagem([serie(10, 60), serie(8, 60)])).toBe(1080);
    expect(tonelagem([])).toBe(0);
  });
});

describe('CAR-4 · volume semanal', () => {
  it('classifica contra a faixa de 10 a 20, com os limites dentro', () => {
    expect(classificarVolume(9)).toBe('abaixo');
    expect(classificarVolume(10)).toBe('na-faixa');
    expect(classificarVolume(20)).toBe('na-faixa');
    expect(classificarVolume(21)).toBe('acima');
  });

  it('agrupa por grupo muscular, ordena por volume e ignora exercício desconhecido', () => {
    const mapa = new Map<string, Exercicio>([
      ['sup', { grupo: 'peito' } as Exercicio],
      ['rem', { grupo: 'costas' } as Exercicio],
    ]);
    const series = ['sup', 'sup', 'rem', 'desconhecido']
      .map((exercicioId, i) => ({ ...serie(10, 50, i), exercicioId }));
    expect(volumeSemanal(series, mapa).map((v) => [v.grupo, v.series]))
      .toEqual([['peito', 2], ['costas', 1]]);
  });
});

describe('CAR-9 · troca por padrão de movimento', () => {
  it('oferece variações do mesmo padrão, e nunca o próprio exercício', () => {
    const alternativas = alternativasDoMesmoPadrao('supino-reto-barra');
    expect(alternativas.length).toBeGreaterThan(0);
    expect(alternativas.every((e) => e.padrao === 'empurrar-horizontal')).toBe(true);
    expect(alternativas.map((e) => e.id)).not.toContain('supino-reto-barra');
  });

  it('exercício inexistente devolve lista vazia em vez de quebrar', () => {
    expect(alternativasDoMesmoPadrao('nao-existe')).toEqual([]);
  });
});

describe('catálogo', () => {
  it('cobre os 7 padrões de movimento e não tem id repetido', () => {
    expect(new Set(EXERCICIOS.map((e) => e.padrao)).size).toBe(7);
    expect(new Set(EXERCICIOS.map((e) => e.id)).size).toBe(EXERCICIOS.length);
  });

  it('CAR-6 · descanso padrão: 90 s composto, 60 s isolado', () => {
    const composto = EXERCICIOS.find((e) => e.composto)!;
    const isolado = EXERCICIOS.find((e) => !e.composto)!;
    expect(composto.descansoSegundos).toBe(90);
    expect(isolado.descansoSegundos).toBe(60);
  });
});

describe('formatação em português', () => {
  it('usa vírgula decimal e não inventa casa', () => {
    expect(formatarKg(62.5)).toBe('62,5');
    expect(formatarKg(60)).toBe('60');
  });

  it('separa milhar com ponto', () => {
    expect(formatarMilhar(12345)).toBe('12.345');
    expect(formatarMilhar(980)).toBe('980');
  });

  it('formata o cronômetro', () => {
    expect(formatarTempo(95)).toBe('1:35');
    expect(formatarTempo(90)).toBe('1:30');
    expect(formatarTempo(-5)).toBe('0:00');
  });
});
