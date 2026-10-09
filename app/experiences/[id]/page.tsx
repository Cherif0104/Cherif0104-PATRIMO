"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { OfferDetail } from "@/components/offer-detail";
import { btnSecondary } from "@/lib/format";
import { useTitle } from "@/lib/use-title";
import { usePublishedOffers } from "@/lib/use-offers";

export default function ExperiencePage() {
  const { id } = useParams<{ id: string }>();
  const { offers, loading } = usePublishedOffers("experience");
  const offer = offers.find((item) => item.id === id);
  useTitle(offer ? `${offer.title} · Se Loger au Sénégal` : "Expérience · Se Loger au Sénégal");

  if (loading) return <p className="px-6 py-24 text-center text-sm text-[#6a6a6a]">Chargement de l’expérience…</p>;
  if (!offer) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">Cette expérience n&apos;est plus proposée</h1>
        <Link href="/experiences" className={`${btnSecondary} mt-6`}>
          Voir les expériences
        </Link>
      </div>
    );
  }

  return <OfferDetail offer={offer} />;
}
