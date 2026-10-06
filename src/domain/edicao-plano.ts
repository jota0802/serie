import { arredondarParaAnilha } from './progressao';
import { cargaDePartida, PRESCRICAO_POR_OBJETIVO, type Objetivo, type Plano } from './plano';
import type { Exercicio, ItemDeTreino, Treino } from './types';

/**
 * Editar o plano (telas 17, 18 e 19), como operações puras.
 *
 * Cada operação devolve o plano novo OU o motivo da recusa, em português, pronto para a tela.
 * Nenhuma deixa o plano num estado inválido — as regras (RN-10 a RN-19, `docs/regras-do-app.md`)
 * moram aqui, num lugar só, e as telas só perguntam.
 *
 * - RN-10 · de 1 a 6 treinos, com letras de A a F. A letra é a IDENTIDADE do treino: o histórico
 *   guarda "fiz o B", então apagar o B não renomeia o C — o próximo treino criado reusa a letra livre;
 * - RN-11 · nome do treino: 1 a 30 caracteres;
 * - RN-12 · de 1 a 12 exercícios por treino, sem repetir exercício no mesmo treino; um exercício
 *   pode ser TROCADO por outro no plano (RN-12a), mantendo séries, faixa e descanso;
 * - RN-13 · séries de 1 a 10; faixa de repetições de 1 a 50, com mínimo ≤ máximo;
 * - RN-14 · carga de 0 a 1000 kg, em passos de 0,5 kg (a menor anilha comum é 1,25 kg por lado);
 * - RN-15 · descanso por exercício de 30 s a 5 min, em passos de 15 s (vazio = o padrão da CAR-6);
 * - RN-16 · dias de treino: de 1 a 7 dias da semana; a meta semanal é a quantidade de dias;
 * - RN-17 · editar o plano NÃO mexe no histórico nem no treino em andamento (ele usa a versão da
 *   letra de quando começou) — vale a partir do próximo treino;
 * - RN-18 · exercício novo entra com a prescrição do objetivo (séries e faixa) e a carga de
 *   partida pelo peso, como na montagem — o campo nunca chega vazio (`CAR-2`);
 * - RN-19 · a dupla progressão continua pelo histórico do EXERCÍCIO: mudar a faixa ou a carga do
 *   plano muda o alvo da próxima vez, sem apagar nada do que foi feito.
 */

export const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export const LIMITES = {
  treinos: { min: 1, max: 6 },
  nome: { min: 1, max: 30 },
  itens: { min: 1, max: 12 },
  series: { min: 1, max: 10 },
  reps: { min: 1, max: 50 },
  carga: { min: 0, max: 1000, passo: 0.5 },
  descanso: { min: 30, max: 300, passo: 15 },
  dias: { min: 1, max: 7 },
} as const;

export type Resultado = { ok: true; plano: Plano } | { ok: false; motivo: string };

const ok = (plano: Plano): Resultado => ({ ok: true, plano });
const recusa = (motivo: string): Resultado => ({ ok: false, motivo });

function trocarTreino(plano: Plano, letra: string, mudar: (t: Treino) => Treino | string): Resultado {
  const treino = plano.treinos.find((t) => t.id === letra);
  if (!treino) return recusa(`O treino ${letra} não existe mais.`);
  const novo = mudar(treino);
  if (typeof novo === 'string') return recusa(novo);
  return ok({ ...plano, treinos: plano.treinos.map((t) => (t.id === letra ? novo : t)) });
}

/** Os treinos em ordem de exibição (e de rodízio). */
export function treinosEmOrdem(plano: Plano): Treino[] {
  return [...plano.treinos].sort((a, b) => a.ordem - b.ordem);
}

/** RN-10 — a primeira letra livre, ou nula quando já há 6 treinos. */
export function proximaLetraLivre(plano: Plano): string | null {
  const usadas = new Set(plano.treinos.map((t) => t.id));
  return LETRAS.find((l) => !usadas.has(l)) ?? null;
}

/** RN-18 — o item com que um exercício entra num treino. */
export function itemPadrao(exercicio: Exercicio, contexto: { objetivo: Objetivo | null; pesoKg: number | null }): ItemDeTreino {
  const prescricao = PRESCRICAO_POR_OBJETIVO[contexto.objetivo ?? 'hipertrofia'];
  return {
    exercicioId: exercicio.id,
    series: exercicio.composto ? prescricao.series.composto : prescricao.series.isolado,
    faixa: { ...(exercicio.composto ? prescricao.composto : prescricao.isolado) },
    cargaKg: cargaDePartida(exercicio, contexto.pesoKg ?? 0, prescricao.fatorDeCarga),
  };
}

export function renomearTreino(plano: Plano, letra: string, nome: string): Resultado {
  const limpo = nome.trim().replace(/\s+/g, ' ');
  if (limpo.length < LIMITES.nome.min) return recusa('Dê um nome ao treino.');
  if (limpo.length > LIMITES.nome.max) return recusa(`O nome pode ter até ${LIMITES.nome.max} caracteres.`);
  return trocarTreino(plano, letra, (t) => ({ ...t, nome: limpo }));
}

