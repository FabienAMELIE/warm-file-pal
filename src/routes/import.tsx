import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Panel } from "@/components/Stat";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio } from "@/lib/finance/usePortfolio";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Import CSV des transactions — Patrimonia" },
      {
        name: "description",
        content: "Importez votre historique d'opérations depuis un fichier CSV en quelques secondes.",
      },
      { property: "og:title", content: "Import CSV des transactions — Patrimonia" },
      {
        property: "og:description",
        content: "Reprenez votre historique existant sans ressaisie manuelle.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <ImportPage />
    </AppShell>
  ),
});

const HEADERS = "date,type,actif,quantite,prix_unitaire,montant,devise,frais,note";
const EXAMPLE = `${HEADERS}
2023-01-15,Achat,ETF MSCI World,12,88.40,1060.80,EUR,1.50,Renforcement mensuel
2023-06-30,Dividende,ETF MSCI World,,,42.10,EUR,0,Distribution semestrielle`;

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') quoted = !quoted;
    else if ((c === "," || c === ";") && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  out.push(cur.trim());
  return out;
}

function ImportPage() {
  const { user } = useAuth();
  const { data, refresh } = usePortfolio(user?.id);
  const [report, setReport] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!user) return;
    setBusy(true);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const header = splitLine(lines[0] ?? "").map((h) => h.toLowerCase());
    const idx = (name: string) => header.indexOf(name);
    const messages: string[] = [];
    type TxInsert = {
      user_id: string;
      date: string;
      type: string;
      asset_id: string | null;
      quantity: number | null;
      unit_price: number | null;
      amount: number;
      currency: string;
      fees: number;
      notes: string | null;
    };
    const rows: TxInsert[] = [];

    const assetByName = new Map(data.assets.map((a) => [a.name.toLowerCase(), a.id]));

    for (let i = 1; i < lines.length; i++) {
      const cells = splitLine(lines[i]!);
      const get = (name: string) => {
        const j = idx(name);
        return j >= 0 ? (cells[j] ?? "") : "";
      };
      const date = get("date");
      const type = get("type");
      const amount = Number(get("montant").replace(",", "."));
      if (!date || !type || !Number.isFinite(amount)) {
        messages.push(`Ligne ${i + 1} ignorée : date, type ou montant invalide.`);
        continue;
      }
      const assetName = get("actif").toLowerCase();
      rows.push({
        user_id: user.id,
        date,
        type,
        asset_id: assetName ? (assetByName.get(assetName) ?? null) : null,
        quantity: get("quantite") ? Number(get("quantite").replace(",", ".")) : null,
        unit_price: get("prix_unitaire") ? Number(get("prix_unitaire").replace(",", ".")) : null,
        amount,
        currency: get("devise") || "EUR",
        fees: get("frais") ? Number(get("frais").replace(",", ".")) : 0,
        notes: get("note") || null,
      });
      if (assetName && !assetByName.has(assetName)) {
        messages.push(`Ligne ${i + 1} : actif « ${get("actif")} » inconnu, transaction non rattachée.`);
      }
    }

    if (rows.length) {
      const { error } = await supabase.from("transactions").insert(rows);
      if (error) messages.unshift(`Erreur d'import : ${error.message}`);
      else {
        messages.unshift(`${rows.length} transactions importées.`);
        refresh();
        toast.success(`${rows.length} transactions importées`);
      }
    } else {
      messages.unshift("Aucune ligne valide détectée.");
    }
    setReport(messages);
    setBusy(false);
  }

  return (
    <>
      <PageHeader
        title="Import CSV"
        subtitle="Reprenez votre historique existant sans tout ressaisir."
      />

      <Panel>
        <p className="label-eyebrow">Format attendu</p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-4 text-xs leading-relaxed">
          {EXAMPLE}
        </pre>
        <p className="mt-3 text-xs text-muted-foreground">
          Séparateur virgule ou point-virgule. Les actifs sont rattachés par leur nom exact ; créez-les
          au préalable dans « Investissements ».
        </p>
        <div className="mt-5">
          <label className="inline-flex">
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <Button asChild disabled={busy}>
              <span>
                <Upload className="size-4" /> {busy ? "Import en cours…" : "Choisir un fichier CSV"}
              </span>
            </Button>
          </label>
        </div>
      </Panel>

      {report.length > 0 && (
        <Panel className="mt-4">
          <p className="label-eyebrow">Rapport d'import</p>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {report.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
