"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Map, SlidersHorizontal } from "lucide-react";
import { AdSlot } from "@/components/ad-slot";
import { MapView } from "@/components/map";
import { PropertyCard } from "@/components/property-card";
import { fieldClass, nightsBetween } from "@/lib/format";
import { loadBlockedListingIds } from "@/lib/supabase";
import { useAmeena } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import type { Listing, Mode } from "@/lib/types";

function match(listing: Listing, params: URLSearchParams) {
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const mode = params.get("mode") as Mode | null;
  const guests = Number(params.get("voyageurs") ?? 0);
  const category = params.get("categorie") ?? "tous";
  const managed = params.get("gere") === "1";
  if (q) {
    const blob = `${listing.city} ${listing.country} ${listing.neighborhood} ${listing.title}`.toLowerCase();
    if (!blob.includes(q)) return false;
  }
  if (mode === "sejour" || mode === "location") {
    if (listing.mode !== mode) return false;
  }
  if (guests && listing.guests < guests) return false;
  if (managed && !listing.managedByPlatform) return false;
  if (category === "mer" && !listing.amenities.includes("Vue mer")) return false;
  if (category === "location" && listing.mode !== "location") return false;
  if (category === "gere" && !listing.managedByPlatform) return false;
  if (category === "monde" && listing.country === "Sénégal") return false;
  if (category === "villa" && listing.type !== "villa" && listing.type !== "maison") return false;
  if (category === "appartement" && listing.type !== "appartement") return false;
  if (category === "studio" && listing.type !== "studio") return false;
  return true;
}

function Explorer() {
  const params = useSearchParams();
  const { state } = useAmeena();
  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");
  const [managedOnly, setManagedOnly] = useState(params.get("gere") === "1");
  const [mode, setMode] = useState(params.get("mode") ?? "");
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  useTitle("Explorer · Ameena");

  const arrival = params.get("arrivee") ?? "";
  const departure = params.get("depart") ?? "";
  const stayNights = arrival && departure ? Math.max(1, nightsBetween(arrival, departure)) : undefined;
  const listingIdsKey = state.listings
    .map((listing) => listing.databaseId)
    .filter((id): id is string => Boolean(id))
    .sort()
    .join(",");

  useEffect(() => {
    if (!arrival || !departure || !listingIdsKey) {
      setBlockedIds([]);
      return;
    }
    loadBlockedListingIds(listingIdsKey.split(","), arrival, departure)
      .then(setBlockedIds)
      .catch(() => setBlockedIds([]));
  }, [arrival, departure, listingIdsKey]);

  const listings = useMemo(() => {
    const next = new URLSearchParams(params.toString());
    if (mode) next.set("mode", mode);
    else next.delete("mode");
    if (managedOnly) next.set("gere", "1");
    else next.delete("gere");
    return state.listings.filter((listing) => {
      if (listing.publicationStatus && listing.publicationStatus !== "published") return false;
      if (listing.databaseId && blockedIds.includes(listing.databaseId)) return false;
      if (!match(listing, next)) return false;
      if (maxPrice && listing.price > Number(maxPrice)) return false;
      return true;
    });
  }, [state.listings, params, mode, managedOnly, maxPrice, blockedIds]);

  const activeListing = listings.find((listing) => listing.id === active) ?? null;

  return (
    <div className="flex h-[calc(100dvh-5rem-4.25rem)] flex-col lg:h-[calc(100dvh-5rem)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#ebebeb] px-4 py-3 md:px-8">
        <SlidersHorizontal className="h-4 w-4 text-[#6a6a6a]" />
        <select className={`${fieldClass} w-auto`} value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="">Séjours et locations</option>
          <option value="sejour">Séjours</option>
          <option value="location">Locations</option>
        </select>
        <input
          className={`${fieldClass} w-36`}
          inputMode="numeric"
          placeholder="Prix max"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value.replace(/[^\d]/g, ""))}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={managedOnly} onChange={(event) => setManagedOnly(event.target.checked)} />
          Géré par Ameena
        </label>
        {arrival && (
          <span className="rounded-full border border-[#dddddd] px-3 py-2 text-xs font-medium">
            {arrival}{departure ? ` → ${departure}` : ""}
          </span>
        )}
        <p className="ml-auto text-sm text-[#6a6a6a]">{listings.length} logement{listings.length > 1 ? "s" : ""}</p>
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <div className="overflow-y-auto px-4 py-6 md:px-8">
          <AdSlot placement="explorer" compact />
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-2">
            {listings.map((listing) => (
              <PropertyCard
                key={listing.id}
                listing={listing}
                active={listing.id === active}
                onHover={setHovered}
                stayNights={stayNights}
              />
            ))}
          </div>
          {listings.length === 0 && (
            <p className="py-20 text-center text-[#6a6a6a]">Aucun bien ne correspond. Élargissez la destination ou le prix.</p>
          )}
        </div>
        <div
          className={
            showMap
              ? "fixed inset-0 z-[1300] h-full bg-white lg:relative lg:inset-auto lg:z-0 lg:h-full lg:bg-transparent"
              : "relative hidden h-full lg:block"
          }
        >
          <MapView
            listings={listings}
            activeId={active}
            hoveredId={hovered}
            onSelect={(id) => setActive(id)}
          />
          {activeListing && (
            <div className="absolute bottom-4 left-4 right-4 z-[500] max-w-sm">
              <div className="rounded-2xl bg-white p-2 shadow-[0_8px_28px_rgba(0,0,0,0.18)]">
                <PropertyCard listing={activeListing} stayNights={stayNights} />
              </div>
            </div>
          )}
          {showMap && (
            <button className="absolute right-4 top-4 z-[1400] rounded-full bg-white px-4 py-2 text-sm font-medium shadow lg:hidden" onClick={() => setShowMap(false)}>
              Fermer la carte
            </button>
          )}
        </div>
      </div>
      {!showMap && (
        <button
          className="fixed bottom-[5.15rem] left-1/2 z-[400] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#222] px-5 py-3 text-sm font-medium text-white shadow-lg lg:hidden"
          onClick={() => setShowMap(true)}
        >
          <Map className="h-4 w-4" />
          Carte
        </button>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-[#6a6a6a]">Ouverture de la carte…</div>}>
      <Explorer />
    </Suspense>
  );
}
