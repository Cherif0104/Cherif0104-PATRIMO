"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { btnPrimary } from "@/lib/format";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-12 text-center text-sm text-[#6a6a6a]">Vérification de l’accès…</div>;

  if (!user || user.app_metadata?.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-sm font-medium text-[#1F6F66]">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Accès réservé</h1>
        <p className="mt-3 text-[#6a6a6a]">Le rôle administrateur est attribué côté serveur. Il ne peut pas être sélectionné dans l’interface.</p>
        <Link href={user ? "/compte" : "/connexion?retour=/admin"} className={`${btnPrimary} mt-7`}>
          {user ? "Retour au compte" : "Se connecter"}
        </Link>
      </div>
    );
  }

  return children;
}
