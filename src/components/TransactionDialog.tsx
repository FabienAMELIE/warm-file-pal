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
import { Field, Picker } from "@/components/AssetDialog";
import { CURRENCIES, TRANSACTION_TYPES, type Account, type Asset, type Transaction } from "@/lib/finance/types";

interface Props {
  userId: string;
  assets: Asset[];
  accounts: Account[];
  onSaved: () => void;
  transaction?: Transaction;
  defaultAssetId?: string;
  trigger: React.ReactNode;
}

const today = () => new Date().toISOString().slice(0, 10);

export function TransactionDialog({
  userId,
  assets,
  accounts,
  onSaved,
  transaction,
  defaultAssetId,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: transaction?.date ?? today(),
    type: transaction?.type ?? "Achat",
    asset_id: transaction?.asset_id ?? defaultAssetId ?? assets[0]?.id ?? "",
    account_id: transaction?.account_id ?? "",
    quantity: transaction?.quantity != null ? String(transaction.quantity) : "",
    unit_price: transaction?.unit_price != null ? String(transaction.unit_price) : "",
    amount: transaction ? String(transaction.amount) : "",
    currency: transaction?.currency ?? "EUR",
    fees: transaction ? String(transaction.fees) : "0",
    notes: transaction?.notes ?? "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => {
      const next = { ...f, [k]: v };
      if ((k === "quantity" || k === "unit_price") && next.quantity && next.unit_price) {
        next.amount = String(Number(next.quantity) * Number(next.unit_price));
      }
      if (k === "asset_id") {
        const a = assets.find((x) => x.id === v);
        if (a?.account_id) next.account_id = a.account_id;
        if (a?.currency) next.currency = a.currency;
      }
      return next;
    });

  const needsQuantity = form.type === "Achat" || form.type === "Vente";

  async function submit() {
    if (!form.amount) {
      toast.error("Le montant est obligatoire");
      return;
    }
    setSaving(true);
    const payload = {
      user_id: userId,
      date: form.date,
      type: form.type,
      asset_id: form.asset_id || null,
      account_id: form.account_id || null,
      quantity: form.quantity ? Number(form.quantity) : null,
      unit_price: form.unit_price ? Number(form.unit_price) : null,
      amount: Number(form.amount),
      currency: form.currency,
      fees: Number(form.fees || 0),
      notes: form.notes.trim() || null,
    };
    const { error } = transaction
      ? await supabase.from("transactions").update(payload).eq("id", transaction.id)
      : await supabase.from("transactions").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(transaction ? "Transaction mise à jour" : "Transaction enregistrée");
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{transaction ? "Modifier la transaction" : "Nouvelle transaction"}</DialogTitle>
          <DialogDescription>
            Le montant est calculé automatiquement à partir de la quantité et du prix unitaire.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date">
            <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
          <Field label="Type">
            <Picker value={form.type} onChange={(v) => set("type", v)} options={[...TRANSACTION_TYPES]} />
          </Field>
          <Field label="Investissement" className="sm:col-span-2">
            <Picker
              value={form.asset_id || "none"}
              onChange={(v) => set("asset_id", v === "none" ? "" : v)}
              options={["none", ...assets.map((a) => a.id)]}
              labels={{ none: "Aucun", ...Object.fromEntries(assets.map((a) => [a.id, a.name])) }}
            />
          </Field>
          <Field label="Compte">
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
          {needsQuantity && (
            <>
              <Field label="Quantité">
                <Input inputMode="decimal" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
              </Field>
              <Field label="Prix unitaire">
                <Input inputMode="decimal" value={form.unit_price} onChange={(e) => set("unit_price", e.target.value)} />
              </Field>
            </>
          )}
          <Field label="Montant">
            <Input inputMode="decimal" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
          </Field>
          <Field label="Frais">
            <Input inputMode="decimal" value={form.fees} onChange={(e) => set("fees", e.target.value)} />
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
