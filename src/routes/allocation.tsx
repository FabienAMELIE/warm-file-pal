import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, Panel } from "@/components/Stat";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio } from "@/lib/finance/usePortfolio";
import { allocationBy, type AllocationSlice } from "@/lib/finance/calc";
import { money } from "@/lib/format";

export const Route = createFileRoute("/allocation")({
  head: () => ({
    meta: [
      { title: "Allocation d'actifs — Patrimonia" },
      {
        name: "description",
        content:
          "Répartition de votre patrimoine par classe d'actifs, compte, secteur, zone géographique et devise.",
      },
      { property: "og:title", content: "Allocation d'actifs — Patrimonia" },
      {
        property: "og:description",
        content: "Visualisez la diversification réelle de votre patrimoine.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <AllocationPage />
    </AppShell>
  ),
});

const COLORS = [
  "var(--color-brass)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-1)",
];

function AllocationPage() {
  const { user } = useAuth();
  const { positions, data, base, isLoading } = usePortfolio(user?.id);

  const accountName = useMemo(
    () => Object.fromEntries(data.accounts.map((a) => [a.id, a.name])),
    [data.accounts],
  );

  const groups = useMemo(
    () => [
      { title: "Par classe d'actifs", slices: allocationBy(positions, (p) => p.asset.asset_type) },
      {
        title: "Par compte / enveloppe",
        slices: allocationBy(positions, (p) =>
          p.asset.account_id ? (accountName[p.asset.account_id] ?? "Sans compte") : "Sans compte",
        ),
      },
      {
        title: "Par zone géographique",
        slices: allocationBy(positions, (p) => p.asset.geography ?? "Non renseigné"),
      },
      {
        title: "Par secteur",
        slices: allocationBy(positions, (p) => p.asset.sector ?? "Non renseigné"),
      },
      { title: "Par devise", slices: allocationBy(positions, (p) => p.asset.currency) },
    ],
    [positions, accountName],
  );

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (!positions.length)
    return (
      <>
        <PageHeader title="Allocation" />
        <EmptyState
          title="Rien à répartir pour l'instant"
          description="Ajoutez des investissements pour visualiser la diversification de votre patrimoine."
        />
      </>
    );

  return (
    <>
      <PageHeader
        title="Allocation"
        subtitle="Comment votre patrimoine est réparti, sous plusieurs angles."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((g) => (
          <Panel key={g.title}>
            <p className="label-eyebrow">{g.title}</p>
            <Donut slices={g.slices} currency={base} />
          </Panel>
        ))}
      </div>
    </>
  );
}

function Donut({ slices, currency }: { slices: AllocationSlice[]; currency: string }) {
  return (
    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="h-44 w-full sm:w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="key"
              innerRadius={44}
              outerRadius={70}
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((s, i) => (
                <Cell key={s.key} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const s = payload[0]!.payload as AllocationSlice;
                return (
                  <div className="panel p-2 text-xs">
                    <p className="font-medium">{s.key}</p>
                    <p className="num text-muted-foreground">
                      {money(s.value, currency)} · {s.pct.toFixed(1).replace(".", ",")} %
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-1.5 text-sm">
        {slices.map((s, i) => (
          <li key={s.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              {s.key}
            </span>
            <span className="num text-muted-foreground">
              {s.pct.toFixed(1).replace(".", ",")} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
