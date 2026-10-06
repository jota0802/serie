import {
  agruparPorMes, diaCurto, diaPorExtenso, falaDaSerie, hora, lerNumero, mesPorExtenso, minutosDoTreino,
  nomeDoTreino, recordesPorSessao, resumoDaSessao, seriesPorExercicio, textoDaCarga, textoDaSerie,
} from '@/components/formato-do-historico';
import { chaveDoDia, diasComRecorde } from '@/domain/calendario';
import { corrigirSerie, type SessaoFechada } from '@/domain/historico';
import type { SerieRegistrada, Treino } from '@/domain/types';

// Datas no fuso da máquina do teste: o app formata no fuso do aparelho (RN-54).
const em = (mes: number, dia: number, h = 19, min = 0, ano = 2026) => new Date(ano, mes, dia, h, min, 0).getTime();

const series = (n: number, exercicioId = 'supino-reto-barra', reps = 10, cargaKg = 40): SerieRegistrada[] =>
  Array.from({ length: n }, (_, indice) => ({ exercicioId, indice, reps, cargaKg, foiAlvo: true }));

const sessao = (id: string, fimMs: number, s: SerieRegistrada[], minutos = 60, treinoId = 'A'): SessaoFechada => ({
  id, treinoId, inicioMs: fimMs - minutos * 60_000, fimMs, series: s,
});

describe('Datas da lista e do detalhe — sem Intl, no fuso do aparelho', () => {
  it('"seg, 5 out", e o sábado com acento', () => {
    expect(diaCurto(em(9, 5))).toBe('seg, 5 out');
    expect(diaCurto(em(9, 4))).toBe('dom, 4 out');
    expect(diaCurto(em(9, 10))).toBe('sáb, 10 out');
  });

  it('por extenso no detalhe; de outro ano, o ano aparece', () => {
    expect(diaPorExtenso(em(9, 5), em(9, 6))).toBe('segunda, 5 de outubro');
    expect(diaPorExtenso(em(11, 28, 19, 0, 2025), em(9, 6))).toBe('domingo, 28 de dezembro de 2025');
  });

  it('hora com dois dígitos e o mês com maiúscula', () => {
    expect(hora(em(9, 5, 9, 5))).toBe('09:05');
    expect(mesPorExtenso(em(2, 1))).toBe('Março de 2026');
  });

  it('minutos como no resumo: arredondados, nunca menos de 1', () => {
    expect(minutosDoTreino({ inicioMs: em(9, 5, 19, 0), fimMs: em(9, 5, 19, 52) + 20_000 })).toBe(52);
    expect(minutosDoTreino({ inicioMs: em(9, 5, 19, 0), fimMs: em(9, 5, 19, 0) + 10_000 })).toBe(1);
  });
});

describe('A lista: por mês, do mais novo ao mais antigo', () => {
  it('agrupa pelo mês do fim e ordena mesmo que a lista venha fora de ordem', () => {
    const meses = agruparPorMes([
      sessao('set', em(8, 30), series(1)),
      sessao('out-5', em(9, 5), series(1)),
      sessao('dez-2025', em(11, 31, 10, 0, 2025), series(1)),
      sessao('out-1', em(9, 1), series(1)),
    ]);
    expect(meses.map((m) => m.titulo)).toEqual(['Outubro de 2026', 'Setembro de 2026', 'Dezembro de 2025']);
    expect(meses[0].data.map((s) => s.id)).toEqual(['out-5', 'out-1']);
  });

  it('a linha: séries, volume (tonelagem) e duração; só peso do corpo mostra as reps, não "0 kg"', () => {
    expect(resumoDaSessao(sessao('a', em(9, 5), series(18, 'supino-reto-barra', 6, 40), 52))).toBe('18 séries · 4.320 kg · 52 min');
    expect(resumoDaSessao(sessao('b', em(9, 5), series(1, 'barra-fixa', 8, 0), 30))).toBe('1 série · 8 reps · 30 min');
  });

  it('letra que saiu do plano vira "Treino X"', () => {
    const porId = new Map<string, Treino>([['A', { id: 'A', nome: 'Peito e tríceps', ordem: 0, itens: [] }]]);
    expect(nomeDoTreino('A', porId)).toBe('Peito e tríceps');
    expect(nomeDoTreino('D', porId)).toBe('Treino D');
  });
});

