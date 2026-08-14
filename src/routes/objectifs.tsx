import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, Panel } from "@/components/Stat";
import { Field, Picker } from "@/components/AssetDialog";
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
import { frDate, money } from "@/lib/format";

export const Route = createFileRoute("/objectifs")({
  head: () => ({
    meta: [
      { title: "Objectifs patrimoniaux — Patrimonia" },
      {
        name: "description",
        content: "Définissez vos objectifs de capital ou de rente et suivez votre progression.",
      },
      { property: "og:title", content: "Objectifs patrimoniaux — Patrimonia" },
      {
        property: "og:description",
        content: "Suivez la progression vers vos objectifs de capital et de revenus.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <GoalsPage />
    </AppShell>
  ),
});

const KINDS = ["Capital", "Rente mensuelle"];

function GoalsPage() {
  const { user } = useAuth();
  const { data, summary, base, refresh, isLoading } = usePortfolio(user?.id);
  if (!user) return null;
  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  const monthlyIncome = summary.income > 0 ? summary.income / 12 : 0;

  async function remove(id: string) {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Objectif supprimé");
    refresh();
  }

  return (
    <>
      <PageHeader
        title="Objectifs"
        subtitle="Ce que vous visez, et à quelle distance vous en êtes."
        action={<GoalDialog userId={user.id} onSaved={refresh} />}
      />

      {data.goals.length === 0 ? (
        <EmptyState
          title="Aucun objectif défini"
          description="Fixez un objectif de capital (par exemple 500 000 €) ou de rente mensuelle pour mesurer votre progression."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.goals.map((g) => {
            const current = g.kind === "Capital" ? summary.totalValue : monthlyIncome;
            const progress = g.target_amount > 0 ? Math.min((current / g.target_amount) * 100, 100) : 0;
            return (
              <Panel key={g.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg">{g.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.kind}
                      {g.target_date ? ` · échéance ${frDate(g.target_date)}` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => remove(g.id)}>
                    <Trash2 className="size-4 text-negative" />
                  </Button>
                </div>
                <p className="num mt-4 text-2xl">
                  {money(current, base)}{" "}
                  <span className="text-sm text-muted-foreground">
                    / {money(g.target_amount, base)}
                  </span>
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brass" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {progress.toFixed(1).replace(".", ",")} % atteint · reste{" "}
                  {money(Math.max(g.target_amount - current, 0), base)}
                </p>
              </Panel>
            );
          })}
        </div>
      )}
    </>
  );
}

function GoalDialog({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", kind: "Capital", target: "", date: "" });

  async function save() {
    if (!form.name.trim() || !form.target) {
      toast.error("Nom et montant cible obligatoires");
      return;
    }
    const { error } = await supabase.from("goals").insert({
      user_id: userId,
      name: form.name.trim(),
      kind: form.kind,
      target_amount: Number(form.target),
      target_date: form.date || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Objectif créé");
    setOpen(false);
    setForm({ name: "", kind: "Capital", target: "", date: "" });
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Objectif
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvel objectif</DialogTitle>
          <DialogDescription>Un cap clair aide à tenir la stratégie dans la durée.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" className="sm:col-span-2">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Indépendance financière"
            />
          </Field>
          <Field label="Type">
            <Picker value={form.kind} onChange={(v) => setForm({ ...form, kind: v })} options={KINDS} />
          </Field>
          <Field label="Montant cible">
            <Input
              inputMode="decimal"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
            />
          </Field>
          <Field label="Échéance" className="sm:col-span-2">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
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
