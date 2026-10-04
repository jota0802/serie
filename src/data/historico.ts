import type { SessaoFechada } from '@/domain/historico';
import type { SerieRegistrada } from '@/domain/types';

/**
 * As sessões que o app traz de fábrica. Mockado (CP5), e só na PRIMEIRA abertura:
 * daí em diante o histórico é o que o usuário treinou, persistido no aparelho
 * (`src/estado/historico.tsx`).
 *
 * São só séries. Recorde, tonelagem anterior e "a última vez" NÃO são guardados à parte —
 * saem destas séries pelas regras (`src/domain/historico.ts`). O mock antigo guardava os três
 * separados e se contradizia: a tonelagem anterior do A não batia com a soma das séries, e o
 * recorde do tríceps era menor que o 1RM da própria última sessão.
 *
 * A última sessão do A é a que conta a história do protótipo: o supino fechou 12 repetições
 * nas QUATRO séries a 40 kg — por isso, e só por isso, o app propõe 42,5 kg hoje.
 */

const DIA_MS = 24 * 60 * 60 * 1000;

type Linha = [exercicioId: string, reps: number[], cargaKg: number];

const series = (linhas: Linha[]): SerieRegistrada[] =>
  linhas.flatMap(([exercicioId, reps, cargaKg]) =>
    reps.map((r, indice) => ({ exercicioId, indice, reps: r, cargaKg, foiAlvo: true, duracaoSegundos: 38 })),
  );

/** Sessões de exemplo, de trás para frente: quantos dias atrás, a letra e as séries. */
const SEMENTE: [diasAtras: number, treinoId: string, linhas: Linha[]][] = [
  [2, 'C', [
    ['agachamento-livre', [10, 9, 8, 8], 70],
    ['leg-press', [15, 14, 13], 160],
    ['mesa-flexora', [12, 11, 11], 35],
    ['desenvolvimento-halter', [11, 10, 9], 18],
    ['elevacao-lateral', [15, 14, 13], 8],
  ]],
  [3, 'B', [
    ['barra-fixa', [8, 7, 7, 6], 0],
    ['remada-curvada', [12, 11, 10, 10], 50],
    ['puxada-frente', [12, 11, 10], 55],
    ['rosca-direta', [12, 11, 10], 25],
    ['rosca-martelo', [12, 12, 11], 14],
  ]],
  // ⭐ a que importa: fechou a faixa no supino → hoje sobe para 42,5 kg
  [5, 'A', [
    ['supino-reto-barra', [12, 12, 12, 12], 40],
    ['supino-inclinado-halter', [11, 10, 10], 16],
    ['crossover', [14, 13, 13], 12],
    ['triceps-corda', [12, 11, 10], 25],
    ['triceps-frances', [11, 10, 10], 14],
  ]],
  [7, 'C', [
    ['agachamento-livre', [9, 8, 8, 7], 70],
    ['leg-press', [14, 13, 12], 160],
    ['mesa-flexora', [11, 11, 10], 35],
    ['desenvolvimento-halter', [10, 9, 9], 18],
    ['elevacao-lateral', [14, 13, 12], 8],
  ]],
  [8, 'B', [
    ['barra-fixa', [7, 7, 6, 6], 0],
    ['remada-curvada', [11, 10, 10, 9], 50],
    ['puxada-frente', [11, 10, 10], 55],
    ['rosca-direta', [11, 10, 10], 25],
    ['rosca-martelo', [12, 11, 10], 14],
  ]],
  [10, 'A', [
    ['supino-reto-barra', [12, 11, 11, 10], 40],
    ['supino-inclinado-halter', [10, 10, 9], 16],
    ['crossover', [13, 13, 12], 12],
    ['triceps-corda', [11, 10, 10], 25],
    ['triceps-frances', [10, 10, 9], 14],
  ]],
  [14, 'A', [
    ['supino-reto-barra', [12, 12, 12, 12], 37.5],
    ['supino-inclinado-halter', [10, 9, 9], 16],
    ['crossover', [13, 12, 12], 12],
    ['triceps-corda', [12, 12, 12], 22.5],
    ['triceps-frances', [10, 9, 9], 14],
  ]],
];

/** O histórico de fábrica, ancorado em `agoraMs` — os testes passam um relógio fixo. */
export function sessoesDeFabrica(agoraMs: number): SessaoFechada[] {
  return SEMENTE.map(([diasAtras, treinoId, linhas], i) => {
    const fimMs = agoraMs - diasAtras * DIA_MS;
    return { id: `fabrica-${i}`, treinoId, inicioMs: fimMs - 55 * 60 * 1000, fimMs, series: series(linhas) };
  });
}
