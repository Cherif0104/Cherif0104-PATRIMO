"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, ChartNoAxesCombined, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { loadMyPortfolio, loadPropertyContracts } from "@/lib/supabase";
import type { PortfolioHolding, PropertyContract } from "@/lib/types";

export default function PortfolioPage() {
  const { user, loading } = useAuth();
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [contracts, setContracts] = useState<PropertyContract[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    Promise.all([loadMyPortfolio(), loadPropertyContracts()])
      .then(([portfolio, contractRows]) => {
        setHoldings(portfolio);
        setContracts(contractRows);
      })
      .catch(() => setError("Votre portefeuille ne peut pas être chargé."))
      .finally(() => setLoaded(true));
  }, [user]);

  const annualPotential = useMemo(
    () => holdings.reduce((sum, holding) => {
      if (holding.listing.purpose === "vente" || holding.listing.currency !== "XOF") return sum;
      const share = (holding.stakeholder.share_percent ?? 100) / 100;
      const annual = holding.listing.mode === "location" ? holding.listing.price * 12 : holding.listing.price * 180;
      return sum + annual * share;
    }, 0),
    [holdings],
  );

  if (loading || !loaded) return <main className="p-10 text-sm text-[#6a6a6a]">Ouverture du portefeuille…</main>;
  if (!user) return <main className="mx-auto max-w-lg px-6 py-24 text-center"><h1 className="text-3xl font-bold">Votre portefeuille immobilier</h1><p className="mt-3 text-[#6a6a6a]">Connectez-vous pour consulter les biens partagés par votre agence ou gestionnaire.</p><Link href="/connexion?retour=/portefeuille" className="mt-6 inline-flex rounded-full bg-[#182A39] px-5 py-3 text-sm font-semibold text-white">Se connecter</Link></main>;

  return (
    <main className="min-h-screen bg-[#f7f8f8] px-4 py-8 md:px-10 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-[.14em] text-[#FF4845]">Vue propriétaire et investisseur</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-[-.045em] text-[#182A39]">Mon portefeuille</h1>
        <p className="mt-3 max-w-2xl text-[#6a6a6a]">Suivez les biens auxquels un gestionnaire vous a donné accès, leurs contrats et une projection commerciale indicative.</p>
        {error && <p className="mt-5 rounded-xl bg-[#fff1ee] px-4 py-3 text-sm text-[#a52a12]">{error}</p>}
        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <Stat icon={<Building2 />} label="Biens suivis" value={String(holdings.length)} />
          <Stat icon={<FileText />} label="Contrats accessibles" value={String(contracts.length)} />
          <Stat icon={<ChartNoAxesCombined />} label="Potentiel annuel indicatif" value={formatMoney(annualPotential, "XOF")} />
        </section>
        <p className="mt-3 text-xs text-[#7a7a7a]">Projection brute basée sur les prix affichés et la quote-part, hors vacance, frais, fiscalité et impayés. Elle ne constitue pas une garantie de rendement.</p>
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {holdings.map(({ listing, stakeholder }) => (
            <Link key={stakeholder.id} href={`/logements/${listing.id}`} className="overflow-hidden rounded-[24px] border border-[#e5e5e5] bg-white p-5 transition hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-[#FF4845]">{stakeholder.role}</p>
                  <h2 className="mt-1 text-lg font-bold text-[#182A39]">{listing.title}</h2>
                  <p className="mt-1 text-sm text-[#6a6a6a]">{listing.neighborhood}, {listing.city}</p>
                </div>
                {stakeholder.share_percent && <span className="rounded-full bg-[#FFF8ED] px-3 py-1 text-xs font-bold">{stakeholder.share_percent} %</span>}
              </div>
              <p className="mt-5 font-semibold">{formatMoney(listing.price, listing.currency)} <span className="font-normal text-[#6a6a6a]">{listing.purpose === "vente" ? "prix de vente" : listing.mode === "location" ? "/ mois" : "/ nuit"}</span></p>
            </Link>
          ))}
          {holdings.length === 0 && <div className="md:col-span-2 rounded-[24px] border border-dashed border-[#c9c9c9] bg-white p-10 text-center"><h2 className="font-bold">Aucun bien partagé</h2><p className="mt-2 text-sm text-[#6a6a6a]">Votre agence ou gestionnaire peut vous ajouter depuis la fiche de gestion du bien.</p></div>}
        </section>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <article className="rounded-[22px] border border-[#e5e5e5] bg-white p-5"><span className="text-[#FF4845]">{icon}</span><p className="mt-4 text-sm text-[#6a6a6a]">{label}</p><p className="mt-1 text-2xl font-extrabold tracking-tight text-[#182A39]">{value}</p></article>;
}
