import type { Exercicio, GrupoMuscular, SerieRegistrada } from './types';

/**
 * `CAR-4` — Volume semanal por grupo muscular.
 *
 * Soma de séries por grupo na semana corrente, contra a faixa de referência de
 * 10 a 20 séries. É a única métrica "de treinador" do app, e ela existe para
 * responder uma pergunta só: O QUE EU ESTOU NEGLIGENCIANDO?
 */

export const FAIXA_DE_VOLUME = { min: 10, max: 20 } as const;

export type EstadoDeVolume = 'abaixo' | 'na-faixa' | 'acima';

export interface VolumeDoGrupo {
  grupo: GrupoMuscular;
  series: number;
  estado: EstadoDeVolume;
}

export function classificarVolume(series: number): EstadoDeVolume {
  if (series < FAIXA_DE_VOLUME.min) return 'abaixo';
  if (series > FAIXA_DE_VOLUME.max) return 'acima';
  return 'na-faixa';
}

export function volumeSemanal(
  series: SerieRegistrada[],
  exercicios: ReadonlyMap<string, Exercicio>,
): VolumeDoGrupo[] {
  const contagem = new Map<GrupoMuscular, number>();

  for (const s of series) {
    const exercicio = exercicios.get(s.exercicioId);
    if (!exercicio) continue;
    contagem.set(exercicio.grupo, (contagem.get(exercicio.grupo) ?? 0) + 1);
  }

  return [...contagem.entries()]
    .map(([grupo, total]) => ({ grupo, series: total, estado: classificarVolume(total) }))
    .sort((a, b) => b.series - a.series);
}
