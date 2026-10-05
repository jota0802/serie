import { EXERCICIOS_POR_ID } from '@/data/exercicios';
import { sessoesDeFabrica } from '@/data/historico';
import { TREINOS, TREINOS_POR_ID } from '@/data/treinos';

import { proximoAlvo, tonelagem, type SerieRegistrada, type Treino } from '..';
import { proximoTreino, ultimasSeriesDe, ultimaTonelagem, type SessaoFechada } from '../historico';
import { comparacaoDoResumo, exerciciosComCargaMaior } from '../resumo';
import {
  VALIDADE_DA_SESSAO_MS, duracaoDaSerieAnterior, fecharSessao, foiAlvo, itemDaSessao,
  novaSessao, registrarSerie, sessaoParaRestaurar, sessaoVencida, type SessaoEmAndamento,
} from '../sessao';

const AGORA = Date.UTC(2026, 9, 4, 18, 0, 0);
const MIN = 60 * 1000;
const treinoA = TREINOS_POR_ID.get('A') as Treino;

const serie = (reps: number, cargaKg: number, duracaoSegundos?: number): SerieRegistrada =>
  ({ exercicioId: 'x', indice: 0, reps, cargaKg, foiAlvo: true, duracaoSegundos });

/**
 * O caminho feliz inteiro, como o app faz: o alvo de cada série sai da `CAR-1` sobre o
 * histórico e o usuário só confirma. Devolve a sessão terminada.
 */
function fazerTreinoConfirmandoTudo(historico: SessaoFechada[], treino: Treino, inicioMs: number): SessaoEmAndamento {
  let s = novaSessao(treino.id, inicioMs);
  let relogio = inicioMs;
  while (!s.fimMs) {
    const item = itemDaSessao(treino, s, s.indiceExercicio)!;
    const exercicio = EXERCICIOS_POR_ID.get(item.exercicioId);
    const alvo = proximoAlvo({
      ultimaSessao: ultimasSeriesDe(historico, item.exercicioId),
      faixa: item.faixa, cargaAtualKg: item.cargaKg,
      incrementoKg: exercicio?.incrementoKg ?? 2.5, series: item.series,
    })[s.indiceSerie];
    relogio += 2 * MIN;
    s = registrarSerie({ ...s, duracaoUltimaSerieS: 40 }, treino, alvo.reps, alvo.cargaKg, alvo, relogio);
  }
  return s;
}

describe('foiAlvo · o usuário confirmou sem corrigir?', () => {
  const alvo = { reps: 8, cargaKg: 42.5 };
  it('reps e carga iguais ao alvo → true', () => expect(foiAlvo(8, 42.5, alvo)).toBe(true));
  it('corrigiu as reps → false', () => expect(foiAlvo(7, 42.5, alvo)).toBe(false));
  it('corrigiu a carga → false', () => expect(foiAlvo(8, 40, alvo)).toBe(false));
  it('sem alvo não dá para afirmar que foi → false', () => expect(foiAlvo(8, 42.5, undefined)).toBe(false));
});

describe('registrarSerie · o cursor do treino', () => {
  it('grava foiAlvo de verdade e a duração cronometrada, e avança a série', () => {
    const s0 = { ...novaSessao('A', AGORA), duracaoUltimaSerieS: 41 };
    const s1 = registrarSerie(s0, treinoA, 7, 42.5, { reps: 8, cargaKg: 42.5 }, AGORA + MIN);
    expect(s1.registradas[0]).toMatchObject({ exercicioId: 'supino-reto-barra', reps: 7, foiAlvo: false, duracaoSegundos: 41 });
    expect(s1.indiceSerie).toBe(1);
    expect(s1.duracaoUltimaSerieS).toBeNull();
    expect(s1.fimMs).toBeNull();
  });

  it('na última série do exercício passa para o próximo e zera a série', () => {
    let s = novaSessao('A', AGORA);
    for (let i = 0; i < 4; i++) s = registrarSerie(s, treinoA, 8, 42.5, { reps: 8, cargaKg: 42.5 }, AGORA);
    expect(s.indiceExercicio).toBe(1);
    expect(s.indiceSerie).toBe(0);
  });

  it('registra no exercício trocado (CAR-9), não no do plano', () => {
    const s = registrarSerie({ ...novaSessao('A', AGORA), trocas: { 0: 'supino-maquina' } }, treinoA, 8, 40, undefined, AGORA);
    expect(s.registradas[0].exercicioId).toBe('supino-maquina');
  });

  it('depois do fim, registrar de novo não muda nada', () => {
    const fim = fazerTreinoConfirmandoTudo(sessoesDeFabrica(AGORA), treinoA, AGORA);
    expect(registrarSerie(fim, treinoA, 8, 40, undefined, AGORA + 999 * MIN)).toBe(fim);
  });
});

