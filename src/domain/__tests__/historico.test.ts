import { sessoesDeFabrica } from '@/data/historico';
import { EXERCICIOS_POR_ID } from '@/data/exercicios';
import { TREINOS, TREINOS_POR_ID } from '@/data/treinos';
import { melhor1RM, tonelagem } from '@/domain';
import * as historico from '@/domain/historico';
import {
  proximoTreino,
  recordeDe,
  sessoesDaSemana,
  ultimasSeriesDe,
  ultimaTonelagem,
  type SessaoFechada,
} from '@/domain/historico';

// Relógio fixo: domingo, 4 de outubro de 2026, 20h (horário local da máquina que roda o teste).
const AGORA = new Date(2026, 9, 4, 20, 0, 0).getTime();
const DIA = 24 * 60 * 60 * 1000;
const fabrica = sessoesDeFabrica(AGORA);

describe('Os dados mockados são coerentes entre si', () => {
  it('todo exercício do histórico existe no catálogo, e toda sessão é de uma letra do plano', () => {
    for (const sessao of fabrica) {
      expect(TREINOS_POR_ID.has(sessao.treinoId)).toBe(true);
      for (const s of sessao.series) expect(EXERCICIOS_POR_ID.has(s.exercicioId)).toBe(true);
    }
  });

  it('cada sessão tem as séries que o plano da letra prescreve, nem mais nem menos', () => {
    for (const sessao of fabrica) {
      const treino = TREINOS_POR_ID.get(sessao.treinoId)!;
      for (const item of treino.itens) {
        expect(sessao.series.filter((s) => s.exercicioId === item.exercicioId)).toHaveLength(item.series);
      }
    }
  });

  it('reps dentro do bom senso da faixa (até 3 abaixo do piso e nunca acima do topo)', () => {
    for (const sessao of fabrica) {
      const treino = TREINOS_POR_ID.get(sessao.treinoId)!;
      for (const s of sessao.series) {
        const { faixa } = treino.itens.find((i) => i.exercicioId === s.exercicioId)!;
        expect(s.reps).toBeLessThanOrEqual(faixa.max);
        expect(s.reps).toBeGreaterThanOrEqual(faixa.min - 3);
      }
    }
  });

  it('é a sessão de 5 dias atrás que conta a história: o supino fechou 12 nas quatro séries a 40 kg', () => {
    const supino = ultimasSeriesDe(fabrica, 'supino-reto-barra');
    expect(supino.map((s) => s.reps)).toEqual([12, 12, 12, 12]);
    expect(supino.every((s) => s.cargaKg === 40)).toBe(true);
  });
});

describe('Histórico derivado — nada é guardado à parte', () => {
  it('CAR-7 · a tonelagem anterior do A é a SOMA das séries do último A (4.155 kg), não um número cravado', () => {
    const ultimoA = historico.ordenarPorFim(fabrica).find((s) => s.treinoId === 'A')!;
    expect(ultimaTonelagem(fabrica, 'A')).toBe(tonelagem(ultimoA.series));
    expect(ultimaTonelagem(fabrica, 'A')).toBe(4155);
  });

  it('CAR-5 · o recorde nunca é menor que o 1RM de nenhuma sessão (o mock antigo errava o do tríceps)', () => {
    for (const sessao of fabrica) {
      for (const id of new Set(sessao.series.map((s) => s.exercicioId))) {
        expect(recordeDe(fabrica, id)).toBeGreaterThanOrEqual(melhor1RM(sessao.series.filter((s) => s.exercicioId === id)));
      }
    }
    // tríceps corda: 25 kg × 12 reps → 25 × 1,4 = 35
    expect(recordeDe(fabrica, 'triceps-corda')).toBeCloseTo(35);
  });

  it('exercício nunca feito: sem última vez, sem recorde, sem tonelagem', () => {
    expect(ultimasSeriesDe(fabrica, 'prancha')).toEqual([]);
    expect(recordeDe(fabrica, 'prancha')).toBe(0);
    expect(ultimaTonelagem([], 'A')).toBe(0);
  });

  it('a última vez é a MAIS RECENTE, mesmo que a lista venha fora de ordem', () => {
    const embaralhada = [...fabrica].reverse();
    expect(ultimasSeriesDe(embaralhada, 'supino-reto-barra')[0].cargaKg).toBe(40);
  });
});

describe('A próxima letra — o app aprende', () => {
  it('com a fábrica (último foi C), hoje é A', () => {
    expect(proximoTreino(fabrica, TREINOS).id).toBe('A');
  });

  it('fechou o A → o próximo é B; fechou o C → volta ao A', () => {
    const fechar = (treinoId: string, diasDepois: number): SessaoFechada => ({
      id: `t-${treinoId}`, treinoId, inicioMs: AGORA, fimMs: AGORA + diasDepois * DIA, series: [],
    });
    expect(proximoTreino([...fabrica, fechar('A', 1)], TREINOS).id).toBe('B');
    expect(proximoTreino([...fabrica, fechar('A', 1), fechar('B', 2), fechar('C', 3)], TREINOS).id).toBe('A');
  });

  it('histórico vazio começa pelo A', () => {
    expect(proximoTreino([], TREINOS).id).toBe('A');
  });
});

describe('A semana do Hoje ("1 de 4")', () => {
  it('começa no domingo 00:00: num domingo, as sessões de sexta e quinta são da semana passada', () => {
    expect(sessoesDaSemana(fabrica, AGORA)).toHaveLength(0);
  });

  it('na terça seguinte, um treino feito na segunda conta', () => {
    const terca = AGORA + 2 * DIA;
    const segunda: SessaoFechada = { id: 'seg', treinoId: 'A', inicioMs: AGORA + DIA, fimMs: AGORA + DIA, series: [] };
    expect(sessoesDaSemana([...fabrica, segunda], terca).map((s) => s.id)).toEqual(['seg']);
  });
});
