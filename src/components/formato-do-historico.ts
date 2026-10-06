import { tonelagem, umRepMaximo, type SerieRegistrada, type Treino } from '@/domain';
import { ordenarPorFim, type SessaoFechada } from '@/domain/historico';
import { formatarKg, formatarMilhar } from '@/lib/formato';

/**
 * O que as telas do histórico (lista e detalhe — RN-40 a RN-43) escrevem e derivam dos treinos
 * concluídos. Funções puras, sem React: testadas em `__tests__/formato-do-historico.test.ts`.
 *
 * - Datas à mão, sem `Intl`, pela mesma razão de `src/lib/formato.ts`: igual no Hermes, no iOS e no
 *   navegador, e testável sem depender do locale da máquina.
 * - O dia de um treino é o do FIM (`fimMs`), como no heatmap (`chaveDoDia`, RN-54) e na ordem do
 *   histórico (`ordenarPorFim`): as telas nunca discordam sobre "de que dia é" um treino.
 * - Nada é guardado (RN-43): recorde, volume e duração saem das séries na hora, então corrigir uma
 *   série muda a lista, o detalhe e o resto do app sem ninguém avisar ninguém.
 */

const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** 1 → "1 série" · 18 → "18 séries". */
export function plural(n: number, um: string, varios: string): string {
  return `${n} ${n === 1 ? um : varios}`;
}

/** "seg, 5 out" — a linha da lista e a pergunta de apagar. */
export function diaCurto(ms: number): string {
  const d = new Date(ms);
  return `${DIAS_CURTOS[d.getDay()]}, ${d.getDate()} ${MESES_CURTOS[d.getMonth()]}`;
}

/** "segunda, 5 de outubro" — o cabeçalho do detalhe. De outro ano, o ano vem junto. */
export function diaPorExtenso(ms: number, agoraMs?: number): string {
  const d = new Date(ms);
  const outroAno = agoraMs !== undefined && new Date(agoraMs).getFullYear() !== d.getFullYear();
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}${outroAno ? ` de ${d.getFullYear()}` : ''}`;
}

/** "19:42". */
export function hora(ms: number): string {
  const d = new Date(ms);
  return `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
}

/** "Outubro de 2026" — o título de cada mês da lista. */
export function mesPorExtenso(ms: number): string {
  const d = new Date(ms);
  const mes = MESES[d.getMonth()];
  return `${mes[0].toUpperCase()}${mes.slice(1)} de ${d.getFullYear()}`;
}

/** A mesma conta do resumo (tela 14): minutos arredondados, nunca menos de 1. */
export function minutosDoTreino(sessao: Pick<SessaoFechada, 'inicioMs' | 'fimMs'>): number {
  return Math.max(1, Math.round((sessao.fimMs - sessao.inicioMs) / 60000));
}

export function repsDe(series: readonly SerieRegistrada[]): number {
  return series.reduce((total, s) => total + s.reps, 0);
}

/**
 * "18 séries · 4.320 kg · 52 min" — a terceira linha de cada treino da lista.
 * Treino só de peso do corpo tem volume zero: no lugar de "0 kg", as repetições.
 */
export function resumoDaSessao(sessao: SessaoFechada): string {
  const volume = tonelagem(sessao.series);
  const carga = volume > 0 ? `${formatarMilhar(volume)} kg` : plural(repsDe(sessao.series), 'rep', 'reps');
  return `${plural(sessao.series.length, 'série', 'séries')} · ${carga} · ${minutosDoTreino(sessao)} min`;
}

/** O nome da letra no plano de hoje. A letra que saiu do plano vira "Treino X" (RN-10: o histórico guarda só a letra). */
export function nomeDoTreino(treinoId: string, porId: ReadonlyMap<string, Treino>): string {
  return porId.get(treinoId)?.nome ?? `Treino ${treinoId}`;
}

export interface MesDoHistorico {
  /** AAAA-MM no fuso do aparelho. */
  chave: string;
  /** "Outubro de 2026". */
  titulo: string;
  /** Do mais novo ao mais antigo. `data` porque é o formato que a `SectionList` lê. */
  data: SessaoFechada[];
}

/** Os treinos por mês do fim, do mês mais novo ao mais antigo — e, dentro do mês, também. */
export function agruparPorMes(sessoes: readonly SessaoFechada[]): MesDoHistorico[] {
  const meses: MesDoHistorico[] = [];
  for (const sessao of ordenarPorFim(sessoes)) {
    const d = new Date(sessao.fimMs);
    const chave = `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}`;
    const atual = meses[meses.length - 1];
    if (atual?.chave === chave) atual.data.push(sessao);
    else meses.push({ chave, titulo: mesPorExtenso(sessao.fimMs), data: [sessao] });
  }
  return meses;
}

