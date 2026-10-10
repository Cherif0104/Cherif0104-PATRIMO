"use client";

import Link from "next/link";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { Photo } from "@/components/photo";
import type { Professional } from "@/lib/professionals";

export function ProfessionalCard({ professional }: { professional: Professional }) {
  const rating = professional.reviews.length
    ? professional.reviews.reduce((sum, review) => sum + review.rating, 0) / professional.reviews.length
    : null;

  return (
    <article className="overflow-hidden rounded-[24px] border border-[#ebebeb] bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/services/${professional.id}`} className="block">
        <div className="relative aspect-[4/3] bg-[#eeeeee]">
          <Photo src={professional.image} alt={professional.businessName} sizes="(max-width: 768px) 100vw, 33vw" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {professional.demonstration && (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold shadow-sm">Démonstration</span>
            )}
            {professional.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#16836f] shadow-sm">
                <BadgeCheck className="h-3.5 w-3.5" /> Vérifié
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#C13515]">{professional.categoryLabel}</p>
          <h2 className="mt-1 line-clamp-1 text-lg font-semibold">{professional.businessName}</h2>
          <p className="mt-2 flex items-center gap-1 text-sm text-[#6a6a6a]">
            <MapPin className="h-4 w-4" /> {professional.city} · rayon {professional.serviceRadiusKm} km
          </p>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6a6a6a]">{professional.description}</p>
          <div className="mt-4 flex items-center justify-between border-t border-[#eeeeee] pt-3 text-sm">
            <span className="font-semibold">{professional.services.length} prestation{professional.services.length > 1 ? "s" : ""}</span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-current" /> {rating ? rating.toFixed(1).replace(".", ",") : "Nouveau"}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
