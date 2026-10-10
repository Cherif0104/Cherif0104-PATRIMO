"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LocationSearchInput } from "@/components/location-search-input";
import { cx } from "@/lib/format";

const tabs = [
  { href: "/", label: "Tous", key: "all" },
  { href: "/explorer?categorie=appartement", label: "Appartements", key: "apartments" },
  { href: "/explorer?categorie=maison", label: "Maisons & villas", key: "houses" },
  { href: "/explorer?categorie=terrain", label: "Terrains & champs", key: "land" },
  { href: "/explorer?marche=vente", label: "À vendre", key: "sale" },
  { href: "/explorer?categorie=longue-duree", label: "Longue durée", key: "long-term" },
  { href: "/explorer?categorie=premium", label: "Premium", key: "premium" },
] as const;

export function DiscoveryHeader({
  active = "all",
}: {
  active?: (typeof tabs)[number]["key"];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [type, setType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [verified, setVerified] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [standing, setStanding] = useState("");

  function search() {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (type) params.set("type", type);
    if (minPrice) params.set("prix_min", minPrice);
    if (maxPrice) params.set("prix_max", maxPrice);
    if (verified) params.set("certifie", "1");
    if (purpose) params.set("marche", purpose);
    if (standing) params.set("standing", standing);
    router.push(`/explorer?${params.toString()}`);
  }

  return (
    <div className="app-surface sticky top-0 z-40 px-4 pb-3 pt-4 lg:hidden">
      <BrandLogo compact className="mb-3" />
      <form
        className="app-card theme-border mx-auto flex h-[58px] max-w-md items-center gap-2 rounded-full border border-[#dddddd] py-1.5 pl-5 pr-1.5 shadow-[0_5px_18px_rgba(0,0,0,.14)]"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={2.4} />
        <LocationSearchInput
          value={query}
          onChange={setQuery}
          onSelect={(result) => {
            setQuery(result.label);
            const params = new URLSearchParams({ q: result.label });
            router.push(`/explorer?${params.toString()}`);
          }}
          placeholder="Appartement à Dakar…"
          className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-[#6a6a6a]"
        />
        <button
          type="button"
          onClick={() => setFiltersOpen((value) => !value)}
          className={cx(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full border",
            filtersOpen ? "border-[#FF4845] bg-[#FFF1EE] text-[#FF4845]" : "theme-border border-[#dddddd]",
          )}
          aria-label="Afficher les filtres"
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FF4845] text-white" aria-label="Rechercher">
          <Search className="h-4 w-4" />
        </button>
      </form>
      {filtersOpen && (
        <div className="theme-border app-card mx-auto mt-2 grid max-w-md grid-cols-2 gap-2 rounded-[22px] border border-[#ebebeb] p-3 shadow-lg">
          <select value={purpose} onChange={(event) => setPurpose(event.target.value)} className="rounded-xl border border-[#dddddd] bg-transparent px-3 py-2.5 text-sm">
            <option value="">Location et vente</option>
            <option value="location">Location</option>
            <option value="vente">Vente</option>
          </select>
          <select value={standing} onChange={(event) => setStanding(event.target.value)} className="rounded-xl border border-[#dddddd] bg-transparent px-3 py-2.5 text-sm">
            <option value="">Tous standings</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="luxe">Luxe</option>
            <option value="presidentiel">Présidentiel</option>
          </select>
          <select value={type} onChange={(event) => setType(event.target.value)} className="col-span-2 rounded-xl border border-[#dddddd] bg-transparent px-3 py-2.5 text-sm">
            <option value="">Tous les logements</option>
            <option value="appartement">Appartement</option>
            <option value="villa">Villa</option>
            <option value="maison">Maison</option>
            <option value="studio">Studio</option>
            <option value="duplex">Duplex</option>
            <option value="rooftop">Rooftop</option>
            <option value="hotel">Hôtel</option>
            <option value="terrain">Terrain</option>
          </select>
          <input value={minPrice} onChange={(event) => setMinPrice(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Budget min." className="rounded-xl border border-[#dddddd] bg-transparent px-3 py-2.5 text-sm" />
          <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Budget max." className="rounded-xl border border-[#dddddd] bg-transparent px-3 py-2.5 text-sm" />
          <label className="col-span-2 flex items-center gap-2 px-1 py-1 text-sm font-medium">
            <input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} className="accent-[#FF4845]" />
            Annonces certifiées uniquement
          </label>
        </div>
      )}
      <nav className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4" aria-label="Découvrir">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={cx(
              "shrink-0 rounded-full border px-5 py-2.5 text-[15px] shadow-sm",
              active === tab.key
                ? "border-[#FF385C] bg-[#fff1f3] font-semibold text-[#000000]"
                : "theme-border app-card border-[#e6e6e6]",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
