import { useEffect, useRef, useState } from 'react';

/**
 * Cronômetros do app.
 *
 * ⚠️ Os dois derivam o valor exibido de um "agora" que o intervalo atualiza, em vez
 * de chamar `setState` dentro do corpo do efeito. Fazer o contrário dispara render
 * em cascata — e o próprio lint do Expo reprova (`react-hooks/set-state-in-effect`).
 */

/** Segundos decorridos desde `desdeMs`. Devolve 0 quando não há contagem em curso. */
export function useCronometro(desdeMs: number | null): number {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!desdeMs) return;
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [desdeMs]);

  if (!desdeMs) return 0;
  return Math.max(0, Math.floor((agora - desdeMs) / 1000));
}

/**
 * Conta regressiva do descanso. Devolve quantos segundos faltam e dispara `aoZerar`
 * uma única vez. `adicionar` estica o descanso sem reiniciar a contagem (o "+ 30 s").
 */
export function useContagemRegressiva(totalS: number, aoZerar?: () => void): {
  restante: number;
  adicionar: (s: number) => void;
} {
  const [alvo, setAlvo] = useState(() => Date.now() + totalS * 1000);
  const [agora, setAgora] = useState(() => Date.now());
  const jaZerou = useRef(false);

  const restante = Math.max(0, Math.ceil((alvo - agora) / 1000));

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (restante === 0 && !jaZerou.current) {
      jaZerou.current = true;
      aoZerar?.();
    }
  }, [restante, aoZerar]);

  const adicionar = (s: number) => {
    // Esticar o descanso depois de zerado volta a armar o disparo.
    jaZerou.current = false;
    setAlvo((a) => Math.max(a, Date.now()) + s * 1000);
  };

  return { restante, adicionar };
}