/** RN-10 + RN-12 — um treino novo já nasce com o primeiro exercício (treino vazio não existe). */
export function adicionarTreino(plano: Plano, nome: string, primeiro: ItemDeTreino): Resultado {
  const letra = proximaLetraLivre(plano);
  if (!letra) return recusa(`O plano já tem ${LIMITES.treinos.max} treinos, o máximo.`);
  const limpo = nome.trim().replace(/\s+/g, ' ') || `Treino ${letra}`;
  if (limpo.length > LIMITES.nome.max) return recusa(`O nome pode ter até ${LIMITES.nome.max} caracteres.`);
  const ordem = plano.treinos.reduce((max, t) => Math.max(max, t.ordem), -1) + 1;
  return ok({ ...plano, treinos: [...plano.treinos, { id: letra, nome: limpo, ordem, itens: [primeiro] }] });
}

/** RN-10 — apagar um treino. O último não pode sair: plano sem treino não é plano. */
export function removerTreino(plano: Plano, letra: string): Resultado {
  if (!plano.treinos.some((t) => t.id === letra)) return recusa(`O treino ${letra} não existe mais.`);
  if (plano.treinos.length <= LIMITES.treinos.min) return recusa('O plano precisa de pelo menos um treino.');
  const restantes = treinosEmOrdem(plano).filter((t) => t.id !== letra).map((t, ordem) => ({ ...t, ordem }));
  return ok({ ...plano, treinos: restantes });
}

