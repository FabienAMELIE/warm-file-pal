import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { TransactionDialog } from "@/components/TransactionDialog";
import { EmptyState, Panel } from "@/components/Stat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio } from "@/lib/finance/usePortfolio";
import { TRANSACTION_TYPES } from "@/lib/finance/types";
import { frDate, money, num } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Historique des transactions — Patrimonia" },
      {
        name: "description",
        content: "Achats, ventes, dividendes, loyers et frais : l'historique complet de vos flux.",
      },
      { property: "og:title", content: "Historique des transactions — Patrimonia" },
      {
        property: "og:description",
        content: "Consultez et gérez toutes vos opérations d'investissement.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <TransactionsPage />
    </AppShell>
  ),
});

function TransactionsPage() {
  const { user } = useAuth();
  const { data, base, refresh, isLoading } = usePortfolio(user?.id);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  const assetName = useMemo(
    () => Object.fromEntries(data.assets.map((a) => [a.id, a.name])),
    [data.assets],
  );

  const rows = useMemo(
    () =>
      [...data.transactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .filter((t) => {
          const name = (t.asset_id ? assetName[t.asset_id] : "") ?? "";
          const okQ =
            !q ||
            name.toLowerCase().includes(q.toLowerCase()) ||
            (t.notes ?? "").toLowerCase().includes(q.toLowerCase());
          return okQ && (type === "all" || t.type === type);
        }),
    [data.transactions, assetName, q, type],
  );

  if (!user) return null;
  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  async function remove(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Transaction supprimée");
    refresh();
  }

  const addTrigger = (
    <Button>
      <Plus className="size-4" /> Opération
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle={`${data.transactions.length} opérations enregistrées.`}
        action={
          <TransactionDialog
            userId={user.id}
            assets={data.assets}
            accounts={data.accounts}
            onSaved={refresh}
            trigger={addTrigger}
          />
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Rechercher…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Tous les types</option>
          {TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Aucune opération"
          description="Enregistrez vos achats, ventes, dividendes ou loyers pour alimenter les calculs de performance."
        />
      ) : (
        <Panel className="overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Investissement</th>
                <th className="px-4 py-3 text-right font-medium">Quantité</th>
                <th className="px-4 py-3 text-right font-medium">Prix</th>
                <th className="px-4 py-3 text-right font-medium">Montant</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-border/60 last:border-0">
                  <td className="num px-4 py-3">{frDate(t.date)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        t.type === "Achat" || t.type === "Dépôt"
                          ? "bg-brass/15 text-brass"
                          : t.type === "Vente" || t.type === "Retrait"
                            ? "bg-negative/10 text-negative"
                            : "bg-positive/10 text-positive",
                      )}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.asset_id ? (assetName[t.asset_id] ?? "—") : "—"}
                    {t.notes && <p className="text-xs text-muted-foreground">{t.notes}</p>}
                  </td>
                  <td className="num px-4 py-3 text-right">
                    {t.quantity != null ? num(Number(t.quantity), 4) : "—"}
                  </td>
                  <td className="num px-4 py-3 text-right">
                    {t.unit_price != null ? money(Number(t.unit_price), t.currency, 2) : "—"}
                  </td>
                  <td className="num px-4 py-3 text-right">
                    {money(Number(t.amount), t.currency || base, 2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <TransactionDialog
                        userId={user.id}
                        assets={data.assets}
                        accounts={data.accounts}
                        transaction={t}
                        onSaved={refresh}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Modifier">
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Supprimer"
                        onClick={() => remove(t.id)}
                      >
                        <Trash2 className="size-4 text-negative" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </>
  );
}
