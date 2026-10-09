"use client";

import Link from "next/link";
import { Headphones, MessageCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { btnPrimary, btnSecondary } from "@/lib/format";
import { useTitle } from "@/lib/use-title";

export default function MessagesPage() {
  const { user } = useAuth();
  useTitle("Messages · Ameena");

  return (
    <main className="mobile-page px-4 py-7 md:px-10 lg:py-12 xl:px-16">
      <h1 className="text-[30px] font-semibold tracking-[-0.04em]">Messages</h1>
      <div className="mt-7 grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-[24px] border border-[#e5e5e5] p-4">
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#6a6a6a]">Conversations</p>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#f7f7f7] p-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#1F6F66] text-white"><Headphones className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-semibold">Assistance Ameena</p>
              <p className="text-xs text-[#6a6a6a]">Disponible pour préparer votre séjour</p>
            </div>
          </div>
        </aside>
        <section className="flex min-h-[430px] flex-col items-center justify-center rounded-[24px] border border-[#e5e5e5] p-8 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-[#f7f0e2] text-[#A77F39]">
            <MessageCircle className="h-9 w-9" />
          </span>
          <h2 className="mt-5 text-xl font-semibold">Vos échanges restent au même endroit</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#6a6a6a]">
            Contactez un hôte, un chauffeur ou l’assistance. Les coordonnées personnelles restent protégées avant confirmation.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-xs text-[#52706c]"><ShieldCheck className="h-4 w-4" /> Messagerie sécurisée</p>
          <Link href={user ? "/" : "/connexion?retour=/messages"} className={`${user ? btnSecondary : btnPrimary} mt-6`}>
            {user ? "Explorer les offres" : "Se connecter"}
          </Link>
        </section>
      </div>
    </main>
  );
}
