"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BadgeCheck, Home, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { btnPrimary, cx, fieldClass } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { AccountType } from "@/lib/types";
import { useTitle } from "@/lib/use-title";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, configured } = useAuth();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("voyageur");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useTitle("Connexion · Ameena");

  const requested = params.get("retour") ?? "/compte";
  const returnTo = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/compte";

  useEffect(() => {
    if (!loading && user) router.replace(returnTo);
  }, [loading, returnTo, router, user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "connexion") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.replace(returnTo);
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim(), account_type: accountType },
            emailRedirectTo: `${window.location.origin}/connexion?retour=${encodeURIComponent(returnTo)}`,
          },
        });
        if (authError) throw authError;
        if (data.session) router.replace(returnTo);
        else setMessage("Compte créé. Ouvrez l’e-mail de confirmation pour activer votre accès.");
      }
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "Connexion impossible.";
      setError(
        detail.toLowerCase().includes("invalid login")
          ? "E-mail ou mot de passe incorrect."
          : detail.toLowerCase().includes("already registered")
            ? "Un compte existe déjà avec cet e-mail."
            : detail,
      );
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold">Connexion indisponible</h1>
        <p className="mt-3 text-[#6a6a6a]">Les variables Supabase doivent être configurées sur le déploiement.</p>
      </div>
    );
  }

  return (
    <div className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-[1.05fr_.95fr]">
      <section className="hidden bg-[#143f3b] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="logo-word text-4xl">Ameena</Link>
        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-[0.18em] text-white/60">La confiance, avant la transaction</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[1.08] tracking-tight">
            Un compte pour voyager, publier et gérer.
          </h1>
          <ul className="mt-8 grid gap-4 text-white/85">
            <li className="flex gap-3"><BadgeCheck className="mt-0.5 h-5 w-5" />Prix et commission visibles avant la demande.</li>
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5" />Chaque propriétaire ne voit que son portefeuille.</li>
            <li className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5" />Accès protégé par Supabase Auth et les politiques RLS.</li>
          </ul>
        </div>
        <p className="text-sm text-white/55">Ameena · Sénégal, puis international</p>
      </section>

      <section className="flex items-center justify-center bg-[#f2f2f2] px-0 pt-8 lg:bg-white lg:px-4 lg:py-12">
        <div className="min-h-[calc(100dvh-2rem)] w-full max-w-md rounded-t-[30px] bg-white px-7 py-7 lg:min-h-0 lg:rounded-none lg:px-0 lg:py-0">
          <div className="flex items-center justify-between lg:hidden">
            <Link href="/" aria-label="Fermer" className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#f2f2f2]"><X className="h-5 w-5" /></Link>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#E21D5A] text-white"><Home className="h-7 w-7" /></span>
            <span className="h-10 w-10" />
          </div>
          <div className="mt-8 grid grid-cols-2 rounded-full bg-[#f2f2f2] p-1 text-sm lg:mt-0">
            {(["connexion", "inscription"] as const).map((item) => (
              <button
                key={item}
                onClick={() => {
                  setMode(item);
                  setError("");
                  setMessage("");
                }}
                className={cx("rounded-full px-4 py-2.5 font-medium capitalize", mode === item && "bg-white shadow-sm")}
              >
                {item}
              </button>
            ))}
          </div>

          <h2 className="mt-8 text-center text-[28px] font-semibold tracking-tight lg:text-left lg:text-3xl">
            {mode === "connexion" ? "Connexion ou inscription" : "Créer votre compte"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#6a6a6a]">
            {mode === "connexion"
              ? "Retrouvez vos demandes et votre espace de gestion."
              : "Commencez comme voyageur ou préparez un espace professionnel."}
          </p>

          <form className="mt-7 grid gap-4" onSubmit={submit}>
            {mode === "inscription" && (
              <>
                <label className="text-sm font-medium">
                  Nom complet
                  <input className={`${fieldClass} mt-1`} required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
                </label>
                <fieldset>
                  <legend className="text-sm font-medium">Je souhaite</legend>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {([
                      ["voyageur", "Voyager"],
                      ["proprietaire", "Publier"],
                      ["agence", "Gérer"],
                    ] as const).map(([value, label]) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => setAccountType(value)}
                        className={cx(
                          "rounded-xl border px-3 py-3 text-sm",
                          accountType === value ? "border-[#E21D5A] bg-[#fff0f5] font-semibold text-[#C9144C]" : "border-[#dddddd]",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
            <label className="text-sm font-medium">
              E-mail
              <input className={`${fieldClass} mt-1`} required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </label>
            <label className="text-sm font-medium">
              Mot de passe
              <input className={`${fieldClass} mt-1`} required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "connexion" ? "current-password" : "new-password"} />
            </label>
            {error && <p role="alert" className="rounded-xl bg-[#fff1ee] px-4 py-3 text-sm text-[#a52a12]">{error}</p>}
            {message && <p className="rounded-xl bg-[#e7f4f2] px-4 py-3 text-sm text-[#145e57]">{message}</p>}
            <button className={`${btnPrimary} mt-2 w-full py-3`} disabled={busy || loading}>
              {busy ? "Un instant…" : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>
          <p className="mt-5 text-xs leading-5 text-[#6a6a6a]">
            En continuant, vous acceptez les conditions d’utilisation et la politique de confidentialité d’Ameena.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-[#6a6a6a]">Ouverture de la connexion…</div>}>
      <AuthForm />
    </Suspense>
  );
}
