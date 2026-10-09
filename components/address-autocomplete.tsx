"use client";

import { useEffect, useId, useState } from "react";
import { LoaderCircle, MapPin, Search } from "lucide-react";
import { fieldClass } from "@/lib/format";

export type AddressResult = {
  label: string;
  city: string;
  neighborhood: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
};

export function AddressAutocomplete({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (result: AddressResult) => void;
}) {
  const listId = useId();
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    if (query.trim().length < 3 || query === value) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((payload: { results?: AddressResult[] }) => {
          setResults(payload.results ?? []);
          setOpen(true);
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, 320);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, value]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a6a6a]" />
        <input
          className={`${fieldClass} pl-11 pr-11`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Adresse, quartier, pharmacie, monument…"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
        />
        {loading && <LoaderCircle className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#FF385C]" />}
      </div>
      {open && results.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-[1200] mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-[#dddddd] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,.16)]">
          {results.map((result) => (
            <li key={`${result.lat}-${result.lng}`}>
              <button
                type="button"
                className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#f7f7f7]"
                onClick={() => {
                  setQuery(result.label);
                  setOpen(false);
                  onSelect(result);
                }}
              >
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#FF385C]" />
                <span>
                  <span className="block text-sm font-medium">{result.label}</span>
                  <span className="mt-0.5 block text-xs text-[#6a6a6a]">{result.neighborhood} · {result.city}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
