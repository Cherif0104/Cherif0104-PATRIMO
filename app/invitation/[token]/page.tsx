"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { btnPrimary, btnSecondary } from "@/lib/format";
import { acceptOrganizationInvitation } from "@/lib/supabase";
import { useTitle } from "@/lib/use-title";

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useTitle("Invitation équipe · Se Loger au Sénégal");

  async function accept() {
    setBusy(true);
    setError("");
    try {
      await acceptOrganizationInvitation(token);
      router.replace("/gestion");
    } catch {
      setError("Cette invitation est invalide, expirée ou destinée à une autre adresse e-mail.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="p-10 text-center text-sm">Chargement…</p>;
  return (
    <main className="mx-auto max-w-lg px-6 py-20 text-center">
      <h1 className="text-3xl font-semibold">Rejoindre une équipe</h1>
      <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">L’adresse de votre compte doit correspondre à celle utilisée par l’agence pour vous inviter.</p>
      {error && <p role="alert" className="mt-4 text-sm text-[#a52a12]">{error}</p>}
      {!user ? (
        <Link href={`/connexion?retour=${encodeURIComponent(`/invitation/${token}`)}`} className={`${btnPrimary} mt-6`}>Se connecter</Link>
      ) : (
        <button className={`${btnPrimary} mt-6`} disabled={busy} onClick={() => void accept()}>{busy ? "Vérification…" : "Accepter l’invitation"}</button>
      )}
      <Link href="/" className={`${btnSecondary} mt-3`}>Retour à l’accueil</Link>
    </main>
  );
}
