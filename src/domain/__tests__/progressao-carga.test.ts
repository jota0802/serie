import { EXERCICIOS_POR_ID } from '@/data/exercicios';
import { atualizarExercicio } from '@/domain/edicao-plano';
import { cargaDoPlanoVale, ultimaSessaoCom, type SessaoFechada } from '@/domain/historico';
import { gerarPlano } from '@/domain/plano';
import { proximoAlvo } from '@/domain/progressao';
import type { SerieRegistrada } from '@/domain/types';

const FAIXA = { min: 4, max: 6 };
const serie = (reps: number, cargaKg: number, indice: number): SerieRegistrada => ({
  exercicioId: 'supino-reto-barra', indice, reps, cargaKg, foiAlvo: true,
});

describe('CAR-1 · a carga parte da ÚLTIMA VEZ, não do plano', () => {
  it('regressão: subiu para 47,5 e não fechou a faixa → hoje continua em 47,5 (não volta aos 45 do plano)', () => {
    const alvos = proximoAlvo({
      ultimaSessao: [serie(4, 47.5, 0), serie(4, 47.5, 1), serie(3, 47.5, 2)],
      faixa: FAIXA, cargaAtualKg: 45, incrementoKg: 2.5, series: 3,
    });
    expect(alvos.map((a) => a.cargaKg)).toEqual([47.5, 47.5, 47.5]);
    expect(alvos.map((a) => a.reps)).toEqual([5, 5, 4]);
  });

  it('fechou a faixa na carga nova → sobe a partir dela (50), não do plano', () => {
    const alvos = proximoAlvo({
      ultimaSessao: [serie(6, 47.5, 0), serie(6, 47.5, 1), serie(6, 47.5, 2)],
      faixa: FAIXA, cargaAtualKg: 45, incrementoKg: 2.5, series: 3,
    });
    expect(alvos.every((a) => a.cargaKg === 50 && a.reps === 4 && a.origem === 'progressao')).toBe(true);
  });

  it('a referência é a carga de trabalho: a série aliviada no fim não rebaixa o alvo', () => {
    const alvos = proximoAlvo({
      ultimaSessao: [serie(5, 50, 0), serie(5, 50, 1), serie(6, 45, 2)],
      faixa: FAIXA, cargaAtualKg: 45, incrementoKg: 2.5, series: 3,
    });
    expect(alvos.every((a) => a.cargaKg === 50)).toBe(true);
  });

  it('três meses: com a faixa fechando de 3 em 3 treinos, a carga sobe sem voltar', () => {
    let historico: SerieRegistrada[] = [];
    const cargas: number[] = [];
    for (let treino = 0; treino < 9; treino++) {
      const alvos = proximoAlvo({ ultimaSessao: historico, faixa: FAIXA, cargaAtualKg: 45, incrementoKg: 2.5, series: 3 });
      historico = alvos.map((a, i) => serie(a.reps, a.cargaKg, i)); // fez exatamente o alvo
      cargas.push(alvos[0].cargaKg);
    }
    expect(cargas).toEqual([45, 45, 45, 47.5, 47.5, 47.5, 50, 50, 50]);
  });
});

describe('RN-19 · carga mudada de propósito no plano', () => {
  const plano = gerarPlano({ pesoKg: 80, diasPorSemana: 3, objetivo: 'forca' }, EXERCICIOS_POR_ID);
  const sessao = (fimMs: number, cargaKg: number): SessaoFechada => ({
    id: `s${fimMs}`, treinoId: 'A', inicioMs: fimMs - 1, fimMs, series: [serie(4, cargaKg, 0)],
  });

  it('mudar a carga no "Montar treino" carimba a hora da mudança', () => {
    const r = atualizarExercicio(plano, 'A', 0, { cargaKg: 60 }, 5_000);
    if (!r.ok) throw new Error(r.motivo);
    expect(r.plano.treinos[0].itens[0]).toMatchObject({ cargaKg: 60, cargaDefinidaEmMs: 5_000 });
  });

  it('carga do plano vale se foi mudada DEPOIS da última vez; antes disso, vale a última vez', () => {
    const item = { ...plano.treinos[0].itens[0], cargaKg: 60, cargaDefinidaEmMs: 5_000 };
    expect(cargaDoPlanoVale(item, 4_000)).toBe(true); // mudou depois do último treino
    expect(cargaDoPlanoVale(item, 6_000)).toBe(false); // já treinou depois da mudança
    expect(cargaDoPlanoVale(item, undefined)).toBe(true); // nunca treinou
    expect(cargaDoPlanoVale(plano.treinos[0].itens[0], 4_000)).toBe(false); // nunca mudou
  });

  it('valendo, o alvo recomeça a faixa na carga do plano', () => {
    const alvos = proximoAlvo({
      ultimaSessao: [serie(6, 47.5, 0)], faixa: FAIXA, cargaAtualKg: 60, incrementoKg: 2.5, series: 1, cargaDoPlanoVale: true,
    });
    expect(alvos[0]).toEqual({ cargaKg: 60, reps: 4, origem: 'inicial' });
  });

  it('a última sessão de um exercício é a mais recente que o tem', () => {
    const lista = [sessao(1_000, 45), sessao(3_000, 47.5), { ...sessao(4_000, 0), series: [] }];
    expect(ultimaSessaoCom(lista, 'supino-reto-barra')?.fimMs).toBe(3_000);
  });
});
