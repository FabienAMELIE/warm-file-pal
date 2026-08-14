import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Panel } from "@/components/Stat";
import { Field, Picker } from "@/components/AssetDialog";
import { SeedDemoButton } from "@/components/DemoBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio } from "@/lib/finance/usePortfolio";
import { deleteDemoData } from "@/lib/demo";
import { CURRENCIES } from "@/lib/finance/types";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres du compte — Patrimonia" },
      {
        name: "description",
        content: "Devise de référence, seuil de concentration et gestion des données de démonstration.",
      },
      { property: "og:title", content: "Paramètres du compte — Patrimonia" },
      {
        property: "og:description",
        content: "Personnalisez votre devise de référence et vos seuils d'alerte.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data, refresh, isLoading } = usePortfolio(user?.id);
  const [form, setForm] = useState({ name: "", currency: "EUR", threshold: "30" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data.profile) {
      setForm({
        name: data.profile.display_name ?? "",
        currency: data.profile.base_currency ?? "EUR",
        threshold: String(data.profile.concentration_threshold ?? 30),
      });
    }
  }, [data.profile]);

  if (!user) return null;
  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  async function save() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.name.trim() || null,
        base_currency: form.currency,
        concentration_threshold: Number(form.threshold) || 30,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Préférences enregistrées");
    refresh();
  }

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Vos préférences d'affichage et de suivi." />

      <Panel className="mb-4">
        <p className="label-eyebrow">Préférences</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nom affiché">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Devise de référence">
            <Picker
              value={form.currency}
              onChange={(v) => setForm({ ...form, currency: v })}
              options={[...CURRENCIES]}
            />
          </Field>
          <Field label="Seuil d'alerte de concentration (%)">
            <Input
              inputMode="numeric"
              value={form.threshold}
              onChange={(e) => setForm({ ...form, threshold: e.target.value })}
            />
          </Field>
        </div>
        <Button className="mt-5" onClick={save} disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </Panel>

      <Panel className="mb-4">
        <p className="label-eyebrow">Données de démonstration</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {data.profile?.has_demo_data
            ? "Un jeu de démonstration est actuellement chargé sur votre compte."
            : "Chargez un portefeuille fictif pour explorer toutes les fonctionnalités."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.profile?.has_demo_data ? (
            <Button
              variant="outline"
              onClick={async () => {
                await deleteDemoData(user.id);
                toast.success("Données de démonstration supprimées");
                refresh();
              }}
            >
              Supprimer les données démo
            </Button>
          ) : (
            <SeedDemoButton userId={user.id} onDone={refresh} />
          )}
        </div>
      </Panel>

      <Panel>
        <p className="label-eyebrow">Compte</p>
        <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={async () => {
            await signOut();
            void navigate({ to: "/auth" });
          }}
        >
          Se déconnecter
        </Button>
      </Panel>
    </>
  );
}