/** Muda a posição do treino no rodízio (−1 sobe, +1 desce). */
export function moverTreino(plano: Plano, letra: string, direcao: -1 | 1): Resultado {
  const ordem = treinosEmOrdem(plano);
  const i = ordem.findIndex((t) => t.id === letra);
  if (i < 0) return recusa(`O treino ${letra} não existe mais.`);
  const j = i + direcao;
  if (j < 0 || j >= ordem.length) return ok(plano);
  [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  return ok({ ...plano, treinos: ordem.map((t, k) => ({ ...t, ordem: k })) });
}

/** RN-12 — põe um exercício no fim do treino. */
export function adicionarExercicio(plano: Plano, letra: string, item: ItemDeTreino): Resultado {
  return trocarTreino(plano, letra, (t) => {
    if (t.itens.length >= LIMITES.itens.max) return `O treino ${letra} já tem ${LIMITES.itens.max} exercícios, o máximo.`;
    if (t.itens.some((i) => i.exercicioId === item.exercicioId)) return 'Esse exercício já está neste treino.';
    return { ...t, itens: [...t.itens, item] };
  });
}

/** RN-12 — tira um exercício. O último não sai: para isso, apague o treino. */
export function removerExercicio(plano: Plano, letra: string, indice: number): Resultado {
  return trocarTreino(plano, letra, (t) => {
    if (!t.itens[indice]) return 'Esse exercício não está mais no treino.';
    if (t.itens.length <= LIMITES.itens.min) return 'O treino precisa de pelo menos um exercício. Para tirar este, apague o treino.';
    return { ...t, itens: t.itens.filter((_, i) => i !== indice) };
  });
}

/**
 * RN-12a — troca o exercício de uma posição por outro, no PLANO (não é a troca do treino em
 * andamento, a `CAR-9`). Mantém as séries, a faixa e o descanso que a pessoa ajustou; a carga
 * recomeça pela de partida do exercício novo — 50 kg na barra não são 50 kg no halter — e o
 * histórico do exercício antigo continua no histórico. O novo não pode já estar no treino.
 */
export function trocarExercicio(
  plano: Plano,
  letra: string,
  indice: number,
  novo: ItemDeTreino,
): Resultado {
  return trocarTreino(plano, letra, (t) => {
    const atual = t.itens[indice];
    if (!atual) return 'Esse exercício não está mais no treino.';
    if (atual.exercicioId === novo.exercicioId) return t;
    if (t.itens.some((i, k) => k !== indice && i.exercicioId === novo.exercicioId)) {
      return 'Esse exercício já está neste treino.';
    }
    const trocado: ItemDeTreino = {
      exercicioId: novo.exercicioId,
      series: atual.series,
      faixa: { ...atual.faixa },
      cargaKg: novo.cargaKg,
      ...(atual.descansoSegundos != null ? { descansoSegundos: atual.descansoSegundos } : {}),
    };
    return { ...t, itens: t.itens.map((i, k) => (k === indice ? trocado : i)) };
  });
}

/** Muda a ordem do exercício dentro do treino (−1 sobe, +1 desce). */
export function moverExercicio(plano: Plano, letra: string, indice: number, direcao: -1 | 1): Resultado {
  return trocarTreino(plano, letra, (t) => {
    const j = indice + direcao;
    if (!t.itens[indice] || j < 0 || j >= t.itens.length) return t;
    const itens = [...t.itens];
    [itens[indice], itens[j]] = [itens[j], itens[indice]];
    return { ...t, itens };
  });
}

export interface MudancaDeItem {
  series?: number;
  faixa?: { min: number; max: number };
  cargaKg?: number;
  /** `null` volta ao padrão da `CAR-6`. */
  descansoSegundos?: number | null;
}

/**
 * RN-13 a RN-15 — muda a prescrição de um exercício, validando cada número.
 * `agoraMs` carimba a mudança de carga (RN-19): ela passa a valer no próximo treino, mesmo com
 * histórico (sem o carimbo, a `CAR-1` seguiria a carga da última vez).
 */
export function atualizarExercicio(
  plano: Plano,
  letra: string,
  indice: number,
  mudanca: MudancaDeItem,
  agoraMs?: number,
): Resultado {
  return trocarTreino(plano, letra, (t) => {
    const atual = t.itens[indice];
    if (!atual) return 'Esse exercício não está mais no treino.';
    const novo: ItemDeTreino = { ...atual };

    if (mudanca.series !== undefined) {
      const s = Math.round(mudanca.series);
      if (s < LIMITES.series.min || s > LIMITES.series.max) return `Séries: de ${LIMITES.series.min} a ${LIMITES.series.max}.`;
      novo.series = s;
    }
    if (mudanca.faixa !== undefined) {
      const min = Math.round(mudanca.faixa.min);
      const max = Math.round(mudanca.faixa.max);
      if (min < LIMITES.reps.min || max > LIMITES.reps.max) return `Repetições: de ${LIMITES.reps.min} a ${LIMITES.reps.max}.`;
      if (min > max) return 'O mínimo de repetições não pode passar do máximo.';
      novo.faixa = { min, max };
    }
    if (mudanca.cargaKg !== undefined) {
      const c = mudanca.cargaKg;
      if (!Number.isFinite(c) || c < LIMITES.carga.min || c > LIMITES.carga.max) return `Carga: de ${LIMITES.carga.min} a ${LIMITES.carga.max} kg.`;
      novo.cargaKg = arredondarParaAnilha(c, LIMITES.carga.passo);
      if (agoraMs != null) novo.cargaDefinidaEmMs = agoraMs;
    }
    if (mudanca.descansoSegundos !== undefined) {
      if (mudanca.descansoSegundos === null) {
        delete novo.descansoSegundos;
      } else {
        const d = Math.round(mudanca.descansoSegundos / LIMITES.descanso.passo) * LIMITES.descanso.passo;
        if (d < LIMITES.descanso.min || d > LIMITES.descanso.max) return 'Descanso: de 30 s a 5 min.';
        novo.descansoSegundos = d;
      }
    }
    return { ...t, itens: t.itens.map((i, k) => (k === indice ? novo : i)) };
  });
}

/** RN-16 — os dias da semana do plano (0 = domingo). */
export function definirDias(plano: Plano, dias: readonly number[]): Resultado {
  const unicos = [...new Set(dias.map((d) => Math.round(d)))].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
  if (unicos.length < LIMITES.dias.min) return recusa('Escolha pelo menos um dia de treino.');
  return ok({ ...plano, dias: unicos });
}

/** Confere um plano inteiro contra as regras (útil para o que chega do banco ou de outra versão). */
export function problemasDoPlano(plano: Plano, catalogo: ReadonlyMap<string, Exercicio>): string[] {
  const problemas: string[] = [];
  if (plano.treinos.length < LIMITES.treinos.min || plano.treinos.length > LIMITES.treinos.max) {
    problemas.push(`O plano tem ${plano.treinos.length} treinos (de 1 a 6).`);
  }
  for (const t of plano.treinos) {
    if (!LETRAS.includes(t.id as (typeof LETRAS)[number])) problemas.push(`Letra inválida: ${t.id}.`);
    if (t.itens.length < LIMITES.itens.min || t.itens.length > LIMITES.itens.max) problemas.push(`O treino ${t.id} tem ${t.itens.length} exercícios.`);
    const vistos = new Set<string>();
    for (const i of t.itens) {
      if (!catalogo.has(i.exercicioId)) problemas.push(`Exercício desconhecido no ${t.id}: ${i.exercicioId}.`);
      if (vistos.has(i.exercicioId)) problemas.push(`Exercício repetido no ${t.id}: ${i.exercicioId}.`);
      vistos.add(i.exercicioId);
      if (i.faixa.min > i.faixa.max) problemas.push(`Faixa invertida no ${t.id}.`);
    }
  }
  if (plano.dias.length < LIMITES.dias.min) problemas.push('Sem dias de treino.');
  return problemas;
}

/** A carga do exercício no plano formatada para o rótulo "4 × 8–12 · 40 kg". */
export function descreverItem(item: ItemDeTreino, exercicio: Exercicio | undefined): string {
  const base = `${item.series} × ${item.faixa.min}–${item.faixa.max}`;
  if (exercicio?.unidade === 'corporal' && item.cargaKg === 0) return `${base} · peso do corpo`;
  return `${base} · ${String(item.cargaKg).replace('.', ',')} kg`;
}
