"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Map, SlidersHorizontal } from "lucide-react";
import { AdSlot } from "@/components/ad-slot";
import { MapView } from "@/components/map";
import { PropertyCard } from "@/components/property-card";
import { LocationSearchInput } from "@/components/location-search-input";
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
    const terms = q.split(/\s+/).filter((term) => term.length > 1 && !["à", "au", "aux", "un", "une", "de"].includes(term));
    if (!terms.every((term) => blob.includes(term))) return false;
  }
  if (mode === "sejour" || mode === "location") {
    if (listing.mode !== mode) return false;
  }
  if (guests && listing.guests < guests) return false;
  if (managed && !listing.managedByPlatform) return false;
  if (params.get("certifie") === "1" && !listing.managedByPlatform) return false;
  if (params.get("type") && listing.type !== params.get("type")) return false;
  if (Number(params.get("chambres") ?? 0) > listing.bedrooms) return false;
  if (params.get("marche") && (listing.purpose ?? "location") !== params.get("marche")) return false;
  if (params.get("ameublement") && listing.furnishing !== params.get("ameublement")) return false;
  if (params.get("standing") && listing.standing !== params.get("standing")) return false;
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
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [minPrice, setMinPrice] = useState(params.get("prix_min") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("prix_max") ?? "");
  const [type, setType] = useState(params.get("type") ?? "");
  const [bedrooms, setBedrooms] = useState(params.get("chambres") ?? "");
  const [verifiedOnly, setVerifiedOnly] = useState(params.get("certifie") === "1");
  const [purpose, setPurpose] = useState(params.get("marche") ?? "");
  const [furnishing, setFurnishing] = useState(params.get("ameublement") ?? "");
  const [standing, setStanding] = useState(params.get("standing") ?? "");
  const [managedOnly, setManagedOnly] = useState(params.get("gere") === "1");
  const [mode, setMode] = useState(params.get("mode") ?? "");
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  useTitle("Explorer · Se Loger au Sénégal");

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
    if (query.trim()) next.set("q", query.trim());
    else next.delete("q");
    if (type) next.set("type", type);
    else next.delete("type");
    if (bedrooms) next.set("chambres", bedrooms);
    else next.delete("chambres");
    if (verifiedOnly) next.set("certifie", "1");
    else next.delete("certifie");
    if (purpose) next.set("marche", purpose);
    else next.delete("marche");
    if (furnishing) next.set("ameublement", furnishing);
    else next.delete("ameublement");
    if (standing) next.set("standing", standing);
    else next.delete("standing");
    return state.listings.filter((listing) => {
      if (listing.publicationStatus && listing.publicationStatus !== "published") return false;
      if (listing.databaseId && blockedIds.includes(listing.databaseId)) return false;
      if (!match(listing, next)) return false;
      if (minPrice && listing.price < Number(minPrice)) return false;
      if (maxPrice && listing.price > Number(maxPrice)) return false;
      return true;
    });
  }, [state.listings, params, mode, managedOnly, query, type, bedrooms, verifiedOnly, purpose, furnishing, standing, minPrice, maxPrice, blockedIds]);

  const activeListing = listings.find((listing) => listing.id === active) ?? null;

  return (
    <div className="flex h-[calc(100dvh-5rem-4.25rem)] flex-col lg:h-[calc(100dvh-5rem)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#ebebeb] bg-[#FFFDF7] px-4 py-3 md:px-8">
        <SlidersHorizontal className="h-4 w-4 text-[#6a6a6a]" />
        <label className="relative min-w-[220px] flex-1 lg:max-w-sm">
          <span className="sr-only">Destination ou logement</span>
          <LocationSearchInput
            className={`${fieldClass} w-full pl-9`}
            value={query}
            onChange={setQuery}
            placeholder="Appartement à Dakar…"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">⌕</span>
        </label>
        <select className={`${fieldClass} w-auto`} value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="">Séjours et locations</option>
          <option value="sejour">Séjours</option>
          <option value="location">Locations</option>
        </select>
        <select className={`${fieldClass} w-auto`} value={purpose} onChange={(event) => setPurpose(event.target.value)}>
          <option value="">Location et vente</option>
          <option value="location">Location</option>
          <option value="vente">Vente</option>
        </select>
        <select className={`${fieldClass} w-auto`} value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">Tous les types</option>
          <option value="appartement">Appartement</option>
          <option value="villa">Villa</option>
          <option value="maison">Maison</option>
          <option value="studio">Studio</option>
          <option value="ecolodge">Écolodge</option>
          <option value="duplex">Duplex</option>
          <option value="rooftop">Rooftop</option>
          <option value="hotel">Hôtel</option>
          <option value="terrain">Terrain</option>
          <option value="bureau">Bureau</option>
        </select>
        <select className={`${fieldClass} w-auto`} value={furnishing} onChange={(event) => setFurnishing(event.target.value)}>
          <option value="">Ameublement</option>
          <option value="meuble">Meublé</option>
          <option value="semi_meuble">Semi-meublé</option>
          <option value="non_meuble">Non meublé</option>
        </select>
        <select className={`${fieldClass} w-auto`} value={standing} onChange={(event) => setStanding(event.target.value)}>
          <option value="">Standing</option>
          <option value="essentiel">Essentiel</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
          <option value="luxe">Luxe</option>
          <option value="presidentiel">Présidentiel</option>
        </select>
        <input
          className={`${fieldClass} w-32`}
          inputMode="numeric"
          placeholder="Prix min"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value.replace(/[^\d]/g, ""))}
        />
        <input
          className={`${fieldClass} w-36`}
          inputMode="numeric"
          placeholder="Prix max"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value.replace(/[^\d]/g, ""))}
        />
        <select className={`${fieldClass} w-auto`} value={bedrooms} onChange={(event) => setBedrooms(event.target.value)}>
          <option value="">Chambres</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} className="accent-[#FF4845]" />
          Certifié
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={managedOnly} onChange={(event) => setManagedOnly(event.target.checked)} />
          Géré par Se Loger au Sénégal
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
