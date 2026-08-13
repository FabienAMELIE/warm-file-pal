export function money(value: number, currency = "EUR", digits = 0) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

export function signedMoney(value: number, currency = "EUR", digits = 0) {
  const s = money(Math.abs(value), currency, digits);
  return `${value >= 0 ? "+" : "−"}${s}`;
}

export function pct(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(digits).replace(".", ",")} %`;
}

export function num(value: number, digits = 2) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

export function frDate(date: string | null | undefined) {
  if (!date) return "—";
  const d = new Date(date.length <= 10 ? date + "T00:00:00Z" : date);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function monthLabel(month: string) {
  const [y, m] = month.split("-");
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

export const toneClass = (v: number) => (v >= 0 ? "text-positive" : "text-negative");
