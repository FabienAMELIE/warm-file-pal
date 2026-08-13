import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/AssetDialog";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Patrimonia" },
      {
        name: "description",
        content: "Accédez à votre cockpit patrimonial : portefeuille, performance et projections.",
      },
      { property: "og:title", content: "Connexion — Patrimonia" },
      {
        property: "og:description",
        content: "Accédez à votre cockpit patrimonial : portefeuille, performance et projections.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/" });
  }, [loading, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: name },
        },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Compte créé. Vérifiez votre boîte mail si une confirmation est demandée.");
      void navigate({ to: "/" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      void navigate({ to: "/" });
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return toast.error("Connexion Google impossible pour le moment.");
    if (result.redirected) return;
    void navigate({ to: "/" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-border bg-sidebar p-12 lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-sm bg-brass text-[13px] font-semibold text-primary-foreground">
            P
          </span>
          <span className="font-serif text-xl">Patrimonia</span>
        </div>
        <div className="max-w-md">
          <h1 className="text-4xl leading-tight">
            Raconter l'histoire de votre patrimoine et comprendre son évolution.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            D'où vous êtes parti, ce que vous avez investi, ce que cela vous a rapporté, où vous en
            êtes aujourd'hui et où vous pourriez aller demain.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Vos données financières sont privées et visibles uniquement par vous.
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="panel w-full max-w-sm p-8">
          <h2 className="text-2xl">{mode === "signin" ? "Connexion" : "Créer un compte"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Accédez à votre cockpit d'investissement."
              : "Quelques secondes suffisent pour commencer."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <Field label="Nom">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fabien" />
              </Field>
            )}
            <Field label="Email">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
              />
            </Field>
            <Field label="Mot de passe">
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={google}>
            Continuer avec Google
          </Button>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "Pas encore de compte ? Créer un compte" : "J'ai déjà un compte"}
          </button>
        </div>
      </div>
    </div>
  );
}
