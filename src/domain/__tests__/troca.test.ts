import { EXERCICIOS, EXERCICIOS_POR_ID, alternativasDoMesmoPadrao } from '@/data/exercicios';
import { sessoesDeFabrica } from '@/data/historico';
import { TREINOS, TREINOS_POR_ID } from '@/data/treinos';
import type { SessaoFechada } from '../historico';
import {
  ajustarEstimativa, alternativas, alternativasNaSessao, alvosDaTroca, cargasRecentes, estimarCarga,
  estimarPelaReferencia,
} from '../troca';
import type { Alvo, Exercicio, ItemDeTreino, SerieRegistrada, Treino } from '../types';

const ex = (id: string): Exercicio => EXERCICIOS_POR_ID.get(id)!;
const ids = (lista: Exercicio[]) => lista.map((e) => e.id);
const serie = (exercicioId: string, reps: number, cargaKg: number, indice = 0): SerieRegistrada =>
  ({ exercicioId, indice, reps, cargaKg, foiAlvo: true });
const sessao = (fimMs: number, series: SerieRegistrada[]): SessaoFechada =>
  ({ id: `s-${fimMs}`, treinoId: 'A', inicioMs: fimMs - 1, fimMs, series });
const treino = (id: string): Treino => TREINOS_POR_ID.get(id)!;
const itemDe = (treinoId: string, exercicioId: string): ItemDeTreino =>
  treino(treinoId).itens.find((i) => i.exercicioId === exercicioId)!;
/** Os exercícios dos OUTROS itens do treino, sem troca nenhuma. */
const outrosItens = (treinoId: string, exercicioId: string) =>
  new Set(treino(treinoId).itens.map((i) => i.exercicioId).filter((id) => id !== exercicioId));
/** Relógio fixo: o histórico de fábrica ancorado num instante conhecido. */
const FABRICA = sessoesDeFabrica(Date.UTC(2026, 9, 4, 12));

describe('CAR-9 · quem pode entrar no lugar', () => {
  it('tríceps corda → só tríceps (o isolado não é mais saco de gatos)', () => {
    const lista = alternativas(ex('triceps-corda'), EXERCICIOS);
    expect(ids(lista).sort()).toEqual(['triceps-frances', 'triceps-testa']);
    expect(ids(lista)).not.toContain('prancha');
  });

  it('todo isolado só oferece o mesmo grupo muscular', () => {
    for (const e of EXERCICIOS.filter((x) => x.padrao === 'isolado')) {
      expect(alternativas(e, EXERCICIOS).every((a) => a.grupo === e.grupo && a.padrao === 'isolado')).toBe(true);
    }
  });

  it('supino → compostos de empurrar horizontal, sem crucifixo, com a flexão por último', () => {
    const lista = alternativasDoMesmoPadrao('supino-reto-barra');
    expect(lista.every((e) => e.padrao === 'empurrar-horizontal' && e.composto)).toBe(true);
    expect(ids(lista)).toContain('supino-maquina');
    expect(ids(lista)).toContain('supino-reto-halter');
    expect(ids(lista)).not.toContain('crossover');
    expect(ids(lista)).not.toContain('supino-reto-barra');
    expect(lista[lista.length - 1].id).toBe('flexao');
  });

  it('paralelas (tríceps) não substitui desenvolvimento (ombro), mesmo no mesmo padrão', () => {
    expect(ids(alternativasDoMesmoPadrao('desenvolvimento-barra'))).not.toContain('paralelas');
    expect(alternativasDoMesmoPadrao('paralelas')).toEqual([]);
  });

  it('isolado pode trocar por composto do mesmo grupo (crossover → supinos)', () => {
    expect(ids(alternativasDoMesmoPadrao('crossover'))).toContain('supino-maquina');
  });

  it('cadeira abdutora saiu de articular-quadril: não aparece no lugar da elevação pélvica', () => {
    expect(ids(alternativasDoMesmoPadrao('elevacao-pelvica'))).not.toContain('cadeira-abdutora');
  });

  it('toda alternativa é recíproca — se A troca por B, B troca por A', () => {
    for (const a of EXERCICIOS.filter((x) => x.composto)) {
      for (const b of alternativas(a, EXERCICIOS).filter((x) => x.composto)) {
        expect(ids(alternativas(b, EXERCICIOS))).toContain(a.id);
      }
    }
  });
});

