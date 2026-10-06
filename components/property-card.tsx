"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import { Photo } from "./photo";
import { cx, formatMoney } from "@/lib/format";
import { useAmeena } from "@/lib/store";
import type { Listing } from "@/lib/types";

export function PropertyCard({
  listing,
  onHover,
  active = false,
}: {
  listing: Listing;
  onHover?: (id: string | null) => void;
  active?: boolean;
}) {
  const { state, dispatch } = useAmeena();
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const saved = state.saved.includes(listing.id);
  const photo = listing.images[index] ?? listing.images[0];

  function step(delta: number, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIndex((current) => (current + delta + listing.images.length) % listing.images.length);
  }

  return (
    <article
      className={cx("group", active && "rounded-2xl ring-2 ring-[#222] ring-offset-4")}
      onMouseEnter={() => {
        setHover(true);
        onHover?.(listing.id);
      }}
      onMouseLeave={() => {
        setHover(false);
        onHover?.(null);
      }}
    >
      <Link href={`/logements/${listing.id}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f2f2f2]">
          {photo && <Photo src={photo} alt={listing.title} sizes="(max-width: 768px) 100vw, 25vw" />}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {listing.mode === "location" && (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium shadow-sm">Location</span>
            )}
            {listing.managedByPlatform && (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium shadow-sm">Géré par Ameena</span>
            )}
          </div>
          <button
            aria-label={saved ? "Retirer des favoris" : "Enregistrer"}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              dispatch({ type: "toggle-save", id: listing.id });
            }}
          >
            <Heart className={cx("h-6 w-6 drop-shadow", saved ? "fill-[#c13515] text-[#c13515]" : "fill-black/30 text-white")} />
          </button>
          {hover && listing.images.length > 1 && (
            <>
              <button
                aria-label="Photo précédente"
                className="absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white shadow"
                onClick={(event) => step(-1, event)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                aria-label="Photo suivante"
                className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white shadow"
                onClick={(event) => step(1, event)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
            {listing.images.slice(0, 5).map((image, dot) => (
              <span
                key={image}
                className={cx("h-1.5 w-1.5 rounded-full", dot === index ? "bg-white" : "bg-white/60")}
              />
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <h2 className="line-clamp-1 text-[15px] font-semibold">{listing.neighborhood}, {listing.city}</h2>
          <p className="flex shrink-0 items-center gap-1 text-sm">
            <Star className="h-3.5 w-3.5 fill-current" />
            {listing.rating.toFixed(2).replace(".", ",")}
          </p>
        </div>
        <p className="mt-0.5 line-clamp-1 text-[15px] text-[#6a6a6a]">{listing.title}</p>
        <p className="mt-1 text-[15px]">
          <span className="font-semibold">{formatMoney(listing.price, listing.currency)}</span>
          <span> {listing.mode === "sejour" ? "par nuit" : "par mois"}</span>
        </p>
      </Link>
    </article>
  );
}
