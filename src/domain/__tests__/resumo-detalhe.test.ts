import type { SessaoFechada } from '@/domain/historico';
import {
  compararComUltimaVez, fraseDoProgresso, frasesDaComparacao, progressoDoTreino, proximoDiaDeTreino, recordesDoDia,
  resumoPorExercicio,
} from '@/domain/resumo';
import type { ItemDeTreino, SerieRegistrada } from '@/domain/types';

const s = (exercicioId: string, reps: number, cargaKg: number, indice = 0): SerieRegistrada => ({
  exercicioId, indice, reps, cargaKg, foiAlvo: true,
});
const kg = (n: number) => String(n).replace('.', ',');

describe('Resumo · exercício por exercício contra a última vez', () => {
  it('carga subiu · carga mais leve · mais reps · menos reps · igual · primeira vez', () => {
    expect(compararComUltimaVez([s('a', 4, 47.5)], [s('a', 6, 45)])).toEqual({ tipo: 'carga-subiu', deltaKg: 2.5 });
    expect(compararComUltimaVez([s('a', 6, 42.5)], [s('a', 6, 45)])).toEqual({ tipo: 'carga-menor', deltaKg: 2.5 });
    expect(compararComUltimaVez([s('a', 6, 45), s('a', 6, 45)], [s('a', 5, 45), s('a', 4, 45)])).toEqual({ tipo: 'mais-reps', deltaReps: 3 });
    expect(compararComUltimaVez([s('a', 4, 45)], [s('a', 6, 45)])).toEqual({ tipo: 'menos-reps', deltaReps: 2 });
    expect(compararComUltimaVez([s('a', 5, 45)], [s('a', 5, 45)])).toEqual({ tipo: 'igual' });
    expect(compararComUltimaVez([s('a', 5, 45)], [])).toEqual({ tipo: 'primeira-vez' });
  });

  it('as frases não culpam ninguém, e o singular é singular', () => {
    expect(frasesDaComparacao({ tipo: 'carga-subiu', deltaKg: 2.5 }, kg)).toBe('Carga subiu 2,5 kg');
    expect(frasesDaComparacao({ tipo: 'mais-reps', deltaReps: 1 }, kg)).toBe('+1 rep que da última vez');
    expect(frasesDaComparacao({ tipo: 'menos-reps', deltaReps: 2 }, kg)).toBe('2 reps a menos que da última vez');
  });

  it('a próxima vez é a CAR-1 aplicada às séries de hoje: fechou a faixa → a carga sobe', () => {
    const item: ItemDeTreino = { exercicioId: 'supino', series: 3, faixa: { min: 4, max: 6 }, cargaKg: 45 };
    const hoje = [s('supino', 6, 47.5, 0), s('supino', 6, 47.5, 1), s('supino', 6, 47.5, 2)];
    const anteriores: SessaoFechada[] = [{ id: 'x', treinoId: 'A', inicioMs: 0, fimMs: 1, series: [s('supino', 5, 47.5)] }];
    const [linha] = resumoPorExercicio({ registradas: hoje, anteriores, itens: [item], incrementoDe: () => 2.5 });
    expect(linha.tonelagem).toBe(6 * 47.5 * 3);
    expect(linha.comparacao).toEqual({ tipo: 'mais-reps', deltaReps: 13 });
    expect(linha.proximaVez).toEqual({ cargaKg: 50, reps: 4, origem: 'progressao' });
  });

  it('exercício que não está mais no plano não tem "próxima vez", mas aparece', () => {
    const [linha] = resumoPorExercicio({ registradas: [s('fora', 8, 20)], anteriores: [], itens: [], incrementoDe: () => 2.5 });
    expect(linha.proximaVez).toBeNull();
  });

  it('na ordem em que foram feitos', () => {
    const r = resumoPorExercicio({
      registradas: [s('b', 1, 1), s('a', 1, 1), s('b', 1, 1, 1)], anteriores: [], itens: [], incrementoDe: () => 2.5,
    });
    expect(r.map((x) => x.exercicioId)).toEqual(['b', 'a']);
  });
});

describe('Resumo · recordes do dia', () => {
  it('todos os que superaram o anterior, do maior para o menor; primeira vez não conta', () => {
    const antes: Record<string, number> = { a: 50, b: 20, c: 0 };
    const r = recordesDoDia([s('a', 6, 45), s('b', 10, 20), s('c', 10, 30)], (id) => antes[id]);
    expect(r.map((x) => x.exercicioId)).toEqual(['a', 'b']);
  });
});

describe('Resumo · o próximo dia de treino', () => {
  // terça, 6 de outubro de 2026
  const terca = new Date(2026, 9, 6, 20).getTime();
  it('amanhã · o dia da semana · o mesmo dia da semana que vem', () => {
    expect(proximoDiaDeTreino([1, 3, 5], terca)).toBe('amanhã');
    expect(proximoDiaDeTreino([1, 5], terca)).toBe('sexta');
    expect(proximoDiaDeTreino([2], terca)).toBe('terça que vem');
    expect(proximoDiaDeTreino([], terca)).toBeNull();
  });
});

describe('Resumo · o destaque é o que evoluiu, não a tonelagem', () => {
  const linha = (tipo: 'carga-subiu' | 'mais-reps' | 'igual' | 'primeira-vez') => ({
    exercicioId: tipo, series: [], tonelagem: 0, proximaVez: null,
    comparacao: tipo === 'carga-subiu' ? { tipo, deltaKg: 2.5 } : tipo === 'mais-reps' ? { tipo, deltaReps: 2 } : { tipo },
  }) as Parameters<typeof progressoDoTreino>[0][number];

  it('conta carga nova e mais repetições; primeira vez fica fora da conta', () => {
    const p = progressoDoTreino([linha('carga-subiu'), linha('mais-reps'), linha('mais-reps'), linha('igual'), linha('primeira-vez')]);
    expect(p).toEqual({ evoluiu: 3, comCargaNova: 1, comMaisReps: 2, primeiraVez: 1, total: 5 });
    expect(fraseDoProgresso(p)).toEqual({ destaque: 'Você evoluiu em 3 de 4 exercícios', detalhe: '1 com carga nova · 2 com mais repetições' });
  });

  it('nada evoluiu: sem bronca; tudo novo: o primeiro registro', () => {
    expect(fraseDoProgresso(progressoDoTreino([linha('igual')])).destaque).toBe('Treino feito');
    expect(fraseDoProgresso(progressoDoTreino([linha('primeira-vez')])).destaque).toBe('Primeiro registro destes exercícios');
  });
});
