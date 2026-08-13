/**
 * Taux de change de référence (base EUR).
 * Version 1 : taux statiques et transparents. L'architecture permet de
 * remplacer cette table par une source de marché sans changer les appels.
 */
export const FX_RATES_TO_EUR: Record<string, number> = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17,
  CHF: 1.05,
};

export function convert(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  const inEur = amount * (FX_RATES_TO_EUR[from] ?? 1);
  return inEur / (FX_RATES_TO_EUR[to] ?? 1);
}
