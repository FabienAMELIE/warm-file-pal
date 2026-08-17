import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { DemoBanner, SeedDemoButton } from "@/components/DemoBanner";
import { PortfolioChart } from "@/components/PortfolioChart";
import { EmptyState, Panel, PerfPair, StatCard } from "@/components/Stat";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio, useIncludeRealEstate } from "@/lib/finance/usePortfolio";
import { allocationBy, buildCashFlows, xirr } from "@/lib/finance/calc";
import { frDate, money, pct } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard patrimonial — Patrimonia" },
      {
        name: "description",
        content:
          "Vue d'ensemble de votre patrimoine : valeur totale, capital investi, performance et allocation.",
      },
      { property: "og:title", content: "Dashboard patrimonial — Patrimonia" },
      {
        property: "og:description",
        content: "Vue d'ensemble de votre patrimoine, de sa performance et de son allocation.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

function Dashboard() {
  const { user } = useAuth();
  const { include, setInclude } = useIncludeRealEstate();
  const p = usePortfolio(user?.id, { includeRealEstate: include });
  const { positions, summary, history, base, data, isEmpty, refresh } = p;


  const irr = useMemo(
    () => xirr(buildCashFlows(data, summary.totalValue, base)),
    [data, summary.totalValue, base],
  );

  const byType = useMemo(() => allocationBy(positions, (x) => x.asset.asset_type), [positions]);
  const invested = positions.filter((x) => x.invested > 0);
  const best = [...invested].sort((a, b) => b.gainPct - a.gainPct).slice(0, 3);
  const worst = [...invested].sort((a, b) => a.gainPct - b.gainPct).slice(0, 3);
  const concentration = data.profile?.concentration_threshold ?? 30;
  const heavy = positions.filter((x) => x.weight > concentration);

  if (p.isLoading) return <p className="text-sm text-muted-foreground">Chargement du portefeuille…</p>;

  if (isEmpty) {
    return (
      <>
        <PageHeader title="Bienvenue" subtitle="Votre cockpit patrimonial est encore vide." />
        <EmptyState
          title="Commencez votre histoire patrimoniale"
          description="Ajoutez vos comptes et vos investissements, ou chargez un jeu de données de démonstration pour découvrir la plateforme."
          action={
            <>
              <Button asChild>
                <Link to="/investissements">Ajouter un investissement</Link>
              </Button>
              {user && <SeedDemoButton userId={user.id} onDone={refresh} />}
            </>
          }
        />
      </>
    );
  }

  return (
    <>
      {user && <DemoBanner userId={user.id} active={!!data.profile?.has_demo_data} onChange={refresh} />}
      <PageHeader
        title="Dashboard"
        subtitle={`Dernière donnée enregistrée le ${frDate(summary.lastUpdate)}.`}
        action={
          <Button asChild>
            <Link to="/transactions">Ajouter une opération</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Valeur totale"
          value={money(summary.totalValue, base)}
          hint={`${positions.length} lignes suivies`}
        />
        <StatCard
          label="Capital investi"
          value={money(summary.invested, base)}
          hint="Coût de revient des positions détenues"
        />
        <StatCard
          label="Plus-value latente"
          value={money(summary.gain, base)}
          tone={summary.gain}
          hint={pct(summary.gainPct)}
        />
        <StatCard
          label="Rendement annualisé (XIRR)"
          value={irr != null ? pct(irr * 100) : "—"}
          tone={irr ?? 0}
          hint="Pondéré par les flux et le temps"
        />
      </div>

      <Panel className="mt-4">
        <PortfolioChart history={history} currency={base} />
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <p className="label-eyebrow">Répartition par classe d'actifs</p>
          <ul className="mt-4 space-y-3">
            {byType.map((s) => (
              <li key={s.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span>{s.key}</span>
                  <span className="num text-muted-foreground">
                    {money(s.value, base)} · {s.pct.toFixed(1).replace(".", ",")} %
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brass" style={{ width: `${s.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <p className="label-eyebrow">Revenus & flux</p>
          <dl className="mt-4 space-y-3 text-sm">
            <Line label="Revenus encaissés" value={money(summary.income, base)} />
            <Line label="Plus-values réalisées" value={money(summary.realized, base)} />
            <Line label="Frais cumulés" value={money(summary.fees, base)} />
          </dl>
          <Button asChild variant="outline" size="sm" className="mt-5 w-full">
            <Link to="/revenus">Voir les revenus passifs</Link>
          </Button>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <p className="label-eyebrow">Meilleures performances</p>
          <ul className="mt-4 space-y-3">
            {best.map((x) => (
              <li key={x.asset.id} className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <ArrowUpRight className="size-4 text-positive" />
                  {x.asset.name}
                </span>
                <PerfPair value={x.gain} percent={x.gainPct} currency={base} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <p className="label-eyebrow">À surveiller</p>
          <ul className="mt-4 space-y-3">
            {worst.map((x) => (
              <li key={x.asset.id} className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <ArrowDownRight className="size-4 text-negative" />
                  {x.asset.name}
                </span>
                <PerfPair value={x.gain} percent={x.gainPct} currency={base} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-4">
        <p className="label-eyebrow">Lecture du portefeuille</p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>
            Votre patrimoine vaut {money(summary.totalValue, base)} pour{" "}
            {money(summary.invested, base)} investis, soit {pct(summary.gainPct)} de performance
            latente.
          </li>
          {heavy.map((x) => (
            <li key={x.asset.id}>
              Concentration : {x.asset.name} représente {x.weight.toFixed(1).replace(".", ",")} % du
              portefeuille, au-delà de votre seuil de {concentration} %.
            </li>
          ))}
          {summary.income > 0 && (
            <li>
              Vos investissements ont généré {money(summary.income, base)} de revenus depuis le
              départ.
            </li>
          )}
        </ul>
      </Panel>
    </>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}
