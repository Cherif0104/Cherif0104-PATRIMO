"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgeCheck, Bath, BedDouble, MapPin, Ruler, Star, X } from "lucide-react";
import { AdSlot } from "@/components/ad-slot";
import { BookingCard } from "@/components/booking-card";
import { MapView } from "@/components/map";
import { Photo } from "@/components/photo";
import { btnSecondary, formatDate } from "@/lib/format";
import { hostById } from "@/lib/seed";
import { useAmeena } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import { TYPE_LABEL } from "@/lib/labels";

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useAmeena();
  const listing = state.listings.find((item) => item.id === id);
  const [lightbox, setLightbox] = useState<number | null>(null);
  useTitle(listing ? `${listing.title} · Ameena` : "Logement · Ameena");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLightbox(null);
      if (lightbox === null || !listing) return;
      if (event.key === "ArrowRight") setLightbox((value) => (value === null ? value : (value + 1) % listing.images.length));
      if (event.key === "ArrowLeft") {
        setLightbox((value) => (value === null ? value : (value - 1 + listing.images.length) % listing.images.length));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, listing]);

  if (!listing) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">Ce bien n&apos;est plus publié</h1>
        <Link href="/explorer" className={`${btnSecondary} mt-6`}>
          Retour à la carte
        </Link>
      </div>
    );
  }

  const host = hostById(listing.hostId);
  const images = listing.images.slice(0, 5);

  return (
    <article className="mx-auto max-w-[1120px] px-4 py-6 md:px-6">
      <Link href="/explorer" className="text-sm underline">
        Explorer
      </Link>
      <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[32px]">{listing.title}</h1>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1 font-medium">
          <Star className="h-4 w-4 fill-current" />
          {listing.rating.toFixed(2).replace(".", ",")}
        </span>
        <span className="text-[#6a6a6a]">{listing.reviewsCount} avis</span>
        <span className="inline-flex items-center gap-1 underline">
          <MapPin className="h-4 w-4" />
          {listing.neighborhood}, {listing.city}, {listing.country}
        </span>
      </p>

      <div className="relative mt-4 md:hidden">
        <div className="relative h-72 overflow-hidden rounded-2xl">
          <Photo src={images[0]} alt={listing.title} priority sizes="100vw" />
        </div>
      </div>
      <div className="mt-4 hidden h-[420px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:grid">
        {images.map((image, index) => (
          <button
            key={image}
            className={`relative ${index === 0 ? "col-span-2 row-span-2" : ""}`}
            onClick={() => setLightbox(index)}
          >
            <Photo src={image} alt="" priority={index === 0} sizes={index === 0 ? "50vw" : "25vw"} />
          </button>
        ))}
      </div>

      <div className="mt-8 grid items-start gap-12 lg:grid-cols-[minmax(0,1.4fr)_380px]">
        <div>
          <div className="flex items-start justify-between gap-4 border-b border-[#ebebeb] pb-6">
            <div>
              <p className="text-xl font-semibold">
                {TYPE_LABEL[listing.type]} {listing.mode === "sejour" ? "entier" : "à louer"} · proposé par {host?.name}
              </p>
              <p className="mt-1 text-sm text-[#6a6a6a]">
                {listing.guests} voyageurs · {listing.bedrooms} chambres · {listing.beds} lits · {listing.baths} salles d&apos;eau
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#1F6F66] text-sm font-semibold text-white">
              {host?.name.slice(0, 1)}
            </div>
          </div>

          <ul className="grid gap-4 border-b border-[#ebebeb] py-6 sm:grid-cols-3">
            <Fact icon={<BedDouble className="h-5 w-5" />} title={`${listing.bedrooms} chambres`} text={`${listing.surface} m²`} />
            <Fact icon={<Bath className="h-5 w-5" />} title={`${listing.baths} salles d'eau`} text="Comptées dans l'état des lieux" />
            <Fact icon={<Ruler className="h-5 w-5" />} title={listing.managedByPlatform ? "Géré par Ameena" : "En direct"} text={listing.managedByPlatform ? "Accueil, linge, incidents" : host?.kind === "agence" ? "Agence identifiée" : "Propriétaire identifié"} />
          </ul>

          <div className="border-b border-[#ebebeb] py-6">
            {listing.description.split("\n\n").map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="mt-3 text-[16px] leading-7 first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="border-b border-[#ebebeb] py-6">
            <h2 className="text-xl font-semibold">Ce que propose ce logement</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {listing.amenities.map((amenity) => (
                <li key={amenity} className="flex items-center gap-2 text-[15px]">
                  <BadgeCheck className="h-4 w-4 text-[#1F6F66]" />
                  {amenity}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-b border-[#ebebeb] py-6">
            <h2 className="text-xl font-semibold">Où se trouve le bien</h2>
            <p className="mt-1 text-sm text-[#6a6a6a]">{listing.neighborhood}, {listing.city}</p>
            <div className="mt-4 h-80 overflow-hidden rounded-2xl">
              <MapView listings={[listing]} activeId={listing.id} />
            </div>
          </div>

          <div className="py-6">
            <h2 className="text-xl font-semibold">Avis</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {listing.reviews.map((review) => (
                <figure key={review.id} className="rounded-2xl bg-[#f7f7f7] p-4">
                  <figcaption className="text-sm font-semibold">
                    {review.name} · <span className="font-normal text-[#6a6a6a]">{formatDate(review.date)}</span>
                  </figcaption>
                  <blockquote className="mt-2 text-sm leading-6">{review.text}</blockquote>
                </figure>
              ))}
            </div>
          </div>
          <AdSlot placement="fiche" />
        </div>
        <BookingCard listing={listing} />
      </div>

      {lightbox !== null && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal>
          <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white" onClick={() => setLightbox(null)} aria-label="Fermer">
            <X />
          </button>
          <button className="absolute left-4 rounded-full bg-white px-3 py-2 text-sm" onClick={() => setLightbox((value) => (value === null ? 0 : (value - 1 + images.length) % images.length))}>
            Précédente
          </button>
          <div className="relative h-[80vh] w-full max-w-5xl">
            <Photo src={images[lightbox]} alt="" sizes="100vw" />
          </div>
          <button className="absolute right-16 rounded-full bg-white px-3 py-2 text-sm" onClick={() => setLightbox((value) => (value === null ? 0 : (value + 1) % images.length))}>
            Suivante
          </button>
        </div>
      )}
    </article>
  );
}

function Fact({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5">{icon}</span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-sm text-[#6a6a6a]">{text}</span>
      </span>
    </li>
  );
}
