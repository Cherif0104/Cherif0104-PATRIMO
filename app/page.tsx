"use client";

import Link from "next/link";
import { ArrowRight, CarFront, ChevronRight } from "lucide-react";
import { AdSlot } from "@/components/ad-slot";
import { DiscoveryHeader } from "@/components/discovery-header";
import { OfferCard } from "@/components/offer-card";
import { PropertyCard } from "@/components/property-card";
import { SearchBar } from "@/components/search-bar";
import { TrustStrip } from "@/components/trust-strip";
import { EXPERIENCES, SERVICES } from "@/lib/catalog";
import { useAmeena } from "@/lib/store";
import type { Listing } from "@/lib/types";

export default function HomePage() {
  const { state } = useAmeena();
  const listings = state.listings.filter(
    (listing) => !listing.publicationStatus || listing.publicationStatus === "published",
  );
  const shops = state.settings.ads.filter((ad) => ad.active && ad.placement === "boutique");
  const destinations = [...new Map(listings.map((listing) => [listing.city, listing])).values()].slice(0, 6);
  const cities = [...new Set(listings.map((listing) => listing.city))].slice(0, 4);

  return (
    <div className="mobile-page">
      <DiscoveryHeader />
      <section className="hidden px-4 pb-4 pt-8 md:px-10 lg:block xl:px-16">
        <SearchBar />
      </section>

      <div className="hidden lg:block"><TrustStrip /></div>

      <section className="px-4 pb-4 pt-5 md:px-10 lg:pt-9 xl:px-16">
        <h1 className="text-[22px] font-semibold tracking-[-0.025em] md:text-[28px]">Destinations pour vous</h1>
        <div className="no-scrollbar -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:px-0">
          {destinations.map((listing) => (
            <Link key={listing.city} href={`/explorer?q=${encodeURIComponent(listing.city)}`} className="w-[132px] shrink-0 md:w-[164px]">
              <div className="aspect-square overflow-hidden rounded-[20px] bg-[#eeeeee]">
                <img src={listing.images[0]} alt={listing.city} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
              </div>
              <p className="mt-2 text-[15px] font-semibold">{listing.city}</p>
              <p className="line-clamp-2 text-[13px] leading-[18px] text-[#6a6a6a]">
                {listing.amenities.includes("Vue mer") ? "Près de la plage" : listing.country}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div id="logements">
        {cities.map((city, index) => (
          <ListingRail
            key={city}
            title={index === 0 ? `Logements populaires · ${city}` : index === 1 ? `Disponibles ce week-end · ${city}` : `Logements · ${city}`}
            listings={listings.filter((listing) => listing.city === city)}
          />
        ))}
      </div>

      <div className="mx-4 my-8 md:mx-10 xl:mx-16">
        <AdSlot placement="accueil-bandeau" />
      </div>

      <section className="px-4 py-7 md:px-10 xl:px-16">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-[22px] font-semibold tracking-[-0.025em] md:text-2xl">Expériences ce week-end</h2>
          <Link href="/experiences" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f2f2f2]" aria-label="Voir les expériences">
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
        <div className="mobile-rail -mx-4 px-4 pb-2 md:mx-0 md:px-0">
          {EXPERIENCES.map((offer) => (
            <div key={offer.id}>
              <OfferCard offer={offer} />
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-7 md:px-10 xl:px-16">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-[22px] font-semibold tracking-[-0.025em] md:text-2xl">Services pour votre séjour</h2>
          <Link href="/services" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f2f2f2]" aria-label="Voir les services">
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
        <Link href="/services#mobilite" className="mb-5 flex items-center gap-4 rounded-[24px] border border-[#e5e5e5] bg-white p-5 shadow-[0_6px_20px_rgba(0,0,0,.08)]">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#fff0f5] text-[#E21D5A]">
            <CarFront className="h-8 w-8" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-semibold">Taxi, transfert aéroport et location</span>
            <span className="mt-1 block text-sm text-[#6a6a6a]">AIBD, Dakar, Petite Côte · chauffeurs vérifiés</span>
          </span>
          <ArrowRight className="ml-auto h-5 w-5 shrink-0" />
        </Link>
        <div className="mobile-rail -mx-4 px-4 pb-2 md:mx-0 md:px-0">
          {SERVICES.map((offer) => (
            <div key={offer.id}>
              <OfferCard offer={offer} />
            </div>
          ))}
        </div>
      </section>

      {shops.length > 0 && (
        <section className="px-4 pb-16 md:px-10 xl:px-16">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Boutiques partenaires</h2>
            <Link href="/boutiques" className="text-sm font-medium underline">
              Tout voir
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {shops.map((shop) => (
              <Link key={shop.id} href="/boutiques" className="overflow-hidden rounded-3xl border border-[#ebebeb]">
                <div className="relative h-44">
                  <img src={shop.image} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <p className="text-xs text-[#6a6a6a]">{shop.partner}</p>
                  <p className="mt-1 font-semibold">{shop.title}</p>
                  {shop.offer && <p className="mt-2 text-sm">{shop.offer}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ListingRail({ title, listings }: { title: string; listings: Listing[] }) {
  if (listings.length === 0) return null;
  return (
    <section className="px-4 py-7 md:px-10 xl:px-16">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-[22px] font-semibold tracking-[-0.025em] md:text-2xl">{title}</h2>
        <Link
          href={`/explorer?q=${encodeURIComponent(listings[0].city)}`}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f2f2f2]"
          aria-label={`Voir les logements à ${listings[0].city}`}
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>
      <div className="mobile-rail -mx-4 px-4 pb-2 md:mx-0 md:px-0 lg:grid lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible lg:px-0 xl:grid-cols-5">
        {listings.slice(0, 5).map((listing) => (
          <PropertyCard key={listing.id} listing={listing} stayNights={2} />
        ))}
      </div>
    </section>
  );
}
