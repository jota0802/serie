import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { EXERCICIOS_POR_ID } from '@/data/exercicios';
import { melhor1RM, proximoAlvo, tonelagem, type Alvo } from '@/domain';
import { cargaDoPlanoVale, recordeDe, ultimaSessaoCom, ultimasSeriesDe, ultimaTonelagem } from '@/domain/historico';
import {
  VALIDADE_DA_SESSAO_MS, fecharSessao, idDaSessao, itemDaSessao, novaSessao, registrarSerie,
  sessaoParaRestaurar, sessaoVencida, terminarAgora as terminarSessaoAgora, type SessaoEmAndamento,
} from '@/domain/sessao';
import { useAuth } from '@/estado/auth';
import { useHistorico } from '@/estado/historico';
import { usePlano } from '@/estado/perfil';

/**
 * O estado da sessão em andamento.
 *
 * É a fonte de verdade do caminho crítico (11 Treino ativo → 12 Execução → 13 Descanso
 * → 14 Resumo) e é persistida no AsyncStorage a cada mudança: `CAR-8`, sair do app (ou
 * recarregar a aba no navegador) no meio do treino não pode jogar o treino fora. E vale
 * por 6 h, no disco e na memória: depois disso é descartada.
 *
 * O passado (última vez, recorde, tonelagem anterior) vem do histórico persistido
 * (`src/estado/historico.tsx`), e o treino terminado entra nele.
 */

/** A forma da sessão mora em `src/domain/sessao.ts`, junto das transições puras e testadas. */
export type Sessao = SessaoEmAndamento;
export { itemDaSessao };

/** Por usuário: dois logins no mesmo aparelho não podem retomar o treino um do outro. */
const chave = (usuarioId: string) => `serie:sessao:v2:${usuarioId}`;

interface Contexto {
  sessao: Sessao | null;
  /** Falso até o AsyncStorage responder. Antes disso "sem sessão" ainda não é verdade. */
  carregada: boolean;
  comecar: (treinoId: string) => void;
  iniciarSerie: () => void;
  /** Encerra o cronômetro da série e devolve quantos segundos ela durou. */
  encerrarSerie: () => number;
  /** `alvo` é o da série registrada — com ele se sabe se o usuário corrigiu algo (`foiAlvo`). */
  registrar: (reps: number, cargaKg: number, alvo: Alvo | undefined) => void;
  /** `CAR-9` — troca o exercício atual por outro (do mesmo padrão) só nesta sessão. */
  trocarExercicio: (exercicioId: string) => void;
  /**
   * RN-30 — termina antes do fim: com alguma série registrada o treino é SALVO como está (e vai
   * para o resumo); sem nenhuma, é descartado. Devolve o que aconteceu, para a tela navegar.
   */
  terminarAgora: () => 'salvo' | 'descartado';
  abandonar: () => void;
}

const SessaoContexto = createContext<Contexto | null>(null);

