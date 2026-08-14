import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, Panel } from "@/components/Stat";
import { Field, Picker } from "@/components/AssetDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import type { Asset } from "@/lib/finance/types";
import { frDate } from "@/lib/format";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal d'investisseur — Patrimonia" },
      {
        name: "description",
        content:
          "Consignez vos décisions d'investissement et vos raisonnements pour apprendre de votre historique.",
      },
      { property: "og:title", content: "Journal d'investisseur — Patrimonia" },
      {
        property: "og:description",
        content: "Gardez la trace de vos décisions et de leurs raisons.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <JournalPage />
    </AppShell>
  ),
});

function JournalPage() {
  const { user } = useAuth();
  const { data, refresh, isLoading } = usePortfolio(user?.id);
  if (!user) return null;
  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  async function remove(id: string) {
    const { error } = await supabase.from("journal_entries").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Note supprimée");
    refresh();
  }

  return (
    <>
      <PageHeader
        title="Journal"
        subtitle="Vos décisions, avec le contexte qui les a motivées."
        action={<EntryDialog userId={user.id} assets={data.assets} onSaved={refresh} />}
      />

      {data.journal.length === 0 ? (
        <EmptyState
          title="Journal vide"
          description="Écrivez pourquoi vous achetez, vendez ou attendez. Avec le temps, ces notes valent de l'or."
        />
      ) : (
        <ol className="space-y-3">
          {data.journal.map((e) => (
            <li key={e.id}>
              <Panel>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {frDate(e.date)}
                      {e.asset_id
                        ? ` · ${data.assets.find((a) => a.id === e.asset_id)?.name ?? ""}`
                        : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => remove(e.id)}>
                    <Trash2 className="size-4 text-negative" />
                  </Button>
                </div>
                {e.content && (
                  <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{e.content}</p>
                )}
              </Panel>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function EntryDialog({
  userId,
  assets,
  onSaved,
}: {
  userId: string;
  assets: Asset[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    title: "",
    content: "",
    asset_id: "",
  });

  async function save() {
    if (!form.title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    const { error } = await supabase.from("journal_entries").insert({
      user_id: userId,
      date: form.date,
      title: form.title.trim(),
      content: form.content.trim() || null,
      asset_id: form.asset_id || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Note ajoutée");
    setOpen(false);
    setForm({ date: new Date().toISOString().slice(0, 10), title: "", content: "", asset_id: "" });
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle note</DialogTitle>
          <DialogDescription>Documentez la décision et son raisonnement.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Investissement lié">
            <Picker
              value={form.asset_id || "none"}
              onChange={(v) => setForm({ ...form, asset_id: v === "none" ? "" : v })}
              options={["none", ...assets.map((a) => a.id)]}
              labels={{ none: "Aucun", ...Object.fromEntries(assets.map((a) => [a.id, a.name])) }}
            />
          </Field>
          <Field label="Titre" className="sm:col-span-2">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Renforcement ETF World"
            />
          </Field>
          <Field label="Raisonnement" className="sm:col-span-2">
            <Textarea
              rows={5}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button onClick={save}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
