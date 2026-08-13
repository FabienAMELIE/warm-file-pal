import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryPoint } from "@/lib/finance/calc";
import { frDate, money, pct } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { key: "1M", months: 1 },
  { key: "3M", months: 3 },
  { key: "6M", months: 6 },
  { key: "1A", months: 12 },
  { key: "3A", months: 36 },
  { key: "5A", months: 60 },
  { key: "Tout", months: 0 },
] as const;

export function PortfolioChart({
  history,
  currency = "EUR",
}: {
  history: HistoryPoint[];
  currency?: string;
}) {
  const [range, setRange] = useState<string>("Tout");

  const data = useMemo(() => {
    const cfg = RANGES.find((r) => r.key === range);
    if (!cfg || cfg.months === 0) return history;
    const limit = new Date();
    limit.setMonth(limit.getMonth() - cfg.months);
    const iso = limit.toISOString().slice(0, 10);
    const filtered = history.filter((p) => p.date >= iso);
    return filtered.length > 1 ? filtered : history;
  }, [history, range]);

  const first = data[0];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-eyebrow">Évolution du patrimoine</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Valeur du portefeuille comparée au capital réellement investi
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs transition-colors",
                range === r.key
                  ? "bg-brass text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brass)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-brass)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => frDate(d).slice(3)}
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={70}
              tickFormatter={(v: number) => money(v, currency)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]!.payload as HistoryPoint;
                const perf = p.invested > 0 ? (p.gain / p.invested) * 100 : 0;
                const sinceStart =
                  first && first.value > 0 ? ((p.value - first.value) / first.value) * 100 : 0;
                return (
                  <div className="panel min-w-[210px] p-3 text-xs">
                    <p className="mb-2 font-medium">{frDate(p.date)}</p>
                    <Row label="Valeur du portefeuille" value={money(p.value, currency)} />
                    <Row label="Capital investi" value={money(p.invested, currency)} />
                    <Row
                      label="Performance"
                      value={`${money(p.gain, currency)} (${pct(perf)})`}
                      tone={p.gain}
                    />
                    <Row label="Depuis le début de la période" value={pct(sinceStart)} tone={sinceStart} />
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-brass)"
              strokeWidth={2}
              fill="url(#valueFill)"
              name="Valeur"
            />
            <Line
              type="monotone"
              dataKey="invested"
              stroke="var(--color-chart-2)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="Capital investi"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4 bg-brass" /> Valeur du portefeuille
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4 border-t border-dashed border-[var(--color-chart-2)]" /> Capital
          investi
        </span>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: number }) {
  return (
    <div className="flex justify-between gap-6 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "num",
          tone === undefined ? "" : tone >= 0 ? "text-positive" : "text-negative",
        )}
      >
        {value}
      </span>
    </div>
  );
}
