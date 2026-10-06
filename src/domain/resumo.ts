import { formatarMilhar } from '@/lib/formato';

import { melhor1RM, tonelagem } from './forca';
import { ultimasSeriesDe, type SessaoFechada } from './historico';
import { proximoAlvo } from './progressao';
import type { Alvo, ItemDeTreino, SerieRegistrada } from './types';

/**
 * `CAR-7` no Resumo — a frase que compara o treino de hoje com a mesma letra da vez anterior.
 *
 * ⚠️ A tonelagem CAI no dia em que a carga sobe: a `CAR-1` sobe a carga e devolve as reps ao
 * piso da faixa (supino 4 × 12 × 40 = 1.920 kg vira 4 × 8 × 42,5 = 1.360 kg). Gritar "− 384 kg"
 * no dia em que o usuário PROGREDIU é punir o acerto (o mesmo espírito da `CAR-3.1`).
 * Decisão de produto:
 *  - variação positiva (ou igual) → mostra o delta, é o caso feliz da `CAR-7`;
 *  - caiu, mas a carga subiu em algum exercício → o destaque vira "Carga subiu em N exercícios"
 *    e o volume menor continua na tela, numa linha de detalhe que explica o porquê;
 *  - caiu sem carga nova → mostra a queda, em tom neutro, sem sinal de alarme.
 * Nenhum número é escondido: só muda o que vai em destaque.
 */

/** Quantos exercícios desta sessão foram feitos com carga maior que na última vez deles. */
export function exerciciosComCargaMaior(
  registradas: readonly SerieRegistrada[],
  anteriores: readonly SessaoFechada[],
): number {
  const ids = [...new Set(registradas.map((r) => r.exercicioId))];
  return ids.filter((id) => {
    const antes = ultimasSeriesDe(anteriores, id);
    if (antes.length === 0) return false; // primeira vez não é "subiu"
    const maxAntes = Math.max(...antes.map((s) => s.cargaKg));
    const maxHoje = Math.max(...registradas.filter((r) => r.exercicioId === id).map((r) => r.cargaKg));
    return maxHoje > maxAntes;
  }).length;
}

export interface ComparacaoDoResumo {
  /** A linha logo abaixo da tonelagem. */
  destaque: string;
  /** Linha secundária, quando o destaque precisa de contexto. */
  detalhe?: string;
}

export function comparacaoDoResumo(params: {
  tonelagem: number;
  tonelagemAnterior: number;
  cargasQueSubiram: number;
  letra: string;
}): ComparacaoDoResumo {
  const { tonelagem, tonelagemAnterior, cargasQueSubiram, letra } = params;
  if (tonelagemAnterior <= 0) return { destaque: `Primeiro treino ${letra} registrado` };

  const delta = Math.round(tonelagem - tonelagemAnterior);
  if (delta > 0) return { destaque: `+ ${formatarMilhar(delta)} kg em relação ao último ${letra}` };
  if (delta === 0) return { destaque: `Mesma tonelagem do último ${letra}` };

  const queda = formatarMilhar(-delta);
  if (cargasQueSubiram > 0) {
    const exercicios = cargasQueSubiram === 1 ? 'exercício' : 'exercícios';
    return {
      destaque: `Carga subiu em ${cargasQueSubiram} ${exercicios}`,
      detalhe: `${queda} kg de volume abaixo do último ${letra}: com carga nova, as reps voltam ao piso da faixa.`,
    };
  }
  return { destaque: `${queda} kg abaixo do último ${letra}` };
}

/**
 * O Resumo, exercício por exercício: o que você fez, como foi contra a última vez e — a tese do
 * app — o que bater na próxima (`CAR-1` aplicada às séries de hoje).
 *
 * A comparação nunca é vermelha nem culpa ninguém (`CAR-3.1`): "carga subiu", "+3 reps",
 * "igual à última vez", "2 reps a menos", "carga mais leve" ou "primeira vez".
 */
export type ComparacaoDoExercicio =
  | { tipo: 'primeira-vez' }
  | { tipo: 'carga-subiu'; deltaKg: number }
  | { tipo: 'carga-menor'; deltaKg: number }
  | { tipo: 'mais-reps'; deltaReps: number }
  | { tipo: 'menos-reps'; deltaReps: number }
  | { tipo: 'igual' };

export interface ExercicioDoResumo {
  exercicioId: string;
  series: SerieRegistrada[];
  tonelagem: number;
  comparacao: ComparacaoDoExercicio;
  /** O alvo da próxima vez (a 1ª série), ou nulo quando o exercício saiu do plano. */
  proximaVez: Alvo | null;
}

export function compararComUltimaVez(
  hoje: readonly SerieRegistrada[],
  ultimaVez: readonly SerieRegistrada[],
): ComparacaoDoExercicio {
  if (ultimaVez.length === 0) return { tipo: 'primeira-vez' };
  const cargaHoje = Math.max(...hoje.map((s) => s.cargaKg));
  const cargaAntes = Math.max(...ultimaVez.map((s) => s.cargaKg));
  if (cargaHoje > cargaAntes) return { tipo: 'carga-subiu', deltaKg: cargaHoje - cargaAntes };
  if (cargaHoje < cargaAntes) return { tipo: 'carga-menor', deltaKg: cargaAntes - cargaHoje };
  const repsHoje = hoje.reduce((t, s) => t + s.reps, 0);
  const repsAntes = ultimaVez.reduce((t, s) => t + s.reps, 0);
  if (repsHoje > repsAntes) return { tipo: 'mais-reps', deltaReps: repsHoje - repsAntes };
  if (repsHoje < repsAntes) return { tipo: 'menos-reps', deltaReps: repsAntes - repsHoje };
  return { tipo: 'igual' };
}

