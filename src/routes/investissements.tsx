import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { AssetDialog, Field, Picker } from "@/components/AssetDialog";
import { EmptyState, Panel } from "@/components/Stat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio } from "@/lib/finance/usePortfolio";
import { ACCOUNT_TYPES, CURRENCIES } from "@/lib/finance/types";
import { money, num } from "@/lib/format";

export const Route = createFileRoute("/investissements")({
  head: () => ({
    meta: [
      { title: "Investissements & comptes — Patrimonia" },
      {
        name: "description",
        content:
          "Créez vos comptes (PEA, CTO, assurance-vie…) et déclarez chaque investissement suivi.",
      },
      { property: "og:title", content: "Investissements & comptes — Patrimonia" },
      {
        property: "og:description",
        content: "Gérez vos comptes et vos lignes d'investissement dans un seul écran.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <InvestmentsPage />
    </AppShell>
  ),
});

function InvestmentsPage() {
  const { user } = useAuth();
  const { data, positions, base, refresh, isLoading } = usePortfolio(user?.id);
  if (!user) return null;
  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  async function removeAsset(id: string) {
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Investissement supprimé");
    refresh();
  }

  return (
    <>
      <PageHeader
        title="Investissements"
        subtitle="Vos comptes et les lignes que vous suivez."
        action={
          <div className="flex gap-2">
            <AccountDialog userId={user.id} onSaved={refresh} />
            <AssetDialog
              userId={user.id}
              accounts={data.accounts}
              onSaved={refresh}
              trigger={
                <Button>
                  <Plus className="size-4" /> Investissement
                </Button>
              }
            />
          </div>
        }
      />

      <Panel className="mb-4">
        <p className="label-eyebrow">Comptes</p>
        {data.accounts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Aucun compte. Créez-en un pour organiser vos investissements.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.accounts.map((a) => {
              const value = positions
                .filter((p) => p.asset.account_id === a.id)
                .reduce((s, p) => s + p.currentValue, 0);
              return (
                <li key={a.id} className="rounded-lg border border-border p-4">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[a.type, a.institution].filter(Boolean).join(" · ")}
                  </p>
                  <p className="num mt-2 text-lg">{money(value, base)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {data.assets.length === 0 ? (
        <EmptyState
          title="Aucun investissement"
          description="Ajoutez une action, un ETF, une crypto, une SCPI ou un bien immobilier pour commencer le suivi."
        />
      ) : (
        <Panel className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Compte</th>
                <th className="px-4 py-3 text-right font-medium">Quantité</th>
                <th className="px-4 py-3 text-right font-medium">Valeur</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.assets.map((asset) => {
                const pos = positions.find((p) => p.asset.id === asset.id);
                return (
                  <tr key={asset.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">{asset.ticker ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{asset.asset_type}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {data.accounts.find((a) => a.id === asset.account_id)?.name ?? "—"}
                    </td>
                    <td className="num px-4 py-3 text-right">
                      {asset.pricing_mode === "value" ? "—" : num(pos?.quantity ?? 0, 4)}
                    </td>
                    <td className="num px-4 py-3 text-right">{money(pos?.currentValue ?? 0, base)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <AssetDialog
                          userId={user.id}
                          accounts={data.accounts}
                          asset={asset}
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
                          onClick={() => removeAsset(asset.id)}
                        >
                          <Trash2 className="size-4 text-negative" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      )}
    </>
  );
}

function AccountDialog({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "CTO",
    institution: "",
    currency: "EUR",
  });

  async function save() {
    if (!form.name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    const { error } = await supabase.from("accounts").insert({
      user_id: userId,
      name: form.name.trim(),
      type: form.type,
      institution: form.institution.trim() || null,
      currency: form.currency,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compte créé");
    setOpen(false);
    setForm({ name: "", type: "CTO", institution: "", currency: "EUR" });
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="size-4" /> Compte
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau compte</DialogTitle>
          <DialogDescription>PEA, CTO, assurance-vie, compte crypto…</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" className="sm:col-span-2">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="PEA Bourse Direct"
            />
          </Field>
          <Field label="Type">
            <Picker
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
              options={[...ACCOUNT_TYPES]}
            />
          </Field>
          <Field label="Devise">
            <Picker
              value={form.currency}
              onChange={(v) => setForm({ ...form, currency: v })}
              options={[...CURRENCIES]}
            />
          </Field>
          <Field label="Établissement" className="sm:col-span-2">
            <Input
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button onClick={save}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
