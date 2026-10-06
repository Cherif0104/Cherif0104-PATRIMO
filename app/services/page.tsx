"use client";

import { OfferCard } from "@/components/offer-card";
import { SERVICES } from "@/lib/catalog";
import { useTitle } from "@/lib/use-title";

export default function ServicesPage() {
  useTitle("Services · Ameena");

  return (
    <div className="px-4 py-8 md:px-10 xl:px-16">
      <h1 className="text-[28px] font-semibold tracking-tight md:text-[32px]">Services</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#6a6a6a]">
        Ménage, accueil, chef, linge, photos, trajet aéroport. Des services pour le séjour et pour le propriétaire qui n&apos;est pas sur place.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 min-[550px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SERVICES.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}
