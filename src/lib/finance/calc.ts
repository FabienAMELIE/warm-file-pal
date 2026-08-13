import { convert } from "./currency";
import {
  INCOME_TYPES,
  type Asset,
  type PortfolioData,
  type Transaction,
  type Valuation,
} from "./types";

export interface Position {
  asset: Asset;
  quantity: number;
  invested: number; // capital net encore investi (coût de revient des unités détenues)
  totalInvested: number; // capital brut versé sur cet actif
  avgPrice: number;
  currentPrice: number;
  currentValue: number;
  gain: number;
  gainPct: number;
  realized: number;
  income: number;
  fees: number;
  weight: number;
  firstDate: string | null;
  lastDate: string | null;
  transactions: Transaction[];
}

const isIncome = (t: string) => INCOME_TYPES.includes(t as never);

export function latestPrice(
  asset: Asset,
  valuations: Valuation[],
  onOrBefore?: string,
): number | null {
  const rows = valuations
    .filter((v) => v.asset_id === asset.id && (!onOrBefore || v.date <= onOrBefore))
    .sort((a, b) => a.date.localeCompare(b.date));
  const last = rows[rows.length - 1];
  if (last) return Number(last.price);
  if (!onOrBefore && asset.current_price != null) return Number(asset.current_price);
  return null;
}

export function computePositions(
  data: PortfolioData,
  base = "EUR",
): { positions: Position[]; totalValue: number } {
  const positions: Position[] = data.assets.map((asset) => {
    const txs = data.transactions
      .filter((t) => t.asset_id === asset.id)
      .sort((a, b) => a.date.localeCompare(b.date));

    let quantity = 0;
    let costBasis = 0; // coût des unités détenues
    let totalInvested = 0;
    let realized = 0;
    let income = 0;
    let fees = 0;

    for (const t of txs) {
      const cur = t.currency || asset.currency || base;
      const amount = convert(Number(t.amount) || 0, cur, base);
      const fee = convert(Number(t.fees) || 0, cur, base);
      fees += fee;
      const qty = Number(t.quantity) || 0;

      if (t.type === "Achat" || t.type === "Dépôt") {
        quantity += qty;
        costBasis += amount + fee;
        totalInvested += amount + fee;
      } else if (t.type === "Vente" || t.type === "Retrait") {
        const share = quantity > 0 && qty > 0 ? Math.min(qty / quantity, 1) : amount > 0 && costBasis > 0 ? Math.min(amount / costBasis, 1) : 0;
        const releasedCost = costBasis * share;
        realized += amount - fee - releasedCost;
        costBasis -= releasedCost;
        quantity -= qty;
      } else if (isIncome(t.type)) {
        income += amount;
      } else if (t.type === "Frais") {
        fees += amount;
      }
    }

    quantity = Math.abs(quantity) < 1e-9 ? 0 : quantity;
    costBasis = Math.max(costBasis, 0);

    const priceRaw = latestPrice(asset, data.valuations);
    const assetCur = asset.currency || base;
    let currentValue: number;
    let currentPrice: number;

    if (asset.pricing_mode === "value") {
      currentPrice = priceRaw != null ? convert(priceRaw, assetCur, base) : costBasis;
      currentValue = currentPrice;
    } else {
      currentPrice =
        priceRaw != null
          ? convert(priceRaw, assetCur, base)
          : quantity > 0
            ? costBasis / quantity
            : 0;
      currentValue = quantity * currentPrice;
    }

    const gain = currentValue - costBasis;

    return {
      asset,
      quantity,
      invested: costBasis,
      totalInvested,
      avgPrice: quantity > 0 ? costBasis / quantity : 0,
      currentPrice,
      currentValue,
      gain,
      gainPct: costBasis > 0 ? (gain / costBasis) * 100 : 0,
      realized,
      income,
      fees,
      weight: 0,
      firstDate: txs[0]?.date ?? null,
      lastDate: txs[txs.length - 1]?.date ?? null,
      transactions: txs,
    };
  });

  const totalValue = positions.reduce((s, p) => s + p.currentValue, 0);
  for (const p of positions) {
    p.weight = totalValue > 0 ? (p.currentValue / totalValue) * 100 : 0;
  }
  positions.sort((a, b) => b.currentValue - a.currentValue);
  return { positions, totalValue };
}

export interface PortfolioSummary {
  totalValue: number;
  invested: number;
  gain: number;
  gainPct: number;
  realized: number;
  income: number;
  fees: number;
  lastUpdate: string | null;
}

export function computeSummary(positions: Position[], data: PortfolioData): PortfolioSummary {
  const totalValue = positions.reduce((s, p) => s + p.currentValue, 0);
  const invested = positions.reduce((s, p) => s + p.invested, 0);
  const gain = totalValue - invested;
  const dates = [
    ...data.valuations.map((v) => v.date),
    ...data.transactions.map((t) => t.date),
  ].sort();
  return {
    totalValue,
    invested,
    gain,
    gainPct: invested > 0 ? (gain / invested) * 100 : 0,
    realized: positions.reduce((s, p) => s + p.realized, 0),
    income: positions.reduce((s, p) => s + p.income, 0),
    fees: positions.reduce((s, p) => s + p.fees, 0),
    lastUpdate: dates.length ? (dates[dates.length - 1] ?? null) : null,
  };
}

/* ---------------- Historique ---------------- */

