import { formatarMilhar } from '@/lib/formato';

import { ultimasSeriesDe, type SessaoFechada } from './historico';
import type { SerieRegistrada } from './types';

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
