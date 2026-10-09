"use client";

import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { cx, formatMoney } from "@/lib/format";
import { TYPE_LABEL } from "@/lib/labels";
import { useAmeena } from "@/lib/store";
import type { Listing } from "@/lib/types";
import { MediaCarousel } from "./media-carousel";

export function PropertyCard({
  listing,
  onHover,
  active = false,
  stayNights,
}: {
  listing: Listing;
  onHover?: (id: string | null) => void;
  active?: boolean;
  stayNights?: number;
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
      <Link href={`/logements/${listing.id}`} className="mt-2.5 block">
        <h2 className="line-clamp-2 min-h-[40px] text-[15px] font-semibold leading-5">
          {TYPE_LABEL[listing.type]} · {listing.neighborhood}
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-1 text-[14px] text-[#6a6a6a]">
          <span className="font-semibold">
            {formatMoney(
              listing.mode === "sejour" && stayNights && stayNights > 1
                ? listing.price * stayNights
                : listing.price,
              listing.currency,
            )}
          </span>
          <span>
            {listing.mode === "sejour" && stayNights && stayNights > 1
              ? ` pour ${stayNights} nuits`
              : listing.mode === "sejour"
                ? " par nuit"
                : " par mois"}
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-0.5 text-[#222]">
            <Star className="h-3 w-3 fill-current" />
            {listing.rating.toFixed(2).replace(".", ",")}
          </span>
        </p>
      </Link>
    </article>
  );
}
