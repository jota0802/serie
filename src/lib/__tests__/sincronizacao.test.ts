import { sessoesDeFabrica } from '@/data/historico';
import type { SessaoFechada } from '@/domain/historico';
import { deLinhas, mesclarSessoes, paraLinhas, pendentesDeEnvio, type SessaoDoBanco } from '@/lib/sincronizacao';

const USUARIO = '00000000-0000-4000-8000-000000000001';
const AGORA = new Date(2026, 9, 5, 20, 0, 0).getTime();
const [primeira, segunda] = sessoesDeFabrica(AGORA);

/** Simula a ida e a volta pelo banco: o que o upsert grava é o que o select devolve. */
function idaEVolta(sessao: SessaoFechada): SessaoFechada {
  const { sessao: linha, series } = paraLinhas(sessao, USUARIO);
  const doBanco: SessaoDoBanco = {
    id: linha.id,
    treino_id: linha.treino_id,
    inicio: linha.inicio,
    fim: linha.fim,
    // o banco não garante a ordem do embed: embaralha de propósito
    series: [...series].reverse().map((s) => ({
      ordem: s.ordem,
      exercicio_id: s.exercicio_id,
      indice: s.indice,
      reps: s.reps,
      carga_kg: s.carga_kg,
      foi_alvo: s.foi_alvo ?? false,
      duracao_s: s.duracao_s ?? null,
    })),
  };
  return deLinhas(doBanco);
}

describe('Ida e volta pelo Supabase', () => {
  it('uma sessão sobe e desce idêntica (séries na ordem em que foram feitas)', () => {
    expect(idaEVolta(primeira)).toEqual(primeira);
  });

  it('cada série vira uma linha com o dono, a sessão e a posição', () => {
    const { sessao, series } = paraLinhas(primeira, USUARIO);
    expect(sessao).toMatchObject({ usuario_id: USUARIO, id: primeira.id, treino_id: primeira.treinoId });
    expect(series).toHaveLength(primeira.series.length);
    expect(series.map((s) => s.ordem)).toEqual(primeira.series.map((_, i) => i));
    expect(series.every((s) => s.usuario_id === USUARIO && s.sessao_id === primeira.id)).toBe(true);
  });

  it('carga com meio quilo e duração com fração sobrevivem ao banco', () => {
    const sessao: SessaoFechada = {
      ...primeira,
      series: [{ exercicioId: 'supino-reto-barra', indice: 0, reps: 8, cargaKg: 42.5, foiAlvo: true, duracaoSegundos: 37.6 }],
    };
    const { series } = paraLinhas(sessao, USUARIO);
    expect(series[0].duracao_s).toBe(38);
    expect(deLinhas({ id: 'x', treino_id: 'A', inicio: new Date(0).toISOString(), fim: new Date(1).toISOString(), series: [{ ordem: 0, exercicio_id: 'a', indice: 0, reps: 8, carga_kg: '42.50' as unknown as number, foi_alvo: true, duracao_s: null }] }).series[0])
      .toEqual({ exercicioId: 'a', indice: 0, reps: 8, cargaKg: 42.5, foiAlvo: true, duracaoSegundos: undefined });
  });
});

describe('Mescla do aparelho com a nuvem', () => {
  it('não duplica: a mesma sessão dos dois lados vira uma só', () => {
    expect(mesclarSessoes([primeira, segunda], [primeira])).toHaveLength(2);
  });

  it('o que só está na nuvem (outro celular) entra; o que só está no aparelho (offline) fica', () => {
    const soNaNuvem = { ...primeira, id: 'sessao-nuvem' };
    const soNoAparelho = { ...segunda, id: 'sessao-offline' };
    const ids = mesclarSessoes([soNoAparelho], [soNaNuvem]).map((s) => s.id);
    expect(ids.sort()).toEqual(['sessao-nuvem', 'sessao-offline']);
  });

  it('sai em ordem de término, a mais antiga primeiro', () => {
    const mescla = mesclarSessoes(sessoesDeFabrica(AGORA), []);
    for (let i = 1; i < mescla.length; i++) expect(mescla[i].fimMs).toBeGreaterThanOrEqual(mescla[i - 1].fimMs);
  });

  it('pendente é o que ainda não subiu', () => {
    expect(pendentesDeEnvio([primeira, segunda], new Set([primeira.id])).map((s) => s.id)).toEqual([segunda.id]);
  });
});