describe('CAR-9 · na sessão: o que já está no treino de hoje não entra', () => {
  it('tríceps corda no treino A não oferece o francês, que é o item seguinte', () => {
    const lista = alternativasNaSessao({
      original: ex('triceps-corda'), atualId: 'triceps-corda',
      ocupados: outrosItens('A', 'triceps-corda'), catalogo: EXERCICIOS,
    });
    expect(ids(lista)).toEqual(['triceps-testa']);
  });

  it('nem o que já foi feito: o supino inclinado (item 2) não oferece o supino reto (item 1)', () => {
    const lista = alternativasNaSessao({
      original: ex('supino-inclinado-halter'), atualId: 'supino-inclinado-halter',
      ocupados: outrosItens('A', 'supino-inclinado-halter'), catalogo: EXERCICIOS,
    });
    expect(ids(lista)).not.toContain('supino-reto-barra');
    expect(ids(lista)).toContain('supino-maquina');
  });

  it('depois da troca, o do plano volta em primeiro e o atual sai da lista', () => {
    const lista = alternativasNaSessao({
      original: ex('supino-reto-barra'), atualId: 'supino-maquina',
      ocupados: outrosItens('A', 'supino-reto-barra'), catalogo: EXERCICIOS,
    });
    expect(lista[0].id).toBe('supino-reto-barra');
    expect(ids(lista)).not.toContain('supino-maquina');
  });

  it('crossover trocado por supino consegue voltar (a lista parte do plano, não do atual)', () => {
    const lista = alternativasNaSessao({
      original: ex('crossover'), atualId: 'supino-maquina',
      ocupados: outrosItens('A', 'crossover'), catalogo: EXERCICIOS,
    });
    expect(ids(lista)).toContain('crossover');
  });

  it('em nenhum treino do plano a troca oferece um exercício de outro item', () => {
    for (const t of TREINOS) {
      for (const item of t.itens) {
        const ocupados = outrosItens(t.id, item.exercicioId);
        const lista = alternativasNaSessao({ original: ex(item.exercicioId), atualId: item.exercicioId, ocupados, catalogo: EXERCICIOS });
        expect(lista.some((e) => ocupados.has(e.id))).toBe(false);
      }
    }
  });
});

