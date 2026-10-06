"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAmeena } from "@/lib/store";
import type { Mode } from "@/lib/types";

export function SearchBar({ initialMode = "sejour" }: { initialMode?: Mode }) {
  const router = useRouter();
  const { state } = useAmeena();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [guests, setGuests] = useState(1);

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
        className="search-pill mx-auto flex max-w-3xl items-center rounded-full"
        onSubmit={(event) => {
          event.preventDefault();
          go();
        }}
      >
        <label className="relative min-w-0 flex-1 px-6 py-3 text-left">
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
        <label className="hidden px-5 py-3 sm:block">
          <span className="block text-xs font-semibold">Voyageurs</span>
          <input
            className="w-16 bg-transparent text-sm outline-none"
            type="number"
            min={1}
            max={16}
            value={guests}
            onChange={(event) => setGuests(Number(event.target.value))}
          />
        </label>
        <button
          className="mr-2 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1F6F66] text-white"
          aria-label="Rechercher"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
