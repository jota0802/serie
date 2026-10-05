import { EXERCICIOS_POR_ID } from '@/data/exercicios';
import { sessoesDeFabrica } from '@/data/historico';
import { TREINOS } from '@/data/treinos';
import { CABECALHO_CSV, escaparCampo, formatarDataCsv, gerarCsv } from '../csv';
import { recordeDe, type SessaoFechada } from '../historico';
import {
  completarGrupos, dataRelativa, diasEntre, frequenciaSemanal, gruposDoPlano,
  maisNegligenciado, recordesRecentes, seriesDosUltimosDias, treinoQueTrabalha, ultimaSessaoDe,
} from '../progresso';
import { volumeSemanal } from '../volume';
import type { SerieRegistrada } from '../types';

const DIA_MS = 24 * 60 * 60 * 1000;
/** Relógio fixo, no fuso da máquina: sábado, 3 de outubro de 2026, 18:00. */
const AGORA = new Date(2026, 9, 3, 18, 0).getTime();

const serie = (exercicioId: string, reps: number, cargaKg: number, indice = 0, duracaoSegundos?: number): SerieRegistrada =>
  ({ exercicioId, indice, reps, cargaKg, foiAlvo: true, duracaoSegundos });

const sessao = (id: string, treinoId: string, diasAtras: number, series: SerieRegistrada[]): SessaoFechada =>
  ({ id, treinoId, inicioMs: AGORA - diasAtras * DIA_MS - 3_600_000, fimMs: AGORA - diasAtras * DIA_MS, series });

describe('Data relativa (tela 17 · "última vez")', () => {
  it('conta dias de calendário, não blocos de 24 h', () => {
    const ontemTarde = new Date(2026, 9, 2, 23, 50).getTime();
    const hojeCedo = new Date(2026, 9, 3, 0, 10).getTime();
    expect(diasEntre(ontemTarde, hojeCedo)).toBe(1);
    expect(dataRelativa(ontemTarde, hojeCedo)).toBe('ontem');
  });

  it('hoje · há N dias · há N meses', () => {
    expect(dataRelativa(AGORA - 3_600_000, AGORA)).toBe('hoje');
    expect(dataRelativa(AGORA - 4 * DIA_MS, AGORA)).toBe('há 4 dias');
    expect(dataRelativa(AGORA - 40 * DIA_MS, AGORA)).toBe('há 1 mês');
    expect(dataRelativa(AGORA - 75 * DIA_MS, AGORA)).toBe('há 2 meses');
  });

  it('a última sessão da letra é a mais recente dela, e nunca treinada é undefined', () => {
    const sessoes = sessoesDeFabrica(AGORA);
    expect(diasEntre(ultimaSessaoDe(sessoes, 'A')!.fimMs, AGORA)).toBe(5);
    expect(ultimaSessaoDe(sessoes, 'Z')).toBeUndefined();
  });
});

