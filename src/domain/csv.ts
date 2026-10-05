import type { SessaoFechada } from './historico';

/**
 * Exportação do histórico em CSV (escopo §MVP: "exportação em CSV").
 *
 * Uma linha por SÉRIE — é a unidade do app, e quem abre no Excel quer filtrar por
 * exercício e somar, não ler sessão por sessão. Ponto e vírgula, porque é o separador que
 * o Excel em pt-BR espera (lá a vírgula é o decimal); de resto RFC 4180: CRLF e aspas duplas.
 * O BOM entra no download (`src/lib/compartilhar-csv.ts`), não aqui.
 *
 * Os nomes chegam por função porque o domínio não conhece o catálogo (`src/data/`).
 */

export const CABECALHO_CSV = ['data', 'treino', 'exercicio', 'serie', 'reps', 'carga_kg', 'duracao_s'] as const;

const SEPARADOR = ';';

/**
 * Texto com ponto e vírgula, aspas ou quebra de linha vai entre aspas, e a aspa interna dobra.
 * "Rosca 21; "pesada"" sem isso vira três colunas e quebra o arquivo inteiro. Texto com vírgula
 * também, para o programa que adivinha o separador (Numbers, Sheets) não cortar ali.
 *
 * Número sai com vírgula decimal e SEM aspas (62,5): é assim que o Excel em pt-BR o lê como
 * número, e não como texto que não soma.
 */
export function escaparCampo(valor: string | number): string {
  if (typeof valor === 'number') return String(valor).replace('.', ',');
  return /[";,\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** "2026-10-02 18:30", no fuso do aparelho. Ordena certo como texto, e o Excel reconhece. */
export function formatarDataCsv(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())} `
    + `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
}

export function gerarCsv(
  sessoes: readonly SessaoFechada[],
  nomeDoExercicio: (exercicioId: string) => string,
): string {
  const linhas: (string | number)[][] = [[...CABECALHO_CSV]];
  // Da mais antiga para a mais nova: é como uma planilha de treino se lê.
  for (const sessao of [...sessoes].sort((a, b) => a.fimMs - b.fimMs)) {
    const data = formatarDataCsv(sessao.fimMs);
    for (const s of sessao.series) {
      linhas.push([
        data,
        sessao.treinoId,
        nomeDoExercicio(s.exercicioId),
        s.indice + 1, // a série 0 do código é a "1ª série" de quem treina
        s.reps,
        // Número, não texto: `escaparCampo` o escreve com vírgula decimal (42,5), o que só
        // é seguro porque o separador é o ponto e vírgula.
        s.cargaKg,
        s.duracaoSegundos ?? '',
      ]);
    }
  }
  return linhas.map((l) => l.map(escaparCampo).join(SEPARADOR)).join('\r\n');
}