describe('caminho crítico · começar → registrar tudo → fechar → o Hoje propõe a próxima letra', () => {
  const fabrica = sessoesDeFabrica(AGORA);

  it('com o histórico de fábrica, hoje é A', () => {
    expect(proximoTreino(fabrica, TREINOS).id).toBe('A');
  });

  it('o treino A confirmado do começo ao fim fecha com 16 séries, todas foiAlvo, e vira histórico', () => {
    const fim = fazerTreinoConfirmandoTudo(fabrica, treinoA, AGORA);
    expect(fim.fimMs).toBe(AGORA + 16 * 2 * MIN);
    expect(fim.registradas).toHaveLength(16);
    expect(fim.registradas.every((r) => r.foiAlvo)).toBe(true);

    const fechada = fecharSessao(fim)!;
    expect(fechada.id).toBe(`sessao-${AGORA}`);
    expect(proximoTreino([...fabrica, fechada], TREINOS).id).toBe('B');
  });

  it('sessão aberta não fecha', () => {
    expect(fecharSessao(novaSessao('A', AGORA))).toBeNull();
  });
});

describe('CAR-7 no resumo · a conta à mão com o histórico de fábrica', () => {
  const fabrica = sessoesDeFabrica(AGORA);
  const fim = fazerTreinoConfirmandoTudo(fabrica, treinoA, AGORA);

  it('confere os números: 3.771 kg hoje contra 4.155 kg do último A', () => {
    // Supino fechou 4 × 12 × 40 → hoje 4 × 8 × 42,5 = 1.360 (era 1.920).
    // Inclinado 12+11+11 × 16 = 544 · crossover 15+14+14 × 12 = 516
    // corda 12+12+11 × 25 = 875 · francês 12+11+11 × 14 = 476.
    expect(tonelagem(fim.registradas)).toBe(3771);
    expect(ultimaTonelagem(fabrica, 'A')).toBe(4155);
    expect(exerciciosComCargaMaior(fim.registradas, fabrica)).toBe(1);
  });

  it('caiu porque a carga subiu → destaca a carga, e o volume menor continua na tela', () => {
    const c = comparacaoDoResumo({
      tonelagem: 3771, tonelagemAnterior: 4155, cargasQueSubiram: 1, letra: 'A',
    });
    expect(c.destaque).toBe('Carga subiu em 1 exercício');
    expect(c.detalhe).toContain('384 kg de volume abaixo do último A');
  });

  it('plural', () => {
    expect(comparacaoDoResumo({ tonelagem: 1, tonelagemAnterior: 2, cargasQueSubiram: 2, letra: 'B' }).destaque)
      .toBe('Carga subiu em 2 exercícios');
  });

  it('subiu → mostra o delta positivo', () => {
    expect(comparacaoDoResumo({ tonelagem: 4300, tonelagemAnterior: 4155, cargasQueSubiram: 0, letra: 'A' }))
      .toEqual({ destaque: '+ 145 kg em relação ao último A' });
  });

  it('caiu sem carga nova → mostra a queda, sem esconder', () => {
    expect(comparacaoDoResumo({ tonelagem: 4000, tonelagemAnterior: 4155, cargasQueSubiram: 0, letra: 'A' }))
      .toEqual({ destaque: '155 kg abaixo do último A' });
  });

  it('primeira vez da letra não compara com zero', () => {
    expect(comparacaoDoResumo({ tonelagem: 3000, tonelagemAnterior: 0, cargasQueSubiram: 0, letra: 'C' }))
      .toEqual({ destaque: 'Primeiro treino C registrado' });
  });

  it('primeira vez no exercício não conta como "carga subiu"', () => {
    expect(exerciciosComCargaMaior([{ ...serie(8, 50), exercicioId: 'nunca-feito' }], fabrica)).toBe(0);
  });
});

