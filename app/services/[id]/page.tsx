"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { OfferDetail } from "@/components/offer-detail";
import { btnSecondary } from "@/lib/format";
import { useTitle } from "@/lib/use-title";
import { usePublishedOffers } from "@/lib/use-offers";

export default function ServicePage() {
  const { id } = useParams<{ id: string }>();
  const { offers, loading } = usePublishedOffers("service");
  const offer = offers.find((item) => item.id === id);
  useTitle(offer ? `${offer.title} · Se Loger au Sénégal` : "Service · Se Loger au Sénégal");

  if (loading) return <p className="px-6 py-24 text-center text-sm text-[#6a6a6a]">Chargement du service…</p>;
  if (!offer) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">Ce service n&apos;est plus proposé</h1>
        <Link href="/services" className={`${btnSecondary} mt-6`}>
          Voir les services
        </Link>
      </div>
    );
  }

  return <OfferDetail offer={offer} />;
}
