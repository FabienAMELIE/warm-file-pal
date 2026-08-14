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

type Profile = {
  ticker: boolean;
  sector: boolean;
  geography: boolean;
  pricing: "unit" | "value" | "choice";
  priceLabelUnit?: string;
  priceLabelValue?: string;
  accountLabel: string;
  hint: string;
};

const LISTED: Profile = {
  ticker: true,
  sector: true,
  geography: true,
  pricing: "unit",
  priceLabelUnit: "Cours actuel (par titre)",
  accountLabel: "Compte / enveloppe (PEA, CTO…)",
  hint: "Titre coté : la valeur est calculée à partir du cours et de la quantité détenue.",
};

const ASSET_PROFILES: Record<string, Profile> = {
  Actions: LISTED,
  ETF: LISTED,
  Obligations: LISTED,
  Fonds: LISTED,
  Crypto: {
    ...LISTED,
    sector: false,
    priceLabelUnit: "Cours actuel (par unité)",
    accountLabel: "Plateforme / compte crypto",
    hint: "Crypto : indiquez le cours actuel, la quantité vient de vos transactions.",
  },
  Immobilier: {
    ticker: false,
    sector: false,
    geography: true,
    pricing: "value",
    priceLabelValue: "Valeur estimée du bien",
    accountLabel: "Rattaché à (optionnel)",
    hint: "Bien immobilier : saisissez directement sa valeur estimée actuelle.",
  },
  SCPI: {
    ticker: false,
    sector: false,
    geography: true,
    pricing: "choice",
    priceLabelUnit: "Prix de la part",
    priceLabelValue: "Valeur totale détenue",
    accountLabel: "Compte / enveloppe",
    hint: "SCPI : suivez en nombre de parts ou en valeur globale.",
  },
  Crowdfunding: {
    ticker: false,
    sector: false,
    geography: false,
    pricing: "value",
    priceLabelValue: "Capital en cours",
    accountLabel: "Plateforme",
    hint: "Crowdfunding : indiquez le capital actuellement investi.",
  },
  "Private equity": {
    ticker: false,
    sector: true,
    geography: true,
    pricing: "value",
    priceLabelValue: "Valorisation estimée",
    accountLabel: "Compte / structure",
    hint: "Private equity : valorisation estimée à la dernière évaluation.",
  },
  Livret: {
    ticker: false,
    sector: false,
    geography: false,
    pricing: "value",
    priceLabelValue: "Solde actuel",
    accountLabel: "Banque / compte",
    hint: "Livret ou fonds euros : indiquez simplement le solde actuel.",
  },
  Autre: {
    ticker: true,
    sector: true,
    geography: true,
    pricing: "choice",
    priceLabelUnit: "Prix unitaire actuel",
    priceLabelValue: "Valeur actuelle estimée",
    accountLabel: "Compte / enveloppe",
    hint: "Choisissez le mode de valorisation qui correspond le mieux.",
  },
};

const profileFor = (t: string): Profile => ASSET_PROFILES[t] ?? ASSET_PROFILES["Autre"]!;

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

  const profile = profileFor(form.asset_type);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const setType = (t: string) => {
    const p = profileFor(t);
    setForm((f) => ({
      ...f,
      asset_type: t,
      pricing_mode: p.pricing === "choice" ? f.pricing_mode : p.pricing,
      ticker: p.ticker ? f.ticker : "",
      sector: p.sector ? f.sector : "Non renseigné",
      geography: p.geography ? f.geography : "Non renseigné",
    }));
  };


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