export interface RecordeNaSessao {
  exercicioId: string;
  /** O melhor 1RM estimado do exercício nesta sessão (`CAR-5`). */
  novo: number;
  /** O melhor de todas as sessões anteriores — o que foi batido. */
  antes: number;
}

/**
 * `CAR-5` por SESSÃO: os exercícios em que cada treino superou o melhor 1RM anterior, pelo id do
 * treino. É a regra de `diasComRecorde` (RN-52) contada por treino em vez de por dia — dois treinos
 * no mesmo dia não dividem o ouro. Em ordem cronológica (o fim), e a primeira vez num exercício
 * não é recorde: não havia o que bater (a mesma regra do resumo).
 */
export function recordesPorSessao(sessoes: readonly SessaoFechada[]): Map<string, RecordeNaSessao[]> {
  const melhor = new Map<string, number>();
  const porSessao = new Map<string, RecordeNaSessao[]>();
  for (const sessao of [...sessoes].sort((a, b) => a.fimMs - b.fimMs)) {
    const daSessao = new Map<string, number>();
    for (const s of sessao.series) {
      daSessao.set(s.exercicioId, Math.max(daSessao.get(s.exercicioId) ?? 0, umRepMaximo(s.cargaKg, s.reps)));
    }
    const bateram: RecordeNaSessao[] = [];
    for (const [exercicioId, novo] of daSessao) {
      const antes = melhor.get(exercicioId) ?? 0;
      if (antes > 0 && novo > antes) bateram.push({ exercicioId, novo, antes });
      melhor.set(exercicioId, Math.max(antes, novo));
    }
    if (bateram.length > 0) porSessao.set(sessao.id, bateram);
  }
  return porSessao;
}

export interface GrupoDeSeries {
  exercicioId: string;
  /** `posicao` é o índice em `sessao.series` — o endereço que `corrigirSerie` e `removerSerie` pedem. */
  series: { serie: SerieRegistrada; posicao: number }[];
}

/** As séries do treino por exercício, na ordem em que os exercícios foram feitos. */
export function seriesPorExercicio(series: readonly SerieRegistrada[]): GrupoDeSeries[] {
  const grupos: GrupoDeSeries[] = [];
  series.forEach((serie, posicao) => {
    const grupo = grupos.find((g) => g.exercicioId === serie.exercicioId);
    if (grupo) grupo.series.push({ serie, posicao });
    else grupos.push({ exercicioId: serie.exercicioId, series: [{ serie, posicao }] });
  });
  return grupos;
}

/** "10 × 40 kg". Peso do corpo sem carga: "10 reps · peso do corpo" ("10 × peso do corpo" leria como multiplicação). */
export function textoDaSerie(serie: Pick<SerieRegistrada, 'reps' | 'cargaKg'>, corporal: boolean): string {
  if (corporal && serie.cargaKg === 0) return `${plural(serie.reps, 'rep', 'reps')} · peso do corpo`;
  return `${serie.reps} × ${formatarKg(serie.cargaKg)} kg`;
}

/** O mesmo, para o leitor de tela: "10 repetições com 40 quilos". */
export function falaDaSerie(serie: Pick<SerieRegistrada, 'reps' | 'cargaKg'>, corporal: boolean): string {
  const reps = plural(serie.reps, 'repetição', 'repetições');
  if (corporal && serie.cargaKg === 0) return `${reps}, peso do corpo`;
  return `${reps} com ${formatarKg(serie.cargaKg)} quilos`;
}

/**
 * A carga como ela está guardada, para o campo da correção: 42.25 → "42,25".
 * ⚠️ Não é `formatarKg`: ele arredonda para 42,3, e salvar sem mexer regravaria a carga.
 */
export function textoDaCarga(kg: number): string {
  return String(kg).replace('.', ',');
}

/**
 * O número digitado na correção (RN-40): "40,5" e "40.5" valem. Vazio, negativo ou qualquer outra
 * coisa vira NaN — e quem diz o porquê é `corrigirSerie`, com o motivo na própria linha. Nunca
 * vira 0 sozinho: campo apagado por engano não pode gravar "0 reps".
 */
export function lerNumero(texto: string): number {
  const limpo = texto.trim();
  if (!/^(\d+([.,]\d*)?|[.,]\d+)$/.test(limpo)) return Number.NaN;
  return Number(limpo.replace(',', '.'));
}
