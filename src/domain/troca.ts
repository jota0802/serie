import { ordenarPorFim, ultimasSeriesDe, type SessaoFechada } from './historico';
import { arredondarParaAnilha, proximoAlvo } from './progressao';
import type { Alvo, Equipamento, Exercicio, ItemDeTreino, SerieRegistrada, Treino } from './types';

/**
 * `CAR-9` — Troca por padrão de movimento. Aparelho ocupado é o problema nº 1 da
 * academia real; aqui mora a regra de O QUE pode entrar no lugar e COM QUE CARGA.
 * Funções puras: testadas em `__tests__/troca.test.ts`, sem tela nenhuma.
 */

/**
 * As variações que podem entrar no lugar de `exercicio`.
 *
 * 1. Mesmo `padrao` — é o que a CAR-9 promete.
 * 2. Mesmo `grupo` — ⚠️ sem isso, `isolado` virava saco de gatos: trocar tríceps
 *    oferecia prancha. E vale para composto também: paralelas está em empurrar-vertical
 *    mas é tríceps, não substitui desenvolvimento.
 * 3. Composto só troca por composto — crucifixo não segura o lugar do supino. O
 *    contrário pode: sem polia livre, o supino trabalha o mesmo peito.
 *
 * Ordem: o catálogo, com o peso do corpo no fim — é o último recurso, não a sugestão.
 */
export function alternativas(exercicio: Exercicio, catalogo: readonly Exercicio[]): Exercicio[] {
  const candidatas = catalogo.filter(
    (e) =>
      e.id !== exercicio.id &&
      e.padrao === exercicio.padrao &&
      e.grupo === exercicio.grupo &&
      (!exercicio.composto || e.composto),
  );
  const comCarga = candidatas.filter((e) => e.unidade !== 'corporal');
  const corporais = candidatas.filter((e) => e.unidade === 'corporal');
  return [...comCarga, ...corporais];
}

/**
 * O que a tela 16 oferece para o item da vez NESTA sessão.
 *
 * - Parte do exercício do PLANO, não do que está no item agora: depois de trocar crossover
 *   por supino, voltar ao crossover não pode esbarrar em "composto não vira isolado".
 * - O do plano volta à lista (em primeiro) quando outro tomou o lugar dele: o aparelho vagou.
 * - ⚠️ Fica de fora o que já está em OUTRO item da sessão (`ocupados`). A sessão conta as
 *   séries por exercício: trocar tríceps corda por francês (o item seguinte) fazia o francês
 *   nascer com 3 séries "feitas", travava a troca dele e misturava os dois no histórico.
 */
export function alternativasNaSessao(params: {
  original: Exercicio;
  atualId: string;
  ocupados: ReadonlySet<string>;
  catalogo: readonly Exercicio[];
}): Exercicio[] {
  const { original, atualId, ocupados, catalogo } = params;
  return [original, ...alternativas(original, catalogo)].filter(
    (e) => e.id !== atualId && !ocupados.has(e.id),
  );
}

/**
 * Quanto cada equipamento "pesa" em relação à barra, para o mesmo esforço.
 * Números redondos de propósito: é PALPITE declarado (CAR-9.1), não fisiologia.
 * Halteres é por mão: supino de 42,5 kg na barra ≈ 17 kg em cada halter.
 * O aparelho que foge da regra (leg press, búlgaro, francês) corrige no catálogo (`fatorDeCarga`).
 */
export const FATOR_DE_CARGA: Record<Exclude<Equipamento, 'corporal'>, number> = {
  barra: 1,
  halteres: 0.4,
  maquina: 1.1,
  polia: 0.9,
};

const fatorDe = (e: Exercicio): number | null => {
  const eq = e.equipamento ?? (e.unidade === 'corporal' ? 'corporal' : 'barra');
  if (eq === 'corporal' || e.unidade === 'corporal') return null;
  return e.fatorDeCarga ?? FATOR_DE_CARGA[eq];
};

