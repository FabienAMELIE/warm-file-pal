import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASSET_TYPES, CURRENCIES, GEOGRAPHIES, SECTORS, type Account, type Asset } from "@/lib/finance/types";

interface Props {
  userId: string;
  accounts: Account[];
  onSaved: () => void;
  asset?: Asset;
  trigger: React.ReactNode;
}

export function AssetDialog({ userId, accounts, onSaved, asset, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: asset?.name ?? "",
    ticker: asset?.ticker ?? "",
    asset_type: asset?.asset_type ?? "ETF",
    sector: asset?.sector ?? "Non renseigné",
    geography: asset?.geography ?? "Monde",
    currency: asset?.currency ?? "EUR",
    pricing_mode: asset?.pricing_mode ?? "unit",
    account_id: asset?.account_id ?? "",
    current_price: asset?.current_price != null ? String(asset.current_price) : "",
    notes: asset?.notes ?? "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    setSaving(true);
    const payload = {
      user_id: userId,
      name: form.name.trim(),
      ticker: form.ticker.trim() || null,
      asset_type: form.asset_type,
      sector: form.sector,
      geography: form.geography,
      currency: form.currency,
      pricing_mode: form.pricing_mode,
      account_id: form.account_id || null,
      current_price: form.current_price ? Number(form.current_price) : null,
      notes: form.notes.trim() || null,
    };
    const { error } = asset
      ? await supabase.from("assets").update(payload).eq("id", asset.id)
      : await supabase.from("assets").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(asset ? "Investissement mis à jour" : "Investissement ajouté");
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{asset ? "Modifier l'investissement" : "Nouvel investissement"}</DialogTitle>
          <DialogDescription>
            Choisissez « valeur globale » pour l'immobilier ou un livret, « prix unitaire » pour un
            titre coté.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="ETF MSCI World" />
          </Field>
          <Field label="Ticker (optionnel)">
            <Input value={form.ticker} onChange={(e) => set("ticker", e.target.value)} placeholder="IWDA" />
          </Field>
          <Field label="Type d'actif">
            <Picker value={form.asset_type} onChange={(v) => set("asset_type", v)} options={[...ASSET_TYPES]} />
          </Field>
          <Field label="Compte / enveloppe">
            <Picker
              value={form.account_id || "none"}
              onChange={(v) => set("account_id", v === "none" ? "" : v)}
              options={["none", ...accounts.map((a) => a.id)]}
              labels={{ none: "Aucun", ...Object.fromEntries(accounts.map((a) => [a.id, a.name])) }}
            />
          </Field>
          <Field label="Devise">
            <Picker value={form.currency} onChange={(v) => set("currency", v)} options={[...CURRENCIES]} />
          </Field>
          <Field label="Secteur">
            <Picker value={form.sector} onChange={(v) => set("sector", v)} options={[...SECTORS]} />
          </Field>
          <Field label="Géographie">
            <Picker value={form.geography} onChange={(v) => set("geography", v)} options={[...GEOGRAPHIES]} />
          </Field>
          <Field label="Mode de valorisation">
            <Picker
              value={form.pricing_mode}
              onChange={(v) => set("pricing_mode", v)}
              options={["unit", "value"]}
              labels={{ unit: "Prix unitaire × quantité", value: "Valeur globale estimée" }}
            />
          </Field>
          <Field label={form.pricing_mode === "unit" ? "Prix actuel" : "Valeur actuelle estimée"}>
            <Input
              inputMode="decimal"
              value={form.current_price}
              onChange={(e) => set("current_price", e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Note" className="sm:col-span-2">
            <Input value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="label-eyebrow mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

export function Picker({
  value,
  onChange,
  options,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {labels?.[o] ?? o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
