import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, Panel, StatCard } from "@/components/Stat";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio } from "@/lib/finance/usePortfolio";
import { incomeRows } from "@/lib/finance/calc";
import { money, monthLabel } from "@/lib/format";

export const Route = createFileRoute("/revenus")({
  head: () => ({
    meta: [
      { title: "Revenus passifs — Patrimonia" },
      {
        name: "description",
        content: "Dividendes, intérêts, loyers et distributions : suivez vos revenus passifs.",
      },
      { property: "og:title", content: "Revenus passifs — Patrimonia" },
      {
        property: "og:description",
        content: "Suivez la progression de vos dividendes, loyers et intérêts.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <IncomePage />
    </AppShell>
  ),
});

function IncomePage() {
  const { user } = useAuth();
  const { data, base, summary, isLoading } = usePortfolio(user?.id);

  const rows = useMemo(() => incomeRows(data, base), [data, base]);

  const byMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.month, (map.get(r.month) ?? 0) + r.amount);
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-24)
      .map(([month, amount]) => ({ month, amount }));
  }, [rows]);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.type, (map.get(r.type) ?? 0) + r.amount);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const bySource = useMemo(() => {
    const names = Object.fromEntries(data.assets.map((a) => [a.id, a.name]));
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = r.assetId ? (names[r.assetId] ?? "Autre") : "Autre";
      map.set(key, (map.get(key) ?? 0) + r.amount);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows, data.assets]);

  const last12 = byMonth.slice(-12).reduce((s, m) => s + m.amount, 0);
  const yieldOnCost = summary.invested > 0 ? (last12 / summary.invested) * 100 : 0;

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (!rows.length)
    return (
      <>
        <PageHeader title="Revenus passifs" />
        <EmptyState
          title="Aucun revenu enregistré"
          description="Ajoutez des opérations de type Dividende, Intérêt, Loyer ou Distribution pour suivre vos revenus."
        />
      </>
    );

  return (
    <>
      <PageHeader
        title="Revenus passifs"
        subtitle="Ce que votre patrimoine vous verse, mois après mois."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Revenus cumulés" value={money(summary.income, base)} />
        <StatCard label="12 derniers mois" value={money(last12, base)} />
        <StatCard
          label="Rendement sur coût"
          value={`${yieldOnCost.toFixed(2).replace(".", ",")} %`}
          hint="Revenus 12 mois / capital investi"
        />
      </div>

      <Panel className="mt-4">
        <p className="label-eyebrow">Revenus mensuels</p>
        <div className="mt-4 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byMonth}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={monthLabel}
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
                width={70}
                tickFormatter={(v: number) => money(v, base)}
              />
              <Tooltip
                cursor={{ fill: "var(--color-muted)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]!.payload as { month: string; amount: number };
                  return (
                    <div className="panel p-2 text-xs">
                      <p className="font-medium">{monthLabel(d.month)}</p>
                      <p className="num">{money(d.amount, base, 2)}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="amount" fill="var(--color-brass)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <p className="label-eyebrow">Par type</p>
          <ul className="mt-4 space-y-2 text-sm">
            {byType.map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <span className="num">{money(v, base)}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <p className="label-eyebrow">Par source</p>
          <ul className="mt-4 space-y-2 text-sm">
            {bySource.map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <span className="num">{money(v, base)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
