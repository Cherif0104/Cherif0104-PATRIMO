"use client";

import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { cx, formatMoney } from "@/lib/format";
import { useAmeena } from "@/lib/store";
import type { Listing } from "@/lib/types";
import { MediaCarousel } from "./media-carousel";

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
  const saved = state.saved.includes(listing.id);
  const badges = [
    listing.rating >= 4.95 ? "Coup de cœur" : null,
    listing.mode === "location" ? "Location" : null,
    listing.managedByPlatform ? "Géré par Ameena" : null,
  ].filter((item): item is string => Boolean(item)).slice(0, 2);

  return (
    <article
      className={cx("group", active && "rounded-[24px] ring-2 ring-[#222] ring-offset-4")}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="relative">
        <MediaCarousel
          images={listing.images}
          alt={listing.title}
          href={`/logements/${listing.id}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
        />
        {badges.length > 0 && (
          <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[70%] flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span key={badge} className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium shadow-sm">
                {badge}
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          aria-label={saved ? "Retirer des favoris" : "Enregistrer"}
          className="absolute right-3 top-3 z-20 grid h-8 w-8 place-items-center"
          onClick={() => dispatch({ type: "toggle-save", id: listing.id })}
        >
          <Heart className={cx("h-[26px] w-[26px] drop-shadow", saved ? "fill-[#c13515] text-[#c13515]" : "fill-black/40 text-white")} />
        </button>
      </div>
      <Link href={`/logements/${listing.id}`} className="mt-3 block">
        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-1 text-[15px] font-semibold">
            {listing.neighborhood}, {listing.city}
          </h2>
          <p className="flex shrink-0 items-center gap-1 text-sm">
            <Star className="h-3.5 w-3.5 fill-current" />
            {listing.rating.toFixed(2).replace(".", ",")}
          </p>
        </div>
        <p className="mt-0.5 line-clamp-1 text-[15px] text-[#6a6a6a]">{listing.title}</p>
        <p className="mt-0.5 text-[15px] text-[#6a6a6a]">
          {listing.mode === "sejour" ? `${listing.guests} voyageurs` : `${listing.surface} m² · longue durée`}
        </p>
        <p className="mt-1.5 text-[15px]">
          <span className="font-semibold">{formatMoney(listing.price, listing.currency)}</span>
          <span> {listing.mode === "sejour" ? "par nuit" : "par mois"}</span>
        </p>
      </Link>
    </article>
  );
}
