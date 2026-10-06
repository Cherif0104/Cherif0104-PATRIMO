"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bed, Building2, Globe, Home, KeyRound, Shield, Sparkles, Waves } from "lucide-react";
import { AdSlot } from "@/components/ad-slot";
import { PropertyCard } from "@/components/property-card";
import { SearchBar } from "@/components/search-bar";
import { cx } from "@/lib/format";
import { useAmeena } from "@/lib/store";
import type { Listing } from "@/lib/types";

const categories = [
  { id: "tous", label: "Tout", icon: Sparkles },
  { id: "mer", label: "Bord de mer", icon: Waves },
  { id: "villa", label: "Villas", icon: Home },
  { id: "appartement", label: "Appartements", icon: Building2 },
  { id: "location", label: "Longue durée", icon: KeyRound },
  { id: "gere", label: "Géré par Ameena", icon: Shield },
  { id: "monde", label: "À l'international", icon: Globe },
  { id: "studio", label: "Studios", icon: Bed },
];

function matchCategory(listing: Listing, category: string) {
  if (category === "tous") return true;
  if (category === "mer") return listing.amenities.includes("Vue mer");
  if (category === "location") return listing.mode === "location";
  if (category === "gere") return listing.managedByPlatform;
  if (category === "monde") return listing.country !== "Sénégal";
  if (category === "villa") return listing.type === "villa" || listing.type === "maison";
  if (category === "studio") return listing.type === "studio";
  if (category === "appartement") return listing.type === "appartement";
  return true;
}

export default function HomePage() {
  const { state } = useAmeena();
  const [category, setCategory] = useState("tous");
  const listings = useMemo(
    () => state.listings.filter((listing) => matchCategory(listing, category)),
    [state.listings, category],
  );
  const shops = state.settings.ads.filter((ad) => ad.active && ad.placement === "boutique");

  return (
    <div>
      <section className="px-4 pb-4 pt-8 md:px-10 xl:px-16">
        <SearchBar />
        <div className="no-scrollbar mt-8 flex gap-8 overflow-x-auto border-b border-[#ebebeb] px-2">
          {categories.map((item) => {
            const Icon = item.icon;
            const active = category === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCategory(item.id)}
                className={cx(
                  "flex shrink-0 flex-col items-center gap-2 border-b-2 pb-3 text-xs",
                  active ? "border-[#222] text-[#222]" : "border-transparent text-[#6a6a6a] hover:text-[#222]",
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={1.5} />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-4 py-8 md:px-10 xl:px-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight">
              {category === "location" ? "Locations longue durée" : category === "gere" ? "Biens gérés par Ameena" : "Logements"}
            </h1>
            <p className="mt-1 text-sm text-[#6a6a6a]">{listings.length} bien{listings.length > 1 ? "s" : ""} · prix affiché, hôte identifié</p>
          </div>
          <Link href={`/explorer?categorie=${category}`} className="text-sm font-medium underline">
            Afficher la carte
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
          {listings.slice(0, 4).map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
        <div className="my-10">
          <AdSlot placement="accueil-bandeau" />
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
          {listings.slice(4).map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
        {listings.length === 0 && (
          <p className="py-16 text-center text-[#6a6a6a]">Aucun bien dans cette catégorie pour le moment.</p>
        )}
        <div className="mt-12">
          <AdSlot placement="accueil-rangee" />
        </div>
      </section>

      {shops.length > 0 && (
        <section className="px-4 pb-16 md:px-10 xl:px-16">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Boutiques partenaires</h2>
            <Link href="/boutiques" className="text-sm font-medium underline">
              Tout voir
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {shops.map((shop) => (
              <Link key={shop.id} href="/boutiques" className="overflow-hidden rounded-3xl border border-[#ebebeb]">
                <div className="relative h-44">
                  <img src={shop.image} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <p className="text-xs text-[#6a6a6a]">{shop.partner}</p>
                  <p className="mt-1 font-semibold">{shop.title}</p>
                  {shop.offer && <p className="mt-2 text-sm">{shop.offer}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