describe('CAR-9.1 · carga estimada na variação nova', () => {
  it('barra → halteres divide por mão e arredonda para a anilha do halter', () => {
    // 42,5 × 0,4 = 17 → anilha de 2 kg → 18 (o "18 kg cada" do Figma).
    expect(estimarCarga({ de: ex('supino-reto-barra'), cargaDeKg: 42.5, para: ex('supino-reto-halter') })).toBe(18);
  });

  it('barra → máquina sobe um pouco (46,75 → 47,5, o "47,5 kg" do Figma)', () => {
    expect(estimarCarga({ de: ex('supino-reto-barra'), cargaDeKg: 42.5, para: ex('supino-maquina') })).toBe(47.5);
  });

  it('peso do corpo não converte: devolve null em vez de inventar', () => {
    expect(estimarCarga({ de: ex('barra-fixa'), cargaDeKg: 0, para: ex('puxada-frente') })).toBeNull();
    expect(estimarCarga({ de: ex('supino-reto-barra'), cargaDeKg: 40, para: ex('flexao') })).toBeNull();
  });

  it('aparelho fora da curva usa o fator do catálogo: leg press 160 kg ≠ 160 kg no Smith', () => {
    expect(estimarCarga({ de: ex('leg-press'), cargaDeKg: 160, para: ex('agachamento-smith') })).toBe(70);
    expect(estimarCarga({ de: ex('agachamento-livre'), cargaDeKg: 70, para: ex('bulgaro') })).toBe(18);
    // Francês é UM halter nas duas mãos: 14 kg viram 17,5 na barra, não 35.
    expect(estimarCarga({ de: ex('triceps-frances'), cargaDeKg: 14, para: ex('triceps-testa') })).toBe(17.5);
  });

  it('crucifixo não é referência para supino: a família inclui o tipo (composto/isolado)', () => {
    const r = estimarPelaReferencia(ex('supino-maquina'), [
      { exercicio: ex('crossover'), cargaKg: 12 },
      { exercicio: ex('supino-reto-barra'), cargaKg: 40 },
    ]);
    expect(r).toEqual({ cargaKg: 45, base: ex('supino-reto-barra') });
  });

  it('cargasRecentes: hoje primeiro, o último exercício feito antes, a maior carga da sessão', () => {
    const refs = cargasRecentes(
      [[serie('supino-reto-barra', 12, 42.5), serie('crossover', 12, 12)], [serie('supino-reto-barra', 10, 40), serie('puxada-frente', 10, 55)]],
      EXERCICIOS_POR_ID,
    );
    expect(refs.map((r) => [r.exercicio.id, r.cargaKg])).toEqual([
      ['crossover', 12], ['supino-reto-barra', 42.5], ['puxada-frente', 55],
    ]);
  });

  it('primeira vez na variação → origem estimado, piso da faixa, sem herdar a carga do aparelho', () => {
    const r = alvosDaTroca({
      item: { exercicioId: 'supino-reto-barra', series: 4, faixa: { min: 8, max: 12 }, cargaKg: 42.5 },
      novo: ex('supino-reto-halter'), porId: EXERCICIOS_POR_ID, anteriores: [],
    });
    expect(r.alvos).toHaveLength(4);
    expect(r.alvos.every((a) => a.origem === 'estimado' && a.cargaKg === 18 && a.reps === 8)).toBe(true);
    expect(r.base?.id).toBe('supino-reto-barra');
    expect(r.semReferencia).toBe(false);
  });

  it('com o histórico de fábrica, supino reto → máquina/halteres dá os números do Figma', () => {
    const item = itemDe('A', 'supino-reto-barra');
    const comoNoFigma = (novoId: string) =>
      alvosDaTroca({ item, novo: ex(novoId), porId: EXERCICIOS_POR_ID, anteriores: FABRICA, planos: TREINOS }).alvos[0].cargaKg;
    expect(comoNoFigma('supino-maquina')).toBe(47.5);
    expect(comoNoFigma('supino-reto-halter')).toBe(18);
  });

  it('segunda vez na variação → histórico real dela, pela CAR-1', () => {
    const r = alvosDaTroca({
      item: { exercicioId: 'supino-reto-barra', series: 2, faixa: { min: 8, max: 12 }, cargaKg: 42.5 },
      novo: ex('supino-reto-halter'), porId: EXERCICIOS_POR_ID,
      anteriores: [sessao(1, [serie('supino-reto-halter', 12, 16, 0), serie('supino-reto-halter', 12, 16, 1)])],
    });
    expect(r.alvos.every((a) => a.origem === 'progressao' && a.cargaKg === 18)).toBe(true);
    expect(r.base).toBeUndefined();
  });

  it('barra fixa → pulldown: o histórico do padrão vira a base (puxada 55 kg), não "0 kg"', () => {
    const r = alvosDaTroca({ item: itemDe('B', 'barra-fixa'), novo: ex('pulldown'), porId: EXERCICIOS_POR_ID, anteriores: FABRICA, planos: TREINOS });
    expect(r.alvos[0]).toEqual({ cargaKg: 55, reps: 6, origem: 'estimado' });
    expect(r.base?.id).toBe('puxada-frente');
    expect(r.semReferencia).toBe(false);
  });

  it('sem histórico, a carga do plano do mesmo padrão é o último recurso', () => {
    const r = alvosDaTroca({ item: itemDe('B', 'barra-fixa'), novo: ex('puxada-supinada'), porId: EXERCICIOS_POR_ID, anteriores: [], planos: TREINOS });
    expect(r.alvos[0]).toEqual({ cargaKg: 55, reps: 6, origem: 'estimado' });
  });

  it('crossover → supino na máquina estima pelo supino feito hoje, não pelos 12 kg do crucifixo', () => {
    const r = alvosDaTroca({
      item: itemDe('A', 'crossover'), novo: ex('supino-maquina'), porId: EXERCICIOS_POR_ID, anteriores: FABRICA,
      registradasHoje: [serie('supino-reto-barra', 12, 42.5)], planos: TREINOS,
    });
    expect(r.alvos[0].cargaKg).toBe(47.5);
    expect(r.base?.id).toBe('supino-reto-barra');
  });

  it('nada da mesma família para converter → carga 0 marcada como "sem referência"', () => {
    const r = alvosDaTroca({
      item: { exercicioId: 'flexao', series: 3, faixa: { min: 8, max: 12 }, cargaKg: 0 },
      novo: ex('supino-maquina'), porId: EXERCICIOS_POR_ID, anteriores: [],
    });
    expect(r.semReferencia).toBe(true);
    expect(r.base).toBeUndefined();
    expect(r.alvos[0]).toEqual({ cargaKg: 0, reps: 8, origem: 'estimado' });
  });

  it('peso do corpo nunca é "sem referência": não há carga a escolher', () => {
    const r = alvosDaTroca({ item: itemDe('A', 'supino-reto-barra'), novo: ex('flexao'), porId: EXERCICIOS_POR_ID, anteriores: [] });
    expect(r.semReferencia).toBe(false);
    expect(r.alvos[0].cargaKg).toBe(0);
  });

  it('nenhuma troca dos treinos do plano fica sem referência, nem com o histórico vazio', () => {
    for (const t of TREINOS) {
      for (const item of t.itens) {
        const opcoes = alternativasNaSessao({
          original: ex(item.exercicioId), atualId: item.exercicioId,
          ocupados: outrosItens(t.id, item.exercicioId), catalogo: EXERCICIOS,
        });
        for (const novo of opcoes) {
          const r = alvosDaTroca({ item, novo, porId: EXERCICIOS_POR_ID, anteriores: [], planos: TREINOS });
          expect(r.semReferencia).toBe(false);
          if (novo.unidade !== 'corporal') expect(r.alvos[0].cargaKg).toBeGreaterThan(0);
        }
      }
    }
  });

  it('trocar pelo próprio exercício do plano é não trocar: CAR-1 normal', () => {
    const r = alvosDaTroca({ item: itemDe('A', 'supino-reto-barra'), novo: ex('supino-reto-barra'), porId: EXERCICIOS_POR_ID, anteriores: FABRICA });
    expect(r.alvos[0]).toEqual({ cargaKg: 42.5, reps: 8, origem: 'progressao' });
  });
});

