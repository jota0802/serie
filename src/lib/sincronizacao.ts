import type { SessaoFechada } from '@/domain/historico';
import type { SerieRegistrada } from '@/domain/types';

import type { Database } from './database.types';

/**
 * A ponte entre o histórico do app e as tabelas do Supabase, como funções puras.
 *
 * O aparelho é a fonte da verdade (offline-first). Estas funções só traduzem e mesclam;
 * quem chama o banco é o provedor (`src/estado/historico.tsx`). Por serem puras, a tradução
 * e a mescla são testadas em Jest sem rede nenhuma.
 */

type Tabelas = Database['public']['Tables'];
export type LinhaDeSessao = Tabelas['sessoes']['Insert'];
export type LinhaDeSerie = Tabelas['series']['Insert'];

/** O que o `select` de sessões com as séries embutidas devolve. */
export type SessaoDoBanco = Pick<Tabelas['sessoes']['Row'], 'id' | 'treino_id' | 'inicio' | 'fim'> & {
  series: Pick<
    Tabelas['series']['Row'],
    'ordem' | 'exercicio_id' | 'indice' | 'reps' | 'carga_kg' | 'foi_alvo' | 'duracao_s'
  >[];
};

/** As colunas que o app pede ao banco — uma constante só, para o select e o tipo não divergirem. */
export const SELECT_DE_SESSOES = 'id, treino_id, inicio, fim, series (ordem, exercicio_id, indice, reps, carga_kg, foi_alvo, duracao_s)';

/** Uma sessão fechada → a linha da sessão e as linhas das séries, prontas para o upsert. */
export function paraLinhas(sessao: SessaoFechada, usuarioId: string): { sessao: LinhaDeSessao; series: LinhaDeSerie[] } {
  return {
    sessao: {
      usuario_id: usuarioId,
      id: sessao.id,
      treino_id: sessao.treinoId,
      inicio: new Date(sessao.inicioMs).toISOString(),
      fim: new Date(sessao.fimMs).toISOString(),
    },
    series: sessao.series.map((s, ordem) => ({
      usuario_id: usuarioId,
      sessao_id: sessao.id,
      ordem,
      exercicio_id: s.exercicioId,
      indice: s.indice,
      reps: s.reps,
      carga_kg: s.cargaKg,
      foi_alvo: s.foiAlvo,
      // smallint no banco: a duração vem do cronômetro em segundos inteiros, mas garante
      duracao_s: s.duracaoSegundos == null ? null : Math.round(s.duracaoSegundos),
    })),
  };
}

/** A linha do banco (com as séries embutidas) → a sessão do app. */
export function deLinhas(linha: SessaoDoBanco): SessaoFechada {
  const series: SerieRegistrada[] = [...linha.series]
    .sort((a, b) => a.ordem - b.ordem)
    .map((s) => ({
      exercicioId: s.exercicio_id,
      indice: s.indice,
      reps: s.reps,
      // `numeric` pode chegar como texto dependendo do driver; o app só trabalha com número
      cargaKg: Number(s.carga_kg),
      foiAlvo: s.foi_alvo,
      duracaoSegundos: s.duracao_s ?? undefined,
    }));
  return {
    id: linha.id,
    treinoId: linha.treino_id,
    inicioMs: Date.parse(linha.inicio),
    fimMs: Date.parse(linha.fim),
    series,
  };
}

/**
 * Junta o que está no aparelho com o que veio da nuvem, sem duplicar.
 *
 * A sessão é imutável depois de fechada e o id nasce no aparelho, então a mesma sessão nos
 * dois lados é a MESMA sessão: fica a do aparelho. O que só existe na nuvem (treino feito em
 * outro celular) entra; o que só existe no aparelho (feito offline) fica e vai subir.
 */
export function mesclarSessoes(
  locais: readonly SessaoFechada[],
  remotas: readonly SessaoFechada[],
): SessaoFechada[] {
  const porId = new Map<string, SessaoFechada>();
  for (const s of remotas) porId.set(s.id, s);
  for (const s of locais) porId.set(s.id, s);
  return [...porId.values()].sort((a, b) => a.fimMs - b.fimMs);
}

/** As sessões do aparelho que ainda não subiram. */
export function pendentesDeEnvio(sessoes: readonly SessaoFechada[], enviadas: ReadonlySet<string>): SessaoFechada[] {
  return sessoes.filter((s) => !enviadas.has(s.id));
}
