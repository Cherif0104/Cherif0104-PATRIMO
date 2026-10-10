"use client";

import Link from "next/link";
import { Building2, ChevronRight, Home, KeyRound } from "lucide-react";
import { DiscoveryHeader } from "@/components/discovery-header";
import { PropertyCard } from "@/components/property-card";
import { SearchBar } from "@/components/search-bar";
import { TrustStrip } from "@/components/trust-strip";
import { usePreferences } from "@/lib/preferences";
import { useAmeena } from "@/lib/store";
import type { Listing } from "@/lib/types";

export default function HomePage() {
  const { state } = useAmeena();
  const { t } = usePreferences();
  const listings = state.listings.filter(
    (listing) => !listing.publicationStatus || listing.publicationStatus === "published",
  );
  const destinations = [...new Map(listings.map((listing) => [listing.city, listing])).values()].slice(0, 6);
  const cities = [...new Set(listings.map((listing) => listing.city))].slice(0, 4);

  return (
    <div className="app-surface mobile-page">
      <DiscoveryHeader />
      <section className="hidden px-4 pb-4 pt-8 md:px-10 lg:block xl:px-16">
        <SearchBar />
      </section>

      <div className="hidden lg:block"><TrustStrip /></div>

      <section className="section-ivory px-4 pb-8 pt-5 md:px-10 lg:pt-9 xl:px-16">
        <h1 className="premium-title text-[22px] md:text-[28px]">{t("destinations")}</h1>
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
            title={index === 0 ? `${t("popular")} · ${city}` : index === 1 ? `${t("weekend")} · ${city}` : `${t("stays")} · ${city}`}
            listings={listings.filter((listing) => listing.city === city)}
            tone={index % 2 === 0 ? "section-pearl" : "section-ivory"}
          />
        ))}
      </div>
      {listings.length === 0 && (
        <section className="px-4 py-12 text-center md:px-10 xl:px-16">
          <h2 className="text-2xl font-semibold">Les premières annonces vérifiées arrivent</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[#6a6a6a]">Le catalogue public affiche uniquement les biens validés par l’équipe.</p>
          <Link href="/compte" className="mt-5 inline-block font-semibold underline">Proposer un bien</Link>
        </section>
      )}

      <section className="section-champagne px-4 py-10 md:px-10 xl:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[.14em] text-[#C13515]">Votre projet immobilier</p>
          <h2 className="premium-title mt-2 text-[26px] md:text-3xl">Une plateforme, trois parcours clairs.</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <ProjectLink href="/explorer" icon={<Home />} title="Trouver un logement" text="Séjour, location longue durée ou achat." />
            <ProjectLink href="/publier" icon={<KeyRound />} title="Valoriser mon bien" text="Publiez un bien unique après vérification." />
            <ProjectLink href="/agences" icon={<Building2 />} title="Gérer un parc immobilier" text="ERP/CRM multi-agents ouvert par notre équipe." />
          </div>
        </div>
      </section>
    </div>
  );
}

function ProjectLink({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="rounded-[22px] border border-[#eadfcb] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF1EE] text-[#C13515]">{icon}</span>
      <span className="mt-4 block font-semibold">{title}</span>
      <span className="mt-1 block text-sm leading-6 text-[#6a6a6a]">{text}</span>
    </Link>
  );
}

function ListingRail({ title, listings, tone }: { title: string; listings: Listing[]; tone: string }) {
  if (listings.length === 0) return null;
  return (
    <section className={`${tone} px-4 py-9 md:px-10 xl:px-16`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="premium-title text-[22px] md:text-2xl">{title}</h2>
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