describe('CAR-11.2 · duração da série anterior', () => {
  const historico = [serie(12, 40, 38)];

  it('primeira série do treino → cai no histórico', () => {
    expect(duracaoDaSerieAnterior([], historico)).toBe(38);
  });

  it('a partir da segunda → a última DESTA sessão, não a do histórico', () => {
    expect(duracaoDaSerieAnterior([serie(8, 42.5, 45), serie(8, 42.5, 52)], historico)).toBe(52);
  });

  it('pula série sem cronômetro e pega a última que tem', () => {
    expect(duracaoDaSerieAnterior([serie(8, 42.5, 45), serie(8, 42.5)], historico)).toBe(45);
  });

  it('nenhuma com duração nesta sessão → não inventa com o histórico', () => {
    expect(duracaoDaSerieAnterior([serie(8, 42.5)], historico)).toBeUndefined();
  });
});

describe('CAR-8 · sessão retomável por 6 h', () => {
  const aberta = { ...novaSessao('A', AGORA), indiceSerie: 2, inicioSerieMs: AGORA + MIN };

  it('volta igual ao que foi salvo', () => {
    expect(sessaoParaRestaurar(JSON.stringify(aberta), AGORA + 30 * MIN)).toEqual(aberta);
  });

  it('com mais de 6 h é descartada', () => {
    expect(sessaoParaRestaurar(JSON.stringify(aberta), AGORA + VALIDADE_DA_SESSAO_MS + 1)).toBeNull();
    expect(sessaoParaRestaurar(JSON.stringify(aberta), AGORA + VALIDADE_DA_SESSAO_MS)).not.toBeNull();
  });

  it('nada salvo, JSON quebrado ou formato estranho → nulo, sem estourar', () => {
    expect(sessaoParaRestaurar(null, AGORA)).toBeNull();
    expect(sessaoParaRestaurar('{quebrado', AGORA)).toBeNull();
    expect(sessaoParaRestaurar('"texto"', AGORA)).toBeNull();
    expect(sessaoParaRestaurar(JSON.stringify({ treinoId: 'A' }), AGORA)).toBeNull();
  });

  it('campo opcional faltando ganha o padrão', () => {
    const { trocas: _t, fimMs: _f, ...semOpcionais } = aberta;
    const r = sessaoParaRestaurar(JSON.stringify(semOpcionais), AGORA);
    expect(r?.trocas).toEqual({});
    expect(r?.fimMs).toBeNull();
  });

  it('a validade vale para a sessão em memória: "mais de 6 h", contadas do início', () => {
    expect(sessaoVencida(aberta, AGORA + VALIDADE_DA_SESSAO_MS)).toBe(false);
    expect(sessaoVencida(aberta, AGORA + VALIDADE_DA_SESSAO_MS + 1)).toBe(true);
  });

  it('largou o treino ontem e o app seguiu vivo em segundo plano: hoje não é mais retomável', () => {
    const ontem = AGORA - 24 * 60 * MIN;
    const largada = registrarSerie(novaSessao('A', ontem), treinoA, 8, 42.5, { reps: 8, cargaKg: 42.5 }, ontem + 2 * MIN);
    expect(largada.fimMs).toBeNull();
    expect(sessaoVencida(largada, AGORA)).toBe(true);
    // Uma série a mais não renova a validade: a conta é do início, não da última atividade.
    expect(sessaoVencida(largada, ontem + VALIDADE_DA_SESSAO_MS + 1)).toBe(true);
  });
});
