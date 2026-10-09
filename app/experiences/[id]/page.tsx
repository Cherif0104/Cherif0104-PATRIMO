"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { OfferDetail } from "@/components/offer-detail";
import { btnSecondary } from "@/lib/format";
import { experienceById } from "@/lib/catalog";
import { useTitle } from "@/lib/use-title";

export default function ExperiencePage() {
  const { id } = useParams<{ id: string }>();
  const offer = experienceById(id);
  useTitle(offer ? `${offer.title} · Se Loger au Sénégal` : "Expérience · Se Loger au Sénégal");

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
