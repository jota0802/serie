import { EXERCICIOS_POR_ID } from '@/data/exercicios';
import { cargaDePartida, gerarPlano, planoValido, PRESCRICAO_POR_OBJETIVO } from '@/domain/plano';

const base = { pesoKg: 80, diasPorSemana: 4, objetivo: 'hipertrofia' as const };

describe('Telas 06–09 · as três perguntas geram o plano', () => {
  it('3 a 6 dias → A/B/C em rodízio; 2 dias → corpo inteiro A/B', () => {
    for (const dias of [3, 4, 5, 6]) {
      expect(gerarPlano({ ...base, diasPorSemana: dias }, EXERCICIOS_POR_ID).treinos.map((t) => t.id)).toEqual(['A', 'B', 'C']);
    }
    const dois = gerarPlano({ ...base, diasPorSemana: 2 }, EXERCICIOS_POR_ID);
    expect(dois.treinos.map((t) => t.nome)).toEqual(['Corpo inteiro A', 'Corpo inteiro B']);
  });

  it('a quantidade de dias da semana é a que a pessoa escolheu, sem dia repetido', () => {
    for (const dias of [2, 3, 4, 5, 6]) {
      const plano = gerarPlano({ ...base, diasPorSemana: dias }, EXERCICIOS_POR_ID);
      expect(plano.dias).toHaveLength(dias);
      expect(new Set(plano.dias).size).toBe(dias);
    }
  });

  it('o objetivo define a faixa: hipertrofia 8–12, força 4–6, condicionamento 12–15 nos compostos', () => {
    const supino = (objetivo: 'hipertrofia' | 'forca' | 'condicionamento') =>
      gerarPlano({ ...base, objetivo }, EXERCICIOS_POR_ID).treinos[0].itens[0];
    expect(supino('hipertrofia').faixa).toEqual({ min: 8, max: 12 });
    expect(supino('forca').faixa).toEqual({ min: 4, max: 6 });
    expect(supino('condicionamento').faixa).toEqual({ min: 12, max: 15 });
    expect(supino('forca').series).toBe(PRESCRICAO_POR_OBJETIVO.forca.series.composto);
  });

  it('isolado ganha a faixa de isolado (crossover na hipertrofia: 10–15)', () => {
    const crossover = gerarPlano(base, EXERCICIOS_POR_ID).treinos[0].itens.find((i) => i.exercicioId === 'crossover')!;
    expect(crossover.faixa).toEqual({ min: 10, max: 15 });
  });

  it('o peso define a carga de partida, conservadora e na anilha: 80 kg → supino 40 kg', () => {
    const plano = gerarPlano(base, EXERCICIOS_POR_ID);
    expect(plano.treinos[0].itens[0].cargaKg).toBe(40);
    for (const t of plano.treinos) {
      for (const i of t.itens) {
        const e = EXERCICIOS_POR_ID.get(i.exercicioId)!;
        if (e.incrementoKg > 0) expect((i.cargaKg / e.incrementoKg) % 1).toBeCloseTo(0);
      }
    }
  });

  it('quem pesa mais começa mais pesado; força começa mais pesado que condicionamento', () => {
    const supino = EXERCICIOS_POR_ID.get('supino-reto-barra');
    expect(cargaDePartida(supino, 100)).toBeGreaterThan(cargaDePartida(supino, 60));
    expect(cargaDePartida(supino, 80, PRESCRICAO_POR_OBJETIVO.forca.fatorDeCarga))
      .toBeGreaterThan(cargaDePartida(supino, 80, PRESCRICAO_POR_OBJETIVO.condicionamento.fatorDeCarga));
  });

  it('exercício com peso do corpo (barra fixa) entra com carga 0', () => {
    expect(gerarPlano(base, EXERCICIOS_POR_ID).treinos[1].itens[0]).toMatchObject({ exercicioId: 'barra-fixa', cargaKg: 0 });
  });

  it('todo exercício do plano existe no catálogo, e o plano gerado é válido', () => {
    for (const dias of [2, 3]) {
      const plano = gerarPlano({ ...base, diasPorSemana: dias }, EXERCICIOS_POR_ID);
      expect(planoValido(plano)).toBe(true);
      for (const t of plano.treinos) for (const i of t.itens) expect(EXERCICIOS_POR_ID.has(i.exercicioId)).toBe(true);
    }
  });

  it('plano estranho vindo do banco é recusado', () => {
    expect(planoValido(null)).toBe(false);
    expect(planoValido({ dias: [1], treinos: [] })).toBe(false);
    expect(planoValido({ dias: [1], treinos: [{ id: 'A', nome: 'x', itens: [{ exercicioId: 'a', series: 3, faixa: { min: 12, max: 8 } }] }] })).toBe(false);
  });
});

describe('RN-18 · todo exercício com carga tem carga de partida', () => {
  it('nenhum exercício de carga do catálogo entra com 0 kg para quem pesa 80 kg', () => {
    for (const e of EXERCICIOS_POR_ID.values()) {
      if (e.unidade === 'corporal') continue;
      expect([e.id, cargaDePartida(e, 80)]).not.toEqual([e.id, 0]);
    }
  });
});