describe('Frequência semanal (tela 20)', () => {
  it('a fábrica tem 7 treinos em 2 semanas → 3,5 por semana, mesmo pedindo 4 semanas', () => {
    expect(frequenciaSemanal(sessoesDeFabrica(AGORA), AGORA, 4))
      .toEqual({ media: 3.5, total: 7, semanas: 2, desdeMs: AGORA - 14 * DIA_MS });
  });

  it('o relógio da tela anda depois da semente: 14 dias e 5 s ainda são 2 semanas', () => {
    // No app a fábrica nasce com `Date.now()` no carregamento e a tela lê `Date.now()` ao
    // montar, sempre um pouco depois — testar só com AGORA igual à âncora escondia isso.
    const fabrica = sessoesDeFabrica(AGORA);
    expect(frequenciaSemanal(fabrica, AGORA + 5_000, 4)).toMatchObject({ media: 3.5, total: 7, semanas: 2 });
    // No dia seguinte, em "Tudo": 7 treinos em 15 dias seguem sendo 2 semanas.
    expect(frequenciaSemanal(fabrica, AGORA + DIA_MS, Infinity)).toMatchObject({ media: 3.5, total: 7, semanas: 2 });
    // Passou da metade da 3ª semana sem treinar: aí são 3, e a média cai.
    const parado = frequenciaSemanal(fabrica, AGORA + 4 * DIA_MS, Infinity);
    expect(parado).toMatchObject({ total: 7, semanas: 3 });
    expect(parado.media).toBeCloseTo(7 / 3);
  });

  it('o período curto corta as sessões antigas', () => {
    const sessoes = [sessao('1', 'A', 1, []), sessao('2', 'B', 3, []), sessao('3', 'C', 20, [])];
    expect(frequenciaSemanal(sessoes, AGORA, 1)).toEqual({ media: 2, total: 2, semanas: 1, desdeMs: AGORA - 7 * DIA_MS });
    expect(frequenciaSemanal(sessoes, AGORA, Infinity))
      .toEqual({ media: 1, total: 3, semanas: 3, desdeMs: AGORA - 20 * DIA_MS });
  });

  it('dois treinos em três dias não viram 4,7 por semana: o mínimo é 1 semana', () => {
    const sessoes = [sessao('1', 'A', 3, []), sessao('2', 'B', 0, [])];
    expect(frequenciaSemanal(sessoes, AGORA, 4)).toMatchObject({ media: 2, total: 2, semanas: 1 });
  });

  it('histórico vazio não divide por zero', () => {
    expect(frequenciaSemanal([], AGORA, 4)).toEqual({ media: 0, total: 0, semanas: 1, desdeMs: AGORA - 7 * DIA_MS });
  });
});

describe('CAR-4 · o que estou negligenciando', () => {
  it('janela móvel de 7 dias: entra a sessão de 7 dias atrás, sai a de 8', () => {
    const sessoes = [sessao('1', 'A', 7, [serie('crossover', 12, 10)]), sessao('2', 'B', 8, [serie('rosca-direta', 12, 10)])];
    expect(seriesDosUltimosDias(sessoes, AGORA).map((s) => s.exercicioId)).toEqual(['crossover']);
  });

  it('grupo do plano sem nenhuma série volta ao gráfico com 0, e é o mais negligenciado', () => {
    const volume = volumeSemanal([serie('crossover', 12, 10)], EXERCICIOS_POR_ID);
    const completo = completarGrupos(volume, gruposDoPlano(TREINOS, EXERCICIOS_POR_ID));
    expect(completo[0]).toEqual({ grupo: 'peito', series: 1, estado: 'abaixo' });
    expect(completo.find((v) => v.grupo === 'posterior')).toEqual({ grupo: 'posterior', series: 0, estado: 'abaixo' });
    expect(maisNegligenciado(completo)?.series).toBe(0);
  });

  it('com a fábrica, posterior fica abaixo da faixa e o treino C é onde arrumar', () => {
    const sessoes = sessoesDeFabrica(AGORA);
    const volume = completarGrupos(
      volumeSemanal(seriesDosUltimosDias(sessoes, AGORA), EXERCICIOS_POR_ID),
      gruposDoPlano(TREINOS, EXERCICIOS_POR_ID),
    );
    expect(volume.find((v) => v.grupo === 'quadriceps')).toEqual({ grupo: 'quadriceps', series: 14, estado: 'na-faixa' });
    expect(maisNegligenciado(volume)?.grupo).toBe('posterior');
    expect(treinoQueTrabalha('posterior', TREINOS, EXERCICIOS_POR_ID)?.id).toBe('C');
  });

  it('ninguém abaixo da faixa → nada a arrumar', () => {
    expect(maisNegligenciado([{ grupo: 'peito', series: 12, estado: 'na-faixa' }])).toBeUndefined();
  });
});