export function ProvedorDeSessao({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregada, setCarregada] = useState(false);
  const { registrarSessao, carregado: historicoCarregado } = useHistorico();
  const { usuario } = useAuth();
  const usuarioId = usuario?.id;
  const { porId } = usePlano();

  // CAR-8: retoma a sessão salva (até 6 h). Corrompida ou velha é descartada lá dentro.
  useEffect(() => {
    if (!usuarioId) return;
    let vivo = true;
    AsyncStorage.getItem(chave(usuarioId))
      .then((texto) => sessaoParaRestaurar(texto, Date.now()))
      .catch(() => null)
      .then((salva) => {
        if (!vivo) return;
        // Se o usuário já começou outro treino enquanto o disco respondia, o dele vale.
        setSessao((atual) => atual ?? salva);
        setCarregada(true);
      });
    return () => {
      vivo = false;
    };
  }, [usuarioId]);

  // Grava depois que carregou: antes disso o `null` inicial apagaria a sessão do disco.
  useEffect(() => {
    if (!carregada || !usuarioId) return;
    const gravacao = sessao
      ? AsyncStorage.setItem(chave(usuarioId), JSON.stringify(sessao))
      : AsyncStorage.removeItem(chave(usuarioId));
    gravacao.catch(() => {});
  }, [sessao, carregada, usuarioId]);

  // ⚠️ CAR-8 também com o app aberto. Conferir só ao ler o disco não basta: no Android o
  // processo vive dias em segundo plano (e a aba do navegador fica aberta), e o Hoje oferecia
  // "Retomar" o treino de ontem. Descarta na hora em que vence e sempre que o app volta para
  // a frente — com o app dormindo, timer não dispara.
  const inicioDaSessao = sessao?.inicioMs;
  useEffect(() => {
    if (inicioDaSessao == null) return;
    const descartarSeVenceu = () => setSessao((s) => (s && sessaoVencida(s, Date.now()) ? null : s));
    // + 1 s: a regra é "mais de 6 h"; no milissegundo exato a sessão ainda vale.
    const timer = setTimeout(descartarSeVenceu, inicioDaSessao + VALIDADE_DA_SESSAO_MS - Date.now() + 1000);
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') descartarSeVenceu();
    });
    return () => {
      clearTimeout(timer);
      assinatura.remove();
    };
  }, [inicioDaSessao]);

  // Treino terminado vira histórico — é isso que faz o próximo Hoje propor outra coisa.
  // ⚠️ Espera o histórico carregar: registrar antes faria a leitura do disco sobrescrever
  // a sessão recém-fechada. `registrarSessao` é idempotente pelo id, repetir não duplica.
  const fechada = useMemo(() => (sessao ? fecharSessao(sessao) : null), [sessao]);
  useEffect(() => {
    if (fechada && historicoCarregado) registrarSessao(fechada);
  }, [fechada, historicoCarregado, registrarSessao]);

  const comecar = useCallback((treinoId: string) => {
    // RN-17: a sessão leva a versão do treino de agora; editar o plano depois não a afeta.
    setSessao(novaSessao(treinoId, Date.now(), porId.get(treinoId)));
  }, [porId]);

  const iniciarSerie = useCallback(() => {
    setSessao((s) => (s ? { ...s, inicioSerieMs: Date.now() } : s));
  }, []);

  const encerrarSerie = useCallback(() => {
    let duracao = 0;
    setSessao((s) => {
      if (!s) return s;
      duracao = s.inicioSerieMs ? Math.round((Date.now() - s.inicioSerieMs) / 1000) : 0;
      return { ...s, inicioSerieMs: null, duracaoUltimaSerieS: duracao };
    });
    return duracao;
  }, []);

  const registrar = useCallback((reps: number, cargaKg: number, alvo: Alvo | undefined) => {
    const agora = Date.now();
    setSessao((s) => {
      // CAR-8 na hora do fato: ao acordar o app, o descanso pode zerar e registrar ANTES do
      // descarte acima. Série em sessão vencida descarta a sessão — fechá-la gravaria no
      // histórico um treino com o início de ontem (~1.440 min).
      if (!s || sessaoVencida(s, agora)) return null;
      const treino = s.treino ?? porId.get(s.treinoId);
      return treino ? registrarSerie(s, treino, reps, cargaKg, alvo, agora) : s;
    });
  }, [porId]);

  const trocarExercicio = useCallback((exercicioId: string) => {
    setSessao((s) => (s ? { ...s, trocas: { ...s.trocas, [s.indiceExercicio]: exercicioId } } : s));
  }, []);

  const terminarAgora = useCallback((): 'salvo' | 'descartado' => {
    const agora = Date.now();
    // Decide pelo estado atual (não dentro do updater): a tela precisa da resposta já.
    const resultado = sessao ? terminarSessaoAgora(sessao, agora) : null;
    setSessao(resultado);
    return resultado ? 'salvo' : 'descartado';
  }, [sessao]);

  const abandonar = useCallback(() => setSessao(null), []);

  const valor = useMemo(
    () => ({ sessao, carregada, comecar, iniciarSerie, encerrarSerie, registrar, trocarExercicio, terminarAgora, abandonar }),
    [sessao, carregada, comecar, iniciarSerie, encerrarSerie, registrar, trocarExercicio, terminarAgora, abandonar],
  );
  return <SessaoContexto.Provider value={valor}>{children}</SessaoContexto.Provider>;
}

