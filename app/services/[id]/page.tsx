"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { OfferDetail } from "@/components/offer-detail";
import { btnSecondary } from "@/lib/format";
import { serviceById } from "@/lib/catalog";
import { useTitle } from "@/lib/use-title";

export default function ServicePage() {
  const { id } = useParams<{ id: string }>();
  const offer = serviceById(id);
  useTitle(offer ? `${offer.title} · Ameena` : "Service · Ameena");

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