describe('CAR-5 · recordes recentes', () => {
  it('o número é o mesmo de recordeDe, e o ouro só acende para quem superou algo na última vez', () => {
    const sessoes = sessoesDeFabrica(AGORA);
    const recordes = recordesRecentes(sessoes, 50);
    for (const r of recordes) expect(r.kg).toBeCloseTo(recordeDe(sessoes, r.exercicioId));
    // Agachamento: 70 × 9 há 7 dias → 70 × 10 há 2 dias. Superou.
    expect(recordes.find((r) => r.exercicioId === 'agachamento-livre')?.novo).toBe(true);
    // Supino: 40 × 12 há 10 dias e de novo há 5 — igualar não é bater.
    const supino = recordes.find((r) => r.exercicioId === 'supino-reto-barra')!;
    expect(supino.novo).toBe(false);
    expect(diasEntre(supino.fimMs, AGORA)).toBe(10);
    // Barra fixa é peso corporal: 1RM 0, fica de fora.
    expect(recordes.some((r) => r.exercicioId === 'barra-fixa')).toBe(false);
  });

  it('primeira vez no exercício não é recorde batido, e recorde antigo apaga o ouro', () => {
    const primeira = recordesRecentes([sessao('1', 'A', 1, [serie('crossover', 10, 10), serie('crossover', 12, 10, 1)])]);
    expect(primeira[0].novo).toBe(false);

    const antigo = recordesRecentes([
      sessao('1', 'A', 9, [serie('crossover', 10, 10)]),
      sessao('2', 'A', 5, [serie('crossover', 12, 10)]),
      sessao('3', 'A', 1, [serie('crossover', 8, 10)]),
    ]);
    expect(antigo[0].novo).toBe(false);
  });

  it('mais recentes primeiro, respeitando o limite', () => {
    const r = recordesRecentes([
      sessao('1', 'A', 9, [serie('crossover', 10, 10)]),
      sessao('2', 'B', 2, [serie('rosca-direta', 10, 20)]),
    ], 1);
    expect(r.map((x) => x.exercicioId)).toEqual(['rosca-direta']);
  });
});

describe('Exportar CSV (tela 21)', () => {
  it('escapa ponto e vírgula, aspas e quebra de linha (RFC 4180), e a vírgula do texto', () => {
    expect(escaparCampo('Supino reto')).toBe('Supino reto');
    expect(escaparCampo('Rosca 21; pesada')).toBe('"Rosca 21; pesada"');
    expect(escaparCampo('Rosca 21, pesada')).toBe('"Rosca 21, pesada"');
    expect(escaparCampo('Remada "cavalinho"')).toBe('"Remada ""cavalinho"""');
    expect(escaparCampo('linha\nquebrada')).toBe('"linha\nquebrada"');
  });

  it('número sai com vírgula decimal e sem aspas, para o Excel em pt-BR ler como número', () => {
    expect(escaparCampo(42.5)).toBe('42,5');
    expect(escaparCampo(1.25)).toBe('1,25');
    expect(escaparCampo(40)).toBe('40');
  });

  it('uma linha por série, separada por ponto e vírgula, da sessão mais antiga para a mais nova, com CRLF', () => {
    const sessoes = [
      sessao('2', 'B', 1, [serie('rosca-direta', 10, 25, 0)]),
      sessao('1', 'A', 3, [serie('supino-reto-barra', 12, 42.5, 0, 38), serie('supino-reto-barra', 11, 42.5, 1)]),
    ];
    const nomes: Record<string, string> = { 'supino-reto-barra': 'Supino; reto', 'rosca-direta': 'Rosca "direta"' };
    const linhas = gerarCsv(sessoes, (id) => nomes[id]).split('\r\n');

    expect(linhas[0]).toBe(CABECALHO_CSV.join(';'));
    expect(linhas).toHaveLength(4);
    expect(linhas[1]).toBe(`${formatarDataCsv(AGORA - 3 * DIA_MS)};A;"Supino; reto";1;12;42,5;38`);
    expect(linhas[2]).toBe(`${formatarDataCsv(AGORA - 3 * DIA_MS)};A;"Supino; reto";2;11;42,5;`);
    expect(linhas[3]).toBe(`${formatarDataCsv(AGORA - DIA_MS)};B;"Rosca ""direta""";1;10;25;`);
  });

  it('data no formato AAAA-MM-DD HH:MM, e histórico vazio vira só o cabeçalho', () => {
    expect(formatarDataCsv(new Date(2026, 0, 5, 7, 3).getTime())).toBe('2026-01-05 07:03');
    expect(gerarCsv([], (id) => id)).toBe('data;treino;exercicio;serie;reps;carga_kg;duracao_s');
  });
});
