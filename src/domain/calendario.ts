import { umRepMaximo } from './forca';
import type { SessaoFechada } from './historico';

/**
 * O calendário do Início: o heatmap do ano e a sequência de semanas.
 *
 * Regras (ver `docs/regras-do-app.md`, RN-50 a RN-54):
 * - RN-50 · o heatmap mostra 53 semanas, de domingo a sábado; a última coluna é a semana de hoje,
 *   e os dias depois de hoje aparecem vazios ("futuro"), nunca como dia sem treino;
 * - RN-51 · a intensidade do dia é o NÚMERO DE SÉRIES, em faixas fixas — auditável, igual para
 *   todo mundo, e não muda quando um treino gigante entra no histórico;
 * - RN-52 · dia com recorde (`CAR-5`) ganha o ouro — o único lugar de cor, como no resto do app;
 * - RN-53 · a sequência conta SEMANAS que bateram a meta (dias de treino do plano), não dias
 *   seguidos: na academia o descanso faz parte do treino, e "dias seguidos" puniria quem descansa;
 * - RN-54 · as datas são do fuso do aparelho: o treino das 23h de segunda é de segunda.
 */

export type Nivel = 0 | 1 | 2 | 3 | 4;

export interface DiaDoCalendario {
  /** AAAA-MM-DD no fuso do aparelho. */
  data: string;
  /** Meia-noite local do dia, em ms. */
  inicioMs: number;
  series: number;
  sessoes: number;
  nivel: Nivel;
  /** Algum exercício bateu o recorde neste dia (`CAR-5`). */
  recorde: boolean;
  futuro: boolean;
  hoje: boolean;
}

/** RN-51 — faixas de séries por dia. Um treino típico do app tem 15–20 séries. */
export const FAIXAS_DO_NIVEL: readonly { nivel: Nivel; minimo: number }[] = [
  { nivel: 4, minimo: 25 },
  { nivel: 3, minimo: 16 },
  { nivel: 2, minimo: 9 },
  { nivel: 1, minimo: 1 },
];

