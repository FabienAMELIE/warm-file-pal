import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { PortfolioChart } from "@/components/PortfolioChart";
import { EmptyState, Panel, PerfPair, StatCard } from "@/components/Stat";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio } from "@/lib/finance/usePortfolio";
import { buildCashFlows, cagr, xirr } from "@/lib/finance/calc";
import { frDate, money, pct } from "@/lib/format";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Performance & rendement — Patrimonia" },
      {
        name: "description",
        content:
          "Mesurez la performance réelle de vos investissements : XIRR, CAGR, plus-values et revenus.",
      },
      { property: "og:title", content: "Performance & rendement — Patrimonia" },
      {
        property: "og:description",
        content: "XIRR, CAGR et performance ligne par ligne de votre portefeuille.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <PerformancePage />
    </AppShell>
  ),
});

function PerformancePage() {
  const { user } = useAuth();
  const { data, positions, summary, history, base, isLoading } = usePortfolio(user?.id);

  const irr = useMemo(
    () => xirr(buildCashFlows(data, summary.totalValue, base)),
    [data, summary.totalValue, base],
  );

  const firstDate = history[0]?.date ?? null;
  const years = firstDate
    ? (Date.now() - new Date(firstDate + "T00:00:00Z").getTime()) / (365 * 24 * 3600 * 1000)
    : 0;
  const growth = cagr(summary.invested, summary.totalValue, years);
  const totalReturn = summary.gain + summary.realized + summary.income;

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (!positions.length)
    return (
      <>
        <PageHeader title="Performance" />
        <EmptyState
          title="Pas encore de performance à calculer"
          description="Ajoutez des opérations pour que la plateforme calcule votre rendement annualisé."
        />
      </>
    );

  return (
    <>
      <PageHeader
        title="Performance"
        subtitle={`Suivi depuis le ${frDate(firstDate)} — ${years.toFixed(1).replace(".", ",")} ans.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="XIRR annualisé"
          value={irr != null ? pct(irr * 100) : "—"}
          tone={irr ?? 0}
          hint="Rendement pondéré par les flux"
        />
        <StatCard
          label="CAGR simplifié"
          value={growth != null ? pct(growth) : "—"}
          tone={growth ?? 0}
          hint="Croissance annuelle moyenne"
        />
        <StatCard
          label="Gain total"
          value={money(totalReturn, base)}
          tone={totalReturn}
          hint="Latent + réalisé + revenus"
        />
        <StatCard
          label="Frais cumulés"
          value={money(summary.fees, base)}
          hint="Impact sur votre performance nette"
        />
      </div>

      <Panel className="mt-4">
        <PortfolioChart history={history} currency={base} />
      </Panel>

      <Panel className="mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Investissement</th>
              <th className="px-4 py-3 text-right font-medium">Investi</th>
              <th className="px-4 py-3 text-right font-medium">Valeur</th>
              <th className="px-4 py-3 text-right font-medium">Latent</th>
              <th className="px-4 py-3 text-right font-medium">Réalisé</th>
              <th className="px-4 py-3 text-right font-medium">Revenus</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.asset.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">{p.asset.name}</td>
                <td className="num px-4 py-3 text-right">{money(p.invested, base)}</td>
                <td className="num px-4 py-3 text-right">{money(p.currentValue, base)}</td>
                <td className="px-4 py-3 text-right">
                  <PerfPair value={p.gain} percent={p.gainPct} currency={base} />
                </td>
                <td className="num px-4 py-3 text-right">{money(p.realized, base)}</td>
                <td className="num px-4 py-3 text-right">{money(p.income, base)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
