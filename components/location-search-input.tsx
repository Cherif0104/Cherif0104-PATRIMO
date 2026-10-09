"use client";

import { useEffect, useId, useState } from "react";
import { LoaderCircle, MapPin } from "lucide-react";
import type { AddressResult } from "@/components/address-autocomplete";

export function LocationSearchInput({
  value,
  onChange,
  onSelect,
  placeholder = "Appartement à Dakar, villa à Saly…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: AddressResult) => void;
  placeholder?: string;
  className?: string;
}) {
  const listId = useId();
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/geocode?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) return { results: [] };
          return response.json() as Promise<{ results?: AddressResult[] }>;
        })
        .then((payload) => {
          setResults(payload.results ?? []);
          setOpen(true);
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, 280);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  return (
    <div className="relative min-w-0 flex-1">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        className={className}
      />
      {loading && <LoaderCircle className="absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#FF4845]" />}
      {open && (
        <ul id={listId} role="listbox" className="absolute left-0 top-[calc(100%+12px)] z-[1300] max-h-72 w-[min(430px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-[#dddddd] bg-white p-2 text-[#182A39] shadow-[0_14px_36px_rgba(24,42,57,.18)]">
          {results.map((result) => (
            <li key={`${result.lat}-${result.lng}`}>
              <button
                type="button"
                className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#FFF8ED]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(result.label);
                  onSelect?.(result);
                  setOpen(false);
                }}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4845]" />
                <span>
                  <span className="block text-sm font-semibold">{result.label}</span>
                  <span className="mt-0.5 block text-xs text-[#6a6a6a]">{result.neighborhood} · {result.city}</span>
                </span>
              </button>
            </li>
          ))}
          {!loading && results.length === 0 && (
            <li className="px-3 py-3 text-sm text-[#6a6a6a]">Aucun lieu cartographique trouvé. La recherche textuelle reste possible.</li>
          )}
        </ul>
      )}
    </div>
  );
}