export function useSessao() {
  const ctx = useContext(SessaoContexto);
  if (!ctx) throw new Error('useSessao precisa estar dentro de <ProvedorDeSessao>');
  return ctx;
}

/**
 * Tudo que as telas do treino precisam saber, derivado da sessão.
 * Nada aqui é guardado: é sempre recalculado a partir das regras.
 */
export function useTreinoEmAndamento() {
  const { sessao } = useSessao();
  const { sessoes } = useHistorico();
  const { porId } = usePlano();

  return useMemo(() => {
    if (!sessao) return null;
    const treino = sessao.treino ?? porId.get(sessao.treinoId);
    if (!treino) return null;

    // Terminou pelo fim do treino ou antes, pelo "terminar agora" (RN-30).
    const terminou = sessao.fimMs != null || sessao.indiceExercicio >= treino.itens.length;
    const item = terminou ? undefined : itemDaSessao(treino, sessao, sessao.indiceExercicio);
    // As sessões ANTES desta — a que acabou de fechar entra no histórico e não pode se comparar consigo.
    const anteriores = sessoes.filter((s) => s.id !== idDaSessao(sessao));
    // A última vez deste exercício. É a entrada da `CAR-1`.
    const ultimaVez = item ? ultimasSeriesDe(anteriores, item.exercicioId) : [];
    const exercicio = item ? EXERCICIOS_POR_ID.get(item.exercicioId) : undefined;

    let alvos: Alvo[] = [];
    if (item) {
      alvos = proximoAlvo({
        ultimaSessao: ultimaVez,
        faixa: item.faixa,
        cargaAtualKg: item.cargaKg,
        cargaDoPlanoVale: cargaDoPlanoVale(item, ultimaSessaoCom(anteriores, item.exercicioId)?.fimMs),
        incrementoKg: exercicio?.incrementoKg ?? 2.5,
        series: item.series,
      });
    }

    const feitasDoExercicio = item
      ? sessao.registradas.filter((r) => r.exercicioId === item.exercicioId)
      : [];

    const proximoItem = itemDaSessao(treino, sessao, sessao.indiceExercicio + 1);

    return {
      treino,
      /** O histórico sem esta sessão — a base de toda comparação com "a vez anterior". */
      anteriores,
      item,
      exercicio,
      alvos,
      alvo: alvos[sessao.indiceSerie] ?? alvos[0],
      feitasDoExercicio,
      ultimaVez,
      terminou,
      proximoExercicio: proximoItem ? EXERCICIOS_POR_ID.get(proximoItem.exercicioId) : undefined,
      /** Quanto do treino já foi, de 0 a 1 — alimenta a barra fina do topo. */
      progresso:
        sessao.registradas.length /
        Math.max(1, treino.itens.reduce((total, i) => total + i.series, 0)),
      tonelagem: tonelagem(sessao.registradas),
      tonelagemAnterior: ultimaTonelagem(anteriores, sessao.treinoId),
      /** O recorde do exercício atual, para saber se a série que vem bate (`CAR-5`). */
      recordeDoExercicio: item ? recordeDe(anteriores, item.exercicioId) : 0,
      /** Recorde de qualquer exercício ANTES desta sessão — o resumo compara com isto. */
      recordeAnterior: (exercicioId: string) => recordeDe(anteriores, exercicioId),
      melhor1RMDaSessao: melhor1RM(sessao.registradas),
    };
  }, [sessao, sessoes, porId]);
}