describe('O selo de recorde, por sessão (CAR-5 · RN-52)', () => {
  it('a primeira vez num exercício não é recorde; superar o melhor anterior é', () => {
    const r = recordesPorSessao([
      sessao('1', em(9, 1), series(3, 'supino-reto-barra', 10, 40)),
      sessao('2', em(9, 3), series(3, 'supino-reto-barra', 10, 42.5)),
    ]);
    expect(r.has('1')).toBe(false);
    expect(r.get('2')).toEqual([{ exercicioId: 'supino-reto-barra', novo: 42.5 * (1 + 10 / 30), antes: 40 * (1 + 10 / 30) }]);
  });

  it('igualar o melhor não é recorde, e a ordem é a do tempo, não a da lista', () => {
    const r = recordesPorSessao([
      sessao('depois', em(9, 3), series(2, 'remada-curvada', 10, 50)),
      sessao('antes', em(9, 1), series(2, 'remada-curvada', 10, 50)),
    ]);
    expect(r.size).toBe(0);
  });

  it('dois treinos no mesmo dia: só o que bateu leva o selo (o heatmap marca o dia)', () => {
    const lista = [
      sessao('base', em(9, 1), series(2, 'agachamento-livre', 8, 70)),
      sessao('manha', em(9, 5, 8), series(2, 'rosca-direta', 10, 25)),
      sessao('noite', em(9, 5, 20), series(2, 'agachamento-livre', 8, 75)),
    ];
    const r = recordesPorSessao(lista);
    expect([...r.keys()]).toEqual(['noite']);
    expect(diasComRecorde(lista)).toEqual(new Set(['2026-10-05']));
  });

  it('peso do corpo (carga 0) não tem 1RM, então não acende o ouro', () => {
    expect(recordesPorSessao([
      sessao('1', em(9, 1), series(3, 'barra-fixa', 6, 0)),
      sessao('2', em(9, 3), series(3, 'barra-fixa', 9, 0)),
    ]).size).toBe(0);
  });

  it('é a mesma régua do heatmap: os dias dos treinos com selo são os dias de recorde', () => {
    const lista = [
      sessao('1', em(8, 20), [...series(3, 'supino-reto-barra', 10, 40), ...series(3, 'remada-curvada', 10, 50)]),
      sessao('2', em(8, 24), series(3, 'supino-reto-barra', 12, 40)),
      sessao('3', em(8, 27), series(3, 'remada-curvada', 8, 50)),
      sessao('4', em(9, 2), [...series(3, 'supino-reto-barra', 8, 42.5), ...series(3, 'remada-curvada', 10, 52.5)]),
    ];
    const dias = new Set([...recordesPorSessao(lista).keys()].map((id) => chaveDoDia(lista.find((s) => s.id === id)!.fimMs)));
    expect(dias).toEqual(diasComRecorde(lista));
  });
});

describe('O detalhe: séries por exercício e a correção na linha (RN-40)', () => {
  it('agrupa na ordem em que os exercícios foram feitos, guardando a posição de cada série', () => {
    const lista = [...series(2, 'supino-reto-barra'), ...series(1, 'crossover'), ...series(1, 'supino-reto-barra')];
    const grupos = seriesPorExercicio(lista);
    expect(grupos.map((g) => g.exercicioId)).toEqual(['supino-reto-barra', 'crossover']);
    expect(grupos[0].series.map((s) => s.posicao)).toEqual([0, 1, 3]);
  });

  it('"10 × 40 kg"; peso do corpo sem carga não vira multiplicação', () => {
    expect(textoDaSerie({ reps: 10, cargaKg: 42.5 }, false)).toBe('10 × 42,5 kg');
    expect(textoDaSerie({ reps: 10, cargaKg: 0 }, true)).toBe('10 reps · peso do corpo');
    expect(textoDaSerie({ reps: 8, cargaKg: 10 }, true)).toBe('8 × 10 kg');
    expect(falaDaSerie({ reps: 1, cargaKg: 40 }, false)).toBe('1 repetição com 40 quilos');
  });

  it('o campo da carga nasce com o valor exato: salvar sem mexer não arredonda nada', () => {
    expect(textoDaCarga(42.25)).toBe('42,25');
    expect(textoDaCarga(40)).toBe('40');
    expect(lerNumero(textoDaCarga(42.25))).toBe(42.25);
  });

  it('aceita vírgula e ponto; vazio e lixo viram NaN, nunca 0', () => {
    expect(['10', ' 12 ', '40,5', '40.5', ',5', '40,'].map(lerNumero)).toEqual([10, 12, 40.5, 40.5, 0.5, 40]);
    for (const lixo of ['', '  ', 'abc', '-5', '1e3', '4,0,0', '10 kg']) expect(lerNumero(lixo)).toBeNaN();
  });

  it('campo apagado por engano: o domínio recusa com o motivo, em vez de gravar 0 reps', () => {
    const treino = sessao('a', em(9, 5), series(2));
    expect(corrigirSerie(treino, 0, { reps: lerNumero('') })).toEqual({ ok: false, motivo: 'Repetições: um número inteiro de 0 a 200.' });
    expect(corrigirSerie(treino, 0, { cargaKg: lerNumero('40,5') })).toMatchObject({ ok: true });
  });
});
