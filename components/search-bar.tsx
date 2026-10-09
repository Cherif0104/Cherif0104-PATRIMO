"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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
            placeholder="Dakar, Saly, Paris…"
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
          className="ml-auto mr-1 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#E21D5A] text-white sm:mr-2"
          aria-label="Rechercher"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