describe('CAR-9.1 · depois da 1ª série, o palpite cede ao fato', () => {
  const estimados: Alvo[] = Array.from({ length: 3 }, () => ({ cargaKg: 45, reps: 8, origem: 'estimado' as const }));

  it('corrigiu 45 → 40 na 1ª série: as que faltam miram 40', () => {
    const alvos = ajustarEstimativa(estimados, [serie('supino-maquina', 9, 40)]);
    expect(alvos.map((a) => a.cargaKg)).toEqual([45, 40, 40]);
  });

  it('supino inclinado (16 kg de halter) → máquina: 45 kg estimado, nunca os 16 do plano', () => {
    const r = alvosDaTroca({
      item: itemDe('A', 'supino-inclinado-halter'), novo: ex('supino-maquina'), porId: EXERCICIOS_POR_ID,
      anteriores: FABRICA, registradasHoje: [serie('supino-reto-barra', 12, 42.5)], planos: TREINOS,
    });
    expect(r.alvos.map((a) => a.cargaKg)).toEqual([45, 45, 45]);
    expect(ajustarEstimativa(r.alvos, [serie('supino-maquina', 10, 40)]).map((a) => a.cargaKg)).toEqual([45, 40, 40]);
  });

  it('antes da 1ª série, nada muda; alvo que não é estimado também não', () => {
    expect(ajustarEstimativa(estimados, [])).toBe(estimados);
    const reais: Alvo[] = [{ cargaKg: 42.5, reps: 8, origem: 'progressao' }, { cargaKg: 42.5, reps: 8, origem: 'progressao' }];
    expect(ajustarEstimativa(reais, [serie('supino-reto-barra', 8, 40)])).toEqual(reais);
  });
});
