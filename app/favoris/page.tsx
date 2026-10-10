"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { PropertyCard } from "@/components/property-card";
import { btnPrimary } from "@/lib/format";
import { useAmeena } from "@/lib/store";
import { useTitle } from "@/lib/use-title";

export default function FavoritesPage() {
  const { state } = useAmeena();
  useTitle("Favoris · Se Loger au Sénégal");
  const listings = state.listings.filter((listing) => state.saved.includes(listing.id));

  return (
    <main className="mobile-page px-4 py-7 md:px-10 lg:py-12 xl:px-16">
      <div className="flex items-center justify-between">
        <h1 className="text-[30px] font-semibold tracking-[-0.04em]">Favoris</h1>
        {listings.length > 0 && <span className="text-sm text-[#6a6a6a]">{listings.length} enregistré{listings.length > 1 ? "s" : ""}</span>}
      </div>

      {listings.length > 0 ? (
        <div className="mt-7 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {listings.map((listing) => <PropertyCard key={listing.id} listing={listing} />)}
        </div>
      ) : (
        <section className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
          <span className="grid h-24 w-24 place-items-center rounded-full bg-[#fff1f3] text-[#C13515]">
            <Heart className="h-11 w-11" strokeWidth={1.5} />
          </span>
          <h2 className="mt-6 text-2xl font-semibold">Créez votre première sélection</h2>
          <p className="mt-2 text-[15px] leading-6 text-[#6a6a6a]">
            Touchez le cœur d’un logement pour le retrouver ici.
          </p>
          <Link href="/" className={`${btnPrimary} mt-6`}>Commencer à explorer</Link>
        </section>
      )}
    </main>
  );
}
