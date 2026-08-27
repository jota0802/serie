/**
 * Formatação em português. Feita à mão, sem `Intl`: o resultado tem que ser
 * idêntico no Hermes (Android), no iOS e no navegador — e ser testável sem
 * depender do locale da máquina que roda o teste.
 */

/** 62.5 → "62,5" · 60 → "60". Vírgula decimal, sem casa inútil. */
export function formatarKg(kg: number): string {
  const arredondado = Math.round(kg * 10) / 10;
  return Number.isInteger(arredondado)
    ? String(arredondado)
    : String(arredondado).replace('.', ',');
}

/** 12345 → "12.345". Separador de milhar para a tonelagem (CAR-7). */
export function formatarMilhar(valor: number): string {
  const inteiro = Math.round(valor);
  return String(Math.abs(inteiro))
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    .replace(/^/, inteiro < 0 ? '-' : '');
}

/** 95 → "1:35". Cronômetro e descanso. */
export function formatarTempo(segundos: number): string {
  const total = Math.max(0, Math.round(segundos));
  const min = Math.floor(total / 60);
  return `${min}:${String(total % 60).padStart(2, '0')}`;
}
