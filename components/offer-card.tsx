"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { Offer } from "@/lib/catalog";
import { MediaCarousel } from "./media-carousel";

export function offerHref(offer: Offer) {
  return offer.kind === "experience" ? `/experiences/${offer.id}` : `/services/${offer.id}`;
}

export function OfferCard({ offer }: { offer: Offer }) {
  const href = offerHref(offer);
  return (
    <article>
      <MediaCarousel images={offer.images} alt={offer.title} href={href} sizes="(max-width: 768px) 80vw, 320px" />
      <Link href={href} className="mt-3 block">
        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-1 text-[15px] font-semibold">{offer.title}</h2>
          <p className="flex shrink-0 items-center gap-1 text-sm">
            <Star className="h-3.5 w-3.5 fill-current" />
            {offer.rating.toFixed(2).replace(".", ",")}
          </p>
        </div>
        <p className="mt-0.5 line-clamp-1 text-[15px] text-[#6a6a6a]">
          {offer.neighborhood}, {offer.city}
        </p>
        <p className="line-clamp-1 text-[15px] text-[#6a6a6a]">{offer.duration}</p>
        <p className="mt-1.5 text-[15px]">
          <span className="font-semibold">{formatMoney(offer.price, offer.currency)}</span>
          <span> {offer.unit}</span>
        </p>
      </Link>
    </article>
  );
}
