import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Chama `tentar` quando faz sentido tentar a rede de novo: o app voltou para a frente, a aba
 * voltou a ter conexão (navegador) e, enquanto houver algo pendente, a cada 30 s.
 *
 * Sem dependência de NetInfo de propósito: no subsolo a rede vai e volta, e tentar de tempos em
 * tempos com o envio idempotente (upsert) é mais simples e tão eficaz quanto escutar a rede.
 * `null` desliga — é o "não há nada pendente".
 */
export function useAoReconectar(tentar: (() => void) | null, intervaloMs = 30_000) {
  const ultima = useRef(tentar);
  useEffect(() => {
    ultima.current = tentar;
  }, [tentar]);

  const ligado = tentar != null;
  useEffect(() => {
    if (!ligado) return;
    const chamar = () => ultima.current?.();
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') chamar();
    });
    const timer = setInterval(chamar, intervaloMs);
    const naWeb = typeof window !== 'undefined' && typeof window.addEventListener === 'function';
    if (naWeb) window.addEventListener('online', chamar);
    return () => {
      assinatura.remove();
      clearInterval(timer);
      if (naWeb) window.removeEventListener('online', chamar);
    };
  }, [ligado, intervaloMs]);
}
