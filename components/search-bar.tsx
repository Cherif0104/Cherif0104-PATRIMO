"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { addDaysISO } from "@/lib/format";
import { useAmeena } from "@/lib/store";
import type { Mode } from "@/lib/types";

export function SearchBar({ initialMode = "sejour" }: { initialMode?: Mode }) {
  const router = useRouter();
  const { state } = useAmeena();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [guests, setGuests] = useState(1);
  const [from, setFrom] = useState(addDaysISO(5));
  const [to, setTo] = useState(addDaysISO(8));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [type, setType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [verified, setVerified] = useState(false);

  const cities = useMemo(() => {
    const set = new Map<string, string>();
    state.listings.forEach((listing) => {
      set.set(listing.city, listing.country);
    });
    return [...set.entries()];
  }, [state.listings]);

  const matches = cities.filter(([city]) => city.toLowerCase().includes(query.toLowerCase().trim()));

  function go(city?: string) {
    const params = new URLSearchParams();
    params.set("mode", mode);
    const destination = city ?? query.trim();
    if (destination) params.set("q", destination);
    if (guests > 1) params.set("voyageurs", String(guests));
    if (from) params.set("arrivee", from);
    if (mode === "sejour" && to) params.set("depart", to);
    if (type) params.set("type", type);
    if (minPrice) params.set("prix_min", minPrice);
    if (maxPrice) params.set("prix_max", maxPrice);
    if (bedrooms) params.set("chambres", bedrooms);
    if (verified) params.set("certifie", "1");
    router.push(`/explorer?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div>
      <div className="mb-4 flex justify-center">
        <div className="grid grid-cols-2 rounded-full bg-[#f2f2f2] p-1 text-sm">
          {(["sejour", "location"] as Mode[]).map((item) => (
            <button
              key={item}
              className={`rounded-full px-5 py-2 font-medium ${mode === item ? "bg-white shadow-sm" : "text-[#6a6a6a]"}`}
              onClick={() => setMode(item)}
            >
              {item === "sejour" ? "Séjours" : "Locations"}
            </button>
          ))}
        </div>
      </div>
      <form
        className="search-pill mx-auto flex max-w-4xl flex-wrap items-center rounded-[24px] p-1 sm:flex-nowrap sm:rounded-full sm:p-0"
        onSubmit={(event) => {
          event.preventDefault();
          go();
        }}
      >
        <label className="relative min-w-0 basis-full px-5 py-3 text-left sm:basis-auto">
          <span className="block text-xs font-semibold">Destination</span>
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-[#8a8a8a]"
            placeholder="Appartement à Dakar, villa à Saly…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
          {open && (
            <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-20 overflow-hidden rounded-3xl border border-[#ebebeb] bg-white py-2 text-left shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
              {(query.trim() ? matches : cities).map(([city, country]) => (
                <button
                  type="button"
                  key={city}
                  className="block w-full px-5 py-3 text-left hover:bg-[#f7f7f7]"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setQuery(city);
                    go(city);
                  }}
                >
                  <span className="block text-sm font-medium">{city}</span>
                  <span className="block text-xs text-[#6a6a6a]">{country}</span>
                </button>
              ))}
              {query.trim() && matches.length === 0 && (
                <p className="px-5 py-3 text-sm text-[#6a6a6a]">Chercher « {query} » quand même.</p>
              )}
            </div>
          )}
        </label>
        <div className="hidden h-8 w-px bg-[#dddddd] sm:block" />
        <label className="min-w-0 flex-1 border-t border-[#eeeeee] px-4 py-2.5 sm:border-t-0 sm:px-4 sm:py-3">
          <span className="block text-[11px] font-semibold">{mode === "sejour" ? "Arrivée" : "Emménagement"}</span>
          <input
            className="w-full bg-transparent text-xs outline-none sm:text-sm"
            type="date"
            value={from}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => {
              setFrom(event.target.value);
              if (mode === "sejour" && event.target.value >= to) setTo(addDaysISO(3, event.target.value));
            }}
          />
        </label>
        {mode === "sejour" && (
          <>
            <div className="hidden h-8 w-px bg-[#dddddd] sm:block" />
            <label className="min-w-0 flex-1 border-t border-[#eeeeee] px-4 py-2.5 sm:border-t-0 sm:px-4 sm:py-3">
              <span className="block text-[11px] font-semibold">Départ</span>
              <input
                className="w-full bg-transparent text-xs outline-none sm:text-sm"
                type="date"
                value={to}
                min={from || new Date().toISOString().slice(0, 10)}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
          </>
        )}
        <div className="hidden h-8 w-px bg-[#dddddd] sm:block" />
        <label className="min-w-[90px] border-t border-[#eeeeee] px-4 py-2.5 sm:border-t-0 sm:px-4 sm:py-3">
          <span className="block text-xs font-semibold">Voyageurs</span>
          <input
            className="w-14 bg-transparent text-sm outline-none"
            type="number"
            min={1}
            max={16}
            value={guests}
            onChange={(event) => setGuests(Number(event.target.value))}
          />
        </label>
        <button
          type="button"
          onClick={() => setFiltersOpen((value) => !value)}
          className={`ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-full border ${filtersOpen ? "border-[#FF4845] bg-[#FFF1EE] text-[#FF4845]" : "border-[#dddddd]"}`}
          aria-label="Filtres avancés"
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" />
        </button>
        <button
          className="ml-auto mr-1 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#FF4845] text-white sm:mr-2"
          aria-label="Rechercher"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>
      {filtersOpen && (
        <div className="theme-border app-card mx-auto mt-3 grid max-w-4xl grid-cols-2 gap-3 rounded-[24px] border border-[#ebebeb] p-4 shadow-[0_10px_30px_rgba(24,42,57,.1)] md:grid-cols-5">
          <label className="text-xs font-semibold">
            Type de bien
            <select value={type} onChange={(event) => setType(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#dddddd] bg-transparent px-3 py-2.5 text-sm font-normal">
              <option value="">Tous</option>
              <option value="appartement">Appartement</option>
              <option value="villa">Villa</option>
              <option value="maison">Maison</option>
              <option value="studio">Studio</option>
              <option value="ecolodge">Écolodge</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Budget minimum
            <input value={minPrice} onChange={(event) => setMinPrice(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="50 000 FCFA" className="mt-1.5 w-full rounded-xl border border-[#dddddd] bg-transparent px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-semibold">
            Budget maximum
            <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="250 000 FCFA" className="mt-1.5 w-full rounded-xl border border-[#dddddd] bg-transparent px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-semibold">
            Chambres minimum
            <select value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#dddddd] bg-transparent px-3 py-2.5 text-sm font-normal">
              <option value="">Indifférent</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </label>
          <label className="flex items-center gap-2 self-end rounded-xl bg-[#FFF8ED] px-3 py-3 text-sm font-semibold text-[#182A39]">
            <input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} className="accent-[#FF4845]" />
            Certifié
          </label>
        </div>
      )}
    </div>
  );
}