export interface HistoryPoint {
  date: string;
  value: number;
  invested: number;
  gain: number;
}

function monthEnds(from: Date, to: Date): string[] {
  const out: string[] = [];
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0));
  while (d <= to) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCMonth(d.getUTCMonth() + 2, 0);
  }
  const today = to.toISOString().slice(0, 10);
  if (out[out.length - 1] !== today) out.push(today);
  return out;
}

export function computeHistory(data: PortfolioData, base = "EUR"): HistoryPoint[] {
  const txs = [...data.transactions].sort((a, b) => a.date.localeCompare(b.date));
  if (!txs.length) return [];
  const start = new Date(txs[0]!.date + "T00:00:00Z");
  const end = new Date();
  const dates = monthEnds(start, end);

  return dates.map((date) => {
    let invested = 0;
    let value = 0;

    for (const asset of data.assets) {
      const assetTxs = txs.filter((t) => t.asset_id === asset.id && t.date <= date);
      let qty = 0;
      let cost = 0;
      for (const t of assetTxs) {
        const cur = t.currency || asset.currency || base;
        const amount = convert(Number(t.amount) || 0, cur, base);
        const fee = convert(Number(t.fees) || 0, cur, base);
        const q = Number(t.quantity) || 0;
        if (t.type === "Achat" || t.type === "Dépôt") {
          qty += q;
          cost += amount + fee;
        } else if (t.type === "Vente" || t.type === "Retrait") {
          const share = qty > 0 && q > 0 ? Math.min(q / qty, 1) : cost > 0 ? Math.min(amount / cost, 1) : 0;
          cost -= cost * share;
          qty -= q;
        }
      }
      cost = Math.max(cost, 0);
      invested += cost;

      const priceRaw = latestPrice(asset, data.valuations, date);
      const assetCur = asset.currency || base;
      if (asset.pricing_mode === "value") {
        value += priceRaw != null ? convert(priceRaw, assetCur, base) : cost;
      } else {
        const price = priceRaw != null ? convert(priceRaw, assetCur, base) : qty > 0 ? cost / qty : 0;
        value += qty * price;
      }
    }

    return { date, value, invested, gain: value - invested };
  });
}

/* ---------------- Performance ---------------- */

export interface CashFlow {
  date: Date;
  amount: number;
}

export function buildCashFlows(data: PortfolioData, totalValue: number, base = "EUR"): CashFlow[] {
  const flows: CashFlow[] = [];
  for (const t of data.transactions) {
    const cur = t.currency || base;
    const amount = convert(Number(t.amount) || 0, cur, base);
    const fee = convert(Number(t.fees) || 0, cur, base);
    const d = new Date(t.date + "T00:00:00Z");
    if (t.type === "Achat" || t.type === "Dépôt") flows.push({ date: d, amount: -(amount + fee) });
    else if (t.type === "Vente" || t.type === "Retrait") flows.push({ date: d, amount: amount - fee });
    else if (isIncome(t.type)) flows.push({ date: d, amount });
    else if (t.type === "Frais") flows.push({ date: d, amount: -amount });
  }
  if (flows.length) flows.push({ date: new Date(), amount: totalValue });
  return flows.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Taux de rendement interne annualisé (XIRR), méthode de Newton + bissection. */
export function xirr(flows: CashFlow[]): number | null {
  if (flows.length < 2) return null;
  const hasNeg = flows.some((f) => f.amount < 0);
  const hasPos = flows.some((f) => f.amount > 0);
  if (!hasNeg || !hasPos) return null;

  const t0 = flows[0]!.date.getTime();
  const years = (d: Date) => (d.getTime() - t0) / (365 * 24 * 3600 * 1000);
  const npv = (rate: number) =>
    flows.reduce((s, f) => s + f.amount / Math.pow(1 + rate, years(f.date)), 0);

  let low = -0.9999;
  let high = 10;
  let fLow = npv(low);
  let fHigh = npv(high);
  if (fLow * fHigh > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const fMid = npv(mid);
    if (Math.abs(fMid) < 1e-7) return mid;
    if (fLow * fMid < 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }
  return (low + high) / 2;
}

export function cagr(start: number, end: number, years: number): number | null {
  if (start <= 0 || years <= 0) return null;
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}

/* ---------------- Allocation ---------------- */

export interface AllocationSlice {
  key: string;
  value: number;
  pct: number;
}

export function allocationBy(
  positions: Position[],
  selector: (p: Position) => string,
): AllocationSlice[] {
  const map = new Map<string, number>();
  let total = 0;
  for (const p of positions) {
    if (p.currentValue <= 0) continue;
    const key = selector(p) || "Non renseigné";
    map.set(key, (map.get(key) ?? 0) + p.currentValue);
    total += p.currentValue;
  }
  return [...map.entries()]
    .map(([key, value]) => ({ key, value, pct: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

/* ---------------- Revenus ---------------- */

export interface IncomeRow {
  month: string;
  year: string;
  amount: number;
  type: string;
  assetId: string | null;
}

export function incomeRows(data: PortfolioData, base = "EUR"): IncomeRow[] {
  return data.transactions
    .filter((t) => isIncome(t.type))
    .map((t) => ({
      month: t.date.slice(0, 7),
      year: t.date.slice(0, 4),
      amount: convert(Number(t.amount) || 0, t.currency || base, base),
      type: t.type,
      assetId: t.asset_id,
    }));
}
