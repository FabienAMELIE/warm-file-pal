import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, Panel, PerfPair } from "@/components/Stat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio } from "@/lib/finance/usePortfolio";
import { frDate, money, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portefeuille")({
  head: () => ({
    meta: [
      { title: "Portefeuille détaillé — Patrimonia" },
      {
        name: "description",
        content:
          "Toutes vos positions : quantité, prix de revient, valeur actuelle, plus-value et poids.",
      },
      { property: "og:title", content: "Portefeuille détaillé — Patrimonia" },
      {
        property: "og:description",
        content: "Toutes vos positions avec prix de revient, valeur actuelle et plus-value.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <PortfolioPage />
    </AppShell>
  ),
});

type SortKey = "name" | "currentValue" | "gain" | "gainPct" | "weight";

function PortfolioPage() {
  const { user } = useAuth();
  const { positions, summary, base, data, isLoading } = usePortfolio(user?.id);
  const [q, setQ] = useState("");
  const [account, setAccount] = useState("all");
  const [sort, setSort] = useState<SortKey>("currentValue");

  const rows = useMemo(() => {
    const filtered = positions.filter((p) => {
      const okQ =
        !q ||
        p.asset.name.toLowerCase().includes(q.toLowerCase()) ||
        (p.asset.ticker ?? "").toLowerCase().includes(q.toLowerCase());
      const okA = account === "all" || p.asset.account_id === account;
      return okQ && okA;
    });
    return filtered.sort((a, b) =>
      sort === "name" ? a.asset.name.localeCompare(b.asset.name) : b[sort] - a[sort],
    );
  }, [positions, q, account, sort]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  if (!positions.length) {
    return (
      <>
        <PageHeader title="Portefeuille" />
        <EmptyState
          title="Aucune position"
          description="Créez vos investissements puis enregistrez vos opérations pour voir apparaître vos positions."
          action={
            <Button asChild>
              <Link to="/investissements">Ajouter un investissement</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Portefeuille"
        subtitle={`${money(summary.totalValue, base)} répartis sur ${positions.length} lignes.`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Rechercher un actif…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Tous les comptes</option>
          {data.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="currentValue">Trier par valeur</option>
          <option value="gain">Trier par plus-value</option>
          <option value="gainPct">Trier par performance</option>
          <option value="weight">Trier par poids</option>
          <option value="name">Trier par nom</option>
        </select>
      </div>

      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <Th>Actif</Th>
              <Th right>Quantité</Th>
              <Th right>PRU</Th>
              <Th right>Cours</Th>
              <Th right>Investi</Th>
              <Th right>Valeur</Th>
              <Th right>Plus-value</Th>
              <Th right>Poids</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.asset.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{p.asset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[p.asset.ticker, p.asset.asset_type, frDate(p.firstDate)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </td>
                <Td>{p.asset.pricing_mode === "value" ? "—" : num(p.quantity, 4)}</Td>
                <Td>{p.asset.pricing_mode === "value" ? "—" : money(p.avgPrice, base, 2)}</Td>
                <Td>{p.asset.pricing_mode === "value" ? "—" : money(p.currentPrice, base, 2)}</Td>
                <Td>{money(p.invested, base)}</Td>
                <Td>{money(p.currentValue, base)}</Td>
                <td className="px-4 py-3 text-right">
                  <PerfPair value={p.gain} percent={p.gainPct} currency={base} />
                </td>
                <Td>{pct(p.weight).replace("+", "")}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={cn("px-4 py-3 font-medium", right && "text-right")}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="num px-4 py-3 text-right">{children}</td>;
}
