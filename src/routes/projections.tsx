import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Panel, StatCard } from "@/components/Stat";
import { Field } from "@/components/AssetDialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio } from "@/lib/finance/usePortfolio";
import { money } from "@/lib/format";

export const Route = createFileRoute("/projections")({
  head: () => ({
    meta: [
      { title: "Projections patrimoniales — Patrimonia" },
      {
        name: "description",
        content:
          "Simulez l'évolution de votre patrimoine avec vos versements réguliers et différents scénarios de rendement.",
      },
      { property: "og:title", content: "Projections patrimoniales — Patrimonia" },
      {
        property: "og:description",
        content: "Scénarios prudent, central et optimiste sur votre horizon d'investissement.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <ProjectionsPage />
    </AppShell>
  ),
});

function ProjectionsPage() {
  const { user } = useAuth();
  const { summary, base } = usePortfolio(user?.id);
  const [monthly, setMonthly] = useState("500");
  const [years, setYears] = useState("20");
  const [rate, setRate] = useState("6");

  const n = Math.min(Math.max(Number(years) || 1, 1), 50);
  const contrib = Number(monthly) || 0;
  const central = Number(rate) || 0;

  const scenarios = useMemo(
    () => [
      { key: "prudent", label: "Prudent", rate: Math.max(central - 3, 0) },
      { key: "central", label: "Central", rate: central },
      { key: "optimiste", label: "Optimiste", rate: central + 3 },
    ],
    [central],
  );

  const series = useMemo(() => {
    const start = summary.totalValue;
    const out: Record<string, number | string>[] = [];
    const balances: Record<string, number> = Object.fromEntries(
      scenarios.map((s) => [s.key, start]),
    );
    for (let y = 0; y <= n; y++) {
      const row: Record<string, number | string> = { year: new Date().getFullYear() + y };
      for (const s of scenarios) {
        if (y > 0) {
          const r = s.rate / 100;
          balances[s.key] = (balances[s.key] ?? 0) * (1 + r) + contrib * 12 * (1 + r / 2);
        }
        row[s.key] = Math.round(balances[s.key] ?? 0);
      }
      out.push(row);
    }
    return out;
  }, [scenarios, n, contrib, summary.totalValue]);

  const last = series[series.length - 1];
  const totalContrib = contrib * 12 * n;

  return (
    <>
      <PageHeader
        title="Projections"
        subtitle="Où pourrait vous mener votre stratégie actuelle ? Ces scénarios sont indicatifs, pas des promesses."
      />

      <Panel className="mb-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Versement mensuel">
            <Input inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
          </Field>
          <Field label="Horizon (années)">
            <Input inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)} />
          </Field>
          <Field label="Rendement central (% / an)">
            <Input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
          </Field>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-3">
        {scenarios.map((s) => (
          <StatCard
            key={s.key}
            label={`${s.label} · ${s.rate.toFixed(1).replace(".", ",")} %`}
            value={money(Number(last?.[s.key] ?? 0), base)}
            hint={`Dans ${n} ans`}
          />
        ))}
      </div>

      <Panel className="mt-4">
        <p className="label-eyebrow">Trajectoires simulées</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Point de départ : {money(summary.totalValue, base)} — versements cumulés :{" "}
          {money(totalContrib, base)}
        </p>
        <div className="mt-4 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="projFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brass)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-brass)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="year"
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={80}
                tickFormatter={(v: number) => money(v, base)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="panel p-3 text-xs">
                      <p className="mb-1 font-medium">{label}</p>
                      {payload.map((p) => (
                        <p key={String(p.dataKey)} className="num flex justify-between gap-4">
                          <span className="capitalize text-muted-foreground">{String(p.dataKey)}</span>
                          <span>{money(Number(p.value), base)}</span>
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="optimiste"
                stroke="var(--color-positive)"
                fill="none"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="central"
                stroke="var(--color-brass)"
                fill="url(#projFill)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="prudent"
                stroke="var(--color-chart-2)"
                fill="none"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}
