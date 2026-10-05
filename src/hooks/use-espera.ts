import { useCallback, useEffect, useState } from 'react';

/**
 * Uma espera que só começa quando alguém arma — o cooldown do "Reenviar".
 *
 * Mesmo padrão dos cronômetros (`use-cronometro.ts`): o intervalo só atualiza o "agora" e
 * o restante é derivado no render, sem `setState` no corpo do efeito.
 */
export function useEspera(): { restante: number; armar: (segundos: number) => void } {
  const [ate, setAte] = useState<number | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  const restante = ate ? Math.max(0, Math.ceil((ate - agora) / 1000)) : 0;
  const correndo = restante > 0;

  useEffect(() => {
    if (!correndo) return;
    const id = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(id);
  }, [correndo]);

  const armar = useCallback((segundos: number) => {
    const t = Date.now();
    setAgora(t);
    setAte(t + segundos * 1000);
  }, []);

  return { restante, armar };
}