/** A frase curta da comparação, para a tela. */
export function frasesDaComparacao(c: ComparacaoDoExercicio, kg: (n: number) => string): string {
  switch (c.tipo) {
    case 'primeira-vez': return 'Primeira vez';
    case 'carga-subiu': return `Carga subiu ${kg(c.deltaKg)} kg`;
    case 'carga-menor': return `Carga ${kg(c.deltaKg)} kg mais leve`;
    case 'mais-reps': return `+${c.deltaReps} ${c.deltaReps === 1 ? 'rep' : 'reps'} que da última vez`;
    case 'menos-reps': return `${c.deltaReps} ${c.deltaReps === 1 ? 'rep' : 'reps'} a menos que da última vez`;
    case 'igual': return 'Igual à última vez';
  }
}

export function resumoPorExercicio(params: {
  registradas: readonly SerieRegistrada[];
  anteriores: readonly SessaoFechada[];
  /** Os itens do treino como foram feitos hoje (já com a troca de exercício aplicada). */
  itens: readonly ItemDeTreino[];
  incrementoDe: (exercicioId: string) => number;
}): ExercicioDoResumo[] {
  const { registradas, anteriores, itens, incrementoDe } = params;
  const ordem = [...new Set(registradas.map((r) => r.exercicioId))];
  return ordem.map((exercicioId) => {
    const series = registradas.filter((r) => r.exercicioId === exercicioId);
    const item = itens.find((i) => i.exercicioId === exercicioId);
    const proximaVez = item
      ? proximoAlvo({
          ultimaSessao: series,
          faixa: item.faixa,
          cargaAtualKg: item.cargaKg,
          incrementoKg: incrementoDe(exercicioId),
          series: item.series,
        })[0] ?? null
      : null;
    return {
      exercicioId,
      series,
      tonelagem: tonelagem(series),
      comparacao: compararComUltimaVez(series, ultimasSeriesDe(anteriores, exercicioId)),
      proximaVez,
    };
  });
}

/** Os recordes do dia (`CAR-5`): exercícios cujo melhor 1RM de hoje supera o de antes. */
export function recordesDoDia(
  registradas: readonly SerieRegistrada[],
  recordeAnterior: (exercicioId: string) => number,
): { exercicioId: string; novo: number; antigo: number }[] {
  return [...new Set(registradas.map((r) => r.exercicioId))]
    .map((exercicioId) => ({
      exercicioId,
      novo: melhor1RM(registradas.filter((r) => r.exercicioId === exercicioId)),
      antigo: recordeAnterior(exercicioId),
    }))
    // primeira vez no exercício não é recorde: não havia o que bater
    .filter((r) => r.antigo > 0 && r.novo > r.antigo)
    .sort((a, b) => b.novo - a.novo);
}

const NOMES_DOS_DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** RN-16/RN-20 — quando é o próximo dia de treino do plano: "amanhã", "quarta" ou nulo. */
export function proximoDiaDeTreino(dias: readonly number[], agoraMs: number): string | null {
  if (dias.length === 0) return null;
  const hoje = new Date(agoraMs).getDay();
  for (let k = 1; k <= 7; k++) {
    const dia = (hoje + k) % 7;
    if (dias.includes(dia)) return k === 1 ? 'amanhã' : k === 7 ? `${NOMES_DOS_DIAS[dia]} que vem` : NOMES_DOS_DIAS[dia];
  }
  return null;
}

export interface ProgressoDoTreino {
  /** Exercícios que evoluíram contra a última vez: carga nova ou mais repetições. */
  evoluiu: number;
  comCargaNova: number;
  comMaisReps: number;
  /** Exercícios feitos pela primeira vez (não há com o que comparar). */
  primeiraVez: number;
  total: number;
}

/**
 * O destaque do Resumo: em quantos exercícios você EVOLUIU. Substitui a tonelagem como número
 * dominante — ninguém treina para mover "3.705 kg"; treina para subir a carga e as repetições,
 * que é o que a dupla progressão (`CAR-1`) mede.
 */
export function progressoDoTreino(exercicios: readonly ExercicioDoResumo[]): ProgressoDoTreino {
  const comCargaNova = exercicios.filter((e) => e.comparacao.tipo === 'carga-subiu').length;
  const comMaisReps = exercicios.filter((e) => e.comparacao.tipo === 'mais-reps').length;
  return {
    evoluiu: comCargaNova + comMaisReps,
    comCargaNova,
    comMaisReps,
    primeiraVez: exercicios.filter((e) => e.comparacao.tipo === 'primeira-vez').length,
    total: exercicios.length,
  };
}

/** A frase do destaque e a linha de detalhe, sem culpa (`CAR-3.1`). */
export function fraseDoProgresso(p: ProgressoDoTreino): { destaque: string; detalhe: string | null } {
  if (p.total > 0 && p.primeiraVez === p.total) {
    return { destaque: 'Primeiro registro destes exercícios', detalhe: 'A partir de agora o app sabe o que você bate — e propõe o próximo passo.' };
  }
  if (p.evoluiu === 0) {
    return { destaque: 'Treino feito', detalhe: 'Igual à última vez. Na próxima, o alvo de cada série já está ajustado.' };
  }
  const partes = [
    p.comCargaNova > 0 ? `${p.comCargaNova} com carga nova` : null,
    p.comMaisReps > 0 ? `${p.comMaisReps} com mais repetições` : null,
  ].filter(Boolean);
  const comparaveis = p.total - p.primeiraVez;
  return {
    destaque: `Você evoluiu em ${p.evoluiu} de ${comparaveis} ${comparaveis === 1 ? 'exercício' : 'exercícios'}`,
    detalhe: partes.join(' · '),
  };
}