/**
 * `CAR-9.1` — a carga estimada na variação nova, a partir da carga no exercício de origem.
 * Converte pela razão dos fatores e arredonda para a anilha do destino.
 * `null` quando não dá para estimar (um dos dois é peso do corpo): melhor admitir do que inventar.
 */
export function estimarCarga(params: { de: Exercicio; cargaDeKg: number; para: Exercicio }): number | null {
  const { de, cargaDeKg, para } = params;
  const fDe = fatorDe(de);
  const fPara = fatorDe(para);
  if (fDe == null || fPara == null || cargaDeKg <= 0) return null;
  const estimada = arredondarParaAnilha((cargaDeKg / fDe) * fPara, para.incrementoKg);
  // Nunca zero: arredondar 1 kg com anilha de 2 dava halter vazio.
  return Math.max(estimada, para.incrementoKg);
}

/** Uma carga conhecida num exercício — a matéria-prima da estimativa (`CAR-9.1`). */
export interface Referencia {
  exercicio: Exercicio;
  cargaKg: number;
}

/**
 * Mesma família para fins de carga: padrão, grupo e tipo. ⚠️ O tipo importa: 12 kg de
 * crucifixo não dizem nada sobre o supino — convertidos, davam 15 kg na máquina.
 */
const mesmaFamilia = (a: Exercicio, b: Exercicio) =>
  a.padrao === b.padrao && a.grupo === b.grupo && a.composto === b.composto;

/**
 * `CAR-9.1` — a carga estimada para `para`: a primeira referência da mesma família que
 * converte, e de onde ela veio. A ordem da lista é a ordem de confiança.
 */
export function estimarPelaReferencia(
  para: Exercicio,
  referencias: readonly Referencia[],
): { cargaKg: number; base: Exercicio } | null {
  for (const r of referencias) {
    if (!mesmaFamilia(r.exercicio, para)) continue;
    const cargaKg = estimarCarga({ de: r.exercicio, cargaDeKg: r.cargaKg, para });
    if (cargaKg != null) return { cargaKg, base: r.exercicio };
  }
  return null;
}

/** A maior carga de uma sessão — a referência de "quanto você levantou ali". */
const maiorCarga = (series: readonly SerieRegistrada[]) => Math.max(0, ...series.map((s) => s.cargaKg));

/**
 * A carga mais recente de cada exercício já feito. `sessoes` vem da mais nova para a
 * mais velha (a de hoje primeiro) e, dentro de uma sessão, o último exercício feito vem
 * antes. A carga é a maior daquele exercício naquela sessão.
 */
export function cargasRecentes(
  sessoes: readonly (readonly SerieRegistrada[])[],
  porId: ReadonlyMap<string, Exercicio>,
): Referencia[] {
  const vistos = new Set<string>();
  const referencias: Referencia[] = [];
  for (const series of sessoes) {
    for (const id of [...new Set(series.map((s) => s.exercicioId))].reverse()) {
      const exercicio = porId.get(id);
      if (!exercicio || vistos.has(id)) continue;
      vistos.add(id);
      referencias.push({ exercicio, cargaKg: maiorCarga(series.filter((s) => s.exercicioId === id)) });
    }
  }
  return referencias;
}

/** O resultado da `CAR-9.1` para um item trocado. */
export interface AlvosDaTroca {
  alvos: Alvo[];
  /** De onde saiu a carga estimada: a tela diz "estimado pela carga de supino reto". */
  base?: Exercicio;
  /**
   * Primeira vez, com carga, e nada da mesma família para converter. A carga vem 0 e a tela
   * PEDE a carga ao usuário, em vez de mostrar "0 kg" como se fosse sugestão.
   */
  semReferencia: boolean;
}