export function nivelDoDia(series: number): Nivel {
  return FAIXAS_DO_NIVEL.find((f) => series >= f.minimo)?.nivel ?? 0;
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** RN-54 — a data local (AAAA-MM-DD) de um instante. */
export function chaveDoDia(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}

/** Meia-noite local do dia de `ms`. */
export function inicioDoDia(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Domingo 00:00 (local) da semana de `ms`. */
export function inicioDaSemana(ms: number): number {
  const d = new Date(inicioDoDia(ms));
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

/** Soma dias no calendário local (não 24 h: o horário de verão não pode pular nem repetir dia). */
function somarDias(ms: number, dias: number): number {
  const d = new Date(ms);
  d.setDate(d.getDate() + dias);
  return d.getTime();
}

/**
 * RN-52 — os dias (AAAA-MM-DD) em que algum exercício superou o melhor 1RM anterior.
 * A primeira vez num exercício NÃO é recorde: não havia o que bater (mesma regra do resumo).
 */
export function diasComRecorde(sessoes: readonly SessaoFechada[]): Set<string> {
  const melhor = new Map<string, number>();
  const dias = new Set<string>();
  for (const sessao of [...sessoes].sort((a, b) => a.fimMs - b.fimMs)) {
    const daSessao = new Map<string, number>();
    for (const s of sessao.series) {
      daSessao.set(s.exercicioId, Math.max(daSessao.get(s.exercicioId) ?? 0, umRepMaximo(s.cargaKg, s.reps)));
    }
    for (const [id, valor] of daSessao) {
      const antes = melhor.get(id) ?? 0;
      if (antes > 0 && valor > antes) dias.add(chaveDoDia(sessao.fimMs));
      melhor.set(id, Math.max(antes, valor));
    }
  }
  return dias;
}

/** Séries e sessões por dia (AAAA-MM-DD). */
export function porDia(sessoes: readonly SessaoFechada[]): Map<string, { series: number; sessoes: number }> {
  const mapa = new Map<string, { series: number; sessoes: number }>();
  for (const s of sessoes) {
    const chave = chaveDoDia(s.fimMs);
    const atual = mapa.get(chave) ?? { series: 0, sessoes: 0 };
    mapa.set(chave, { series: atual.series + s.series.length, sessoes: atual.sessoes + 1 });
  }
  return mapa;
}

/**
 * RN-50 — o heatmap: `semanas` colunas de 7 dias (domingo → sábado), a última com o dia de hoje.
 */
export function calendarioDoHeatmap(
  sessoes: readonly SessaoFechada[],
  agoraMs: number,
  semanas = 53,
): DiaDoCalendario[][] {
  const contagem = porDia(sessoes);
  const recordes = diasComRecorde(sessoes);
  const hoje = chaveDoDia(agoraMs);
  const inicioHoje = inicioDoDia(agoraMs);
  const primeiroDomingo = somarDias(inicioDaSemana(agoraMs), -7 * (semanas - 1));

  const colunas: DiaDoCalendario[][] = [];
  for (let w = 0; w < semanas; w++) {
    const coluna: DiaDoCalendario[] = [];
    for (let d = 0; d < 7; d++) {
      const inicioMs = somarDias(primeiroDomingo, w * 7 + d);
      const data = chaveDoDia(inicioMs);
      const futuro = inicioMs > inicioHoje;
      const { series, sessoes: n } = futuro ? { series: 0, sessoes: 0 } : (contagem.get(data) ?? { series: 0, sessoes: 0 });
      coluna.push({
        data,
        inicioMs,
        series,
        sessoes: n,
        nivel: nivelDoDia(series),
        recorde: !futuro && recordes.has(data),
        futuro,
        hoje: data === hoje,
      });
    }
    colunas.push(coluna);
  }
  return colunas;
}

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Os rótulos de mês sobre o heatmap: na primeira coluna em que o mês aparece. */
export function rotulosDosMeses(colunas: readonly DiaDoCalendario[][]): { coluna: number; rotulo: string }[] {
  const rotulos: { coluna: number; rotulo: string }[] = [];
  let anterior = -1;
  colunas.forEach((coluna, i) => {
    const mes = new Date(coluna[0].inicioMs).getMonth();
    if (mes !== anterior) {
      // Não rotula a primeira coluna se ela for só a "ponta" de um mês (menos de 2 semanas dele):
      // o rótulo ficaria espremido contra o próximo.
      const proximaMudaMes = colunas[i + 1] && new Date(colunas[i + 1][0].inicioMs).getMonth() !== mes;
      if (!(i === 0 && proximaMudaMes)) rotulos.push({ coluna: i, rotulo: MESES_CURTOS[mes] });
      anterior = mes;
    }
  });
  return rotulos;
}

/** As sessões terminadas num dia (AAAA-MM-DD), da mais antiga para a mais nova. */
export function sessoesDoDia(sessoes: readonly SessaoFechada[], data: string): SessaoFechada[] {
  return sessoes.filter((s) => chaveDoDia(s.fimMs) === data).sort((a, b) => a.fimMs - b.fimMs);
}

/**
 * RN-53 — quantas semanas seguidas bateram a meta (`meta` treinos na semana).
 *
 * A semana atual só ENTRA na conta quando já bateu a meta; enquanto não bateu, ela não quebra a
 * sequência (ainda dá tempo). Meta 0 ou negativa não tem sequência.
 */
export function semanasSeguidasNaMeta(sessoes: readonly SessaoFechada[], meta: number, agoraMs: number): number {
  if (meta <= 0) return 0;
  const porSemana = new Map<number, number>();
  for (const s of sessoes) {
    if (s.fimMs > agoraMs) continue;
    const semana = inicioDaSemana(s.fimMs);
    porSemana.set(semana, (porSemana.get(semana) ?? 0) + 1);
  }
  let semana = inicioDaSemana(agoraMs);
  let total = 0;
  if ((porSemana.get(semana) ?? 0) >= meta) total++;
  semana = somarDias(semana, -7);
  while ((porSemana.get(semana) ?? 0) >= meta) {
    total++;
    semana = somarDias(semana, -7);
  }
  return total;
}

/** Quantos treinos nos últimos 365 dias (o número que acompanha o heatmap). */
export function treinosNoUltimoAno(sessoes: readonly SessaoFechada[], agoraMs: number): number {
  const desde = somarDias(inicioDoDia(agoraMs), -364);
  return sessoes.filter((s) => s.fimMs >= desde && s.fimMs <= agoraMs).length;
}
