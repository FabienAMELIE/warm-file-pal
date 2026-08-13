import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDemoData, seedDemoData } from "@/lib/demo";

export function DemoBanner({
  userId,
  active,
  onChange,
}: {
  userId: string;
  active: boolean;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  if (!active) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brass/40 bg-brass/10 px-4 py-3">
      <p className="flex items-center gap-2 text-sm">
        <Sparkles className="size-4 text-brass" />
        Vous explorez un <strong className="font-medium">jeu de données de démonstration</strong>.
        Supprimez-le pour partir d'une page blanche.
      </p>
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await deleteDemoData(userId);
            toast.success("Données de démonstration supprimées");
            onChange();
          } catch (e) {
            toast.error((e as Error).message);
          }
          setBusy(false);
        }}
      >
        {busy ? "Suppression…" : "Supprimer les données démo"}
      </Button>
    </div>
  );
}

export function SeedDemoButton({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await seedDemoData(userId);
          toast.success("Données de démonstration chargées");
          onDone();
        } catch (e) {
          toast.error((e as Error).message);
        }
        setBusy(false);
      }}
    >
      {busy ? "Chargement…" : "Charger un exemple"}
    </Button>
  );
}