/**
 * `CAR-9.1` — os alvos de hoje quando o item do plano dá lugar a `novo`.
 *
 * - `novo` é o próprio exercício do plano → `CAR-1` normal (trocar pelo mesmo é não trocar).
 * - Já fez `novo` antes → `CAR-1` sobre o histórico DELE, com a carga dele (da segunda vez
 *   em diante, histórico real).
 * - Primeira vez → carga estimada, reps no piso da faixa, origem `estimado`. A referência,
 *   em ordem de confiança: o alvo de hoje do exercício que saiu → a carga mais recente da
 *   mesma família (hoje, depois o histórico: "o histórico segue o padrão") → a do plano.
 *   ⚠️ Herdar a carga do original direto era o bug: 40 kg de barra viravam 40 kg POR MÃO,
 *   e a barra fixa (peso do corpo) virava "0 kg" na puxada.
 */
export function alvosDaTroca(params: {
  /** O item como está NO PLANO (exercício, faixa, séries, carga). */
  item: ItemDeTreino;
  novo: Exercicio;
  porId: ReadonlyMap<string, Exercicio>;
  /** O histórico SEM a sessão aberta. */
  anteriores: readonly SessaoFechada[];
  /** As séries já feitas hoje: a referência mais fresca que existe. */
  registradasHoje?: readonly SerieRegistrada[];
  /** Os treinos do plano — último recurso, a carga que eles prescrevem. */
  planos?: readonly Treino[];
}): AlvosDaTroca {
  const { item, novo, porId, anteriores, registradasHoje = [], planos = [] } = params;
  const original = porId.get(item.exercicioId);

  const alvosDoOriginal = proximoAlvo({
    ultimaSessao: ultimasSeriesDe(anteriores, item.exercicioId),
    faixa: item.faixa,
    cargaAtualKg: item.cargaKg,
    incrementoKg: original?.incrementoKg ?? 2.5,
    series: item.series,
  });
  if (novo.id === item.exercicioId) return { alvos: alvosDoOriginal, semReferencia: false };

  const ultimaDoNovo = ultimasSeriesDe(anteriores, novo.id);
  if (ultimaDoNovo.length > 0) {
    const alvos = proximoAlvo({
      ultimaSessao: ultimaDoNovo,
      faixa: item.faixa,
      cargaAtualKg: maiorCarga(ultimaDoNovo),
      incrementoKg: novo.incrementoKg,
      series: item.series,
    });
    return { alvos, semReferencia: false };
  }

  const doPlano = planos
    .flatMap((t) => t.itens)
    // A carga que o plano dá ao PRÓPRIO exercício novo vem antes da dos parentes dele.
    .sort((a, b) => Number(b.exercicioId === novo.id) - Number(a.exercicioId === novo.id))
    .flatMap((i) => {
      const exercicio = porId.get(i.exercicioId);
      return exercicio ? [{ exercicio, cargaKg: i.cargaKg }] : [];
    });
  const referencias: Referencia[] = [
    ...(original ? [{ exercicio: original, cargaKg: alvosDoOriginal[0]?.cargaKg ?? item.cargaKg }] : []),
    ...cargasRecentes([registradasHoje, ...ordenarPorFim(anteriores).map((s) => s.series)], porId),
    ...doPlano,
  ];

  const corporal = novo.unidade === 'corporal';
  const estimativa = corporal ? null : estimarPelaReferencia(novo, referencias);
  const cargaKg = estimativa?.cargaKg ?? 0;
  return {
    alvos: Array.from({ length: item.series }, () => ({ cargaKg, reps: item.faixa.min, origem: 'estimado' as const })),
    base: estimativa?.base,
    semReferencia: !corporal && !estimativa,
  };
}

/**
 * Depois da primeira série na variação nova, o palpite cede ao fato: as séries que faltam
 * miram a carga que você acabou de usar. Sem isto, corrigir 45 → 40 na 1ª série não
 * adiantava — a 2ª chegava de novo com 45 no campo, e um toque em confirmar (`CAR-2`)
 * gravava no histórico uma carga que você já tinha recusado.
 */
export function ajustarEstimativa(alvos: Alvo[], feitas: readonly SerieRegistrada[]): Alvo[] {
  const ultima = feitas[feitas.length - 1];
  if (!ultima) return alvos;
  return alvos.map((a, i) => (i >= feitas.length && a.origem === 'estimado' ? { ...a, cargaKg: ultima.cargaKg } : a));
}
