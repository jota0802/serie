import {
  calendarioDoHeatmap, chaveDoDia, diasComRecorde, nivelDoDia, rotulosDosMeses, semanasSeguidasNaMeta, sessoesDoDia,
  treinosNoUltimoAno,
} from '@/domain/calendario';
import type { SessaoFechada } from '@/domain/historico';
import type { SerieRegistrada } from '@/domain/types';

// Segunda, 5 de outubro de 2026, 21h (fuso da máquina do teste).
const AGORA = new Date(2026, 9, 5, 21, 0, 0).getTime();
const dia = (ano: number, mes: number, d: number, h = 19) => new Date(ano, mes, d, h, 0, 0).getTime();

const series = (n: number, exercicioId = 'supino-reto-barra', reps = 10, cargaKg = 40): SerieRegistrada[] =>
  Array.from({ length: n }, (_, indice) => ({ exercicioId, indice, reps, cargaKg, foiAlvo: true }));

const sessao = (id: string, fimMs: number, s: SerieRegistrada[], treinoId = 'A'): SessaoFechada => ({
  id, treinoId, inicioMs: fimMs - 3_600_000, fimMs, series: s,
});

describe('RN-51 · intensidade do dia pelo número de séries', () => {
  it('faixas fixas: 0 · 1–8 · 9–15 · 16–24 · 25+', () => {
    expect([0, 1, 8, 9, 15, 16, 24, 25, 60].map(nivelDoDia)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe('RN-50 · o heatmap do ano', () => {
  const colunas = calendarioDoHeatmap([], AGORA);

  it('53 colunas de 7 dias, domingo a sábado', () => {
    expect(colunas).toHaveLength(53);
    for (const c of colunas) {
      expect(c).toHaveLength(7);
      expect(new Date(c[0].inicioMs).getDay()).toBe(0);
      expect(new Date(c[6].inicioMs).getDay()).toBe(6);
    }
  });

  it('hoje está na última coluna, e o que vem depois é futuro (não "dia sem treino")', () => {
    const ultima = colunas[52];
    const hoje = ultima.find((d) => d.hoje)!;
    expect(hoje.data).toBe('2026-10-05');
    expect(ultima.filter((d) => d.futuro).map((d) => d.data)).toEqual(['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10']);
    expect(colunas.slice(0, 52).flat().some((d) => d.futuro)).toBe(false);
  });

  it('dias consecutivos, sem pular nem repetir (inclusive na troca de horário)', () => {
    const datas = colunas.flat().map((d) => d.data);
    expect(new Set(datas).size).toBe(53 * 7);
    for (let i = 1; i < datas.length; i++) expect(datas[i] > datas[i - 1]).toBe(true);
  });

  it('o dia soma as séries de todas as sessões dele', () => {
    const cal = calendarioDoHeatmap([sessao('a', dia(2026, 9, 2, 8), series(10)), sessao('b', dia(2026, 9, 2, 20), series(8))], AGORA);
    const sexta = cal.flat().find((d) => d.data === '2026-10-02')!;
    expect(sexta).toMatchObject({ series: 18, sessoes: 2, nivel: 3 });
  });

  it('RN-54 · treino às 23h30 é do dia em que aconteceu (fuso do aparelho)', () => {
    expect(chaveDoDia(dia(2026, 9, 5, 23) + 30 * 60_000)).toBe('2026-10-05');
  });
});

describe('RN-52 · o ouro dos recordes', () => {
  it('superou o melhor 1RM anterior → dia com recorde', () => {
    const s1 = sessao('1', dia(2026, 8, 1), series(4, 'supino-reto-barra', 10, 40));
    const s2 = sessao('2', dia(2026, 8, 5), series(4, 'supino-reto-barra', 10, 42.5));
    expect([...diasComRecorde([s1, s2])]).toEqual(['2026-09-05']);
  });

  it('a primeira vez num exercício não é recorde: não havia o que bater', () => {
    expect(diasComRecorde([sessao('1', dia(2026, 8, 1), series(4))]).size).toBe(0);
  });

  it('igualar não é bater', () => {
    const s1 = sessao('1', dia(2026, 8, 1), series(4));
    const s2 = sessao('2', dia(2026, 8, 5), series(4));
    expect(diasComRecorde([s2, s1]).size).toBe(0);
  });
});

describe('RN-53 · sequência de semanas na meta', () => {
  // semanas (domingo): 20/09, 27/09, 04/10 (a de hoje)
  const tres = (inicio: number[]) => inicio.map((d, i) => sessao(`s${d}-${i}`, dia(2026, 8, d), series(10)));

  it('conta semanas seguidas que bateram a meta', () => {
    const sessoes = [...tres([21, 23, 25]), ...tres([28, 30])].concat([sessao('x', dia(2026, 9, 2), series(10))]);
    // semana de 20/09: 3 treinos · semana de 27/09: 3 treinos · semana atual: 0
    expect(semanasSeguidasNaMeta(sessoes, 3, AGORA)).toBe(2);
  });

  it('a semana atual entra só depois de bater a meta, e não quebra a sequência antes disso', () => {
    const sessoes = [sessao('a', dia(2026, 8, 28), series(5)), sessao('b', dia(2026, 8, 30), series(5)), sessao('c', dia(2026, 9, 5, 8), series(5))];
    expect(semanasSeguidasNaMeta(sessoes, 2, AGORA)).toBe(1);
    expect(semanasSeguidasNaMeta([...sessoes, sessao('d', dia(2026, 9, 5, 9), series(5))], 2, AGORA)).toBe(2);
  });

  it('semana abaixo da meta quebra a sequência; meta 0 não tem sequência', () => {
    const sessoes = [sessao('a', dia(2026, 8, 14), series(5)), sessao('b', dia(2026, 8, 28), series(5))];
    expect(semanasSeguidasNaMeta(sessoes, 1, AGORA)).toBe(1);
    expect(semanasSeguidasNaMeta(sessoes, 0, AGORA)).toBe(0);
  });
});

describe('Rótulos, dia e ano', () => {
  it('um rótulo por mês, na primeira coluna em que ele aparece (o mês de hoje pode aparecer nas duas pontas)', () => {
    const rotulos = rotulosDosMeses(calendarioDoHeatmap([], AGORA));
    expect(rotulos.map((r) => r.rotulo)).toEqual(['out', 'nov', 'dez', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out']);
    for (let i = 1; i < rotulos.length; i++) expect(rotulos[i].coluna).toBeGreaterThan(rotulos[i - 1].coluna);
  });

  it('as sessões de um dia, em ordem', () => {
    const a = sessao('a', dia(2026, 9, 2, 20), series(1));
    const b = sessao('b', dia(2026, 9, 2, 8), series(1));
    expect(sessoesDoDia([a, b, sessao('c', dia(2026, 9, 3), series(1))], '2026-10-02').map((s) => s.id)).toEqual(['b', 'a']);
  });

  it('treinos nos últimos 365 dias', () => {
    const dentro = sessao('a', dia(2025, 9, 7), series(1));
    const fora = sessao('b', dia(2025, 9, 1), series(1));
    expect(treinosNoUltimoAno([dentro, fora], AGORA)).toBe(1);
  });
});
