"use client";

import Link from "next/link";
import { CarFront, ChevronRight, Plane, ShieldCheck } from "lucide-react";
import { DiscoveryHeader } from "@/components/discovery-header";
import { OfferCard } from "@/components/offer-card";
import { SERVICES } from "@/lib/catalog";
import { usePreferences } from "@/lib/preferences";
import { useTitle } from "@/lib/use-title";

export default function ServicesPage() {
  useTitle("Services · Se Loger au Sénégal");
  const { t } = usePreferences();
  const mobility = SERVICES.filter((service) =>
    ["chauffeur-aeroport", "taxi-aibd-saly", "van-aeroport", "location-voiture"].includes(service.id),
  );
  const stayServices = SERVICES.filter((service) => !mobility.includes(service));

  return (
    <div className="app-surface mobile-page">
      <DiscoveryHeader active="services" />
      <div className="px-4 pb-12 pt-4 md:px-10 lg:pt-10 xl:px-16">
        <section className="section-champagne theme-border mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-[#e7e7e7] p-6 shadow-[0_8px_24px_rgba(0,0,0,.08)] md:p-10">
          <div className="grid items-center gap-8 md:grid-cols-[1.2fr_.8fr]">
            <div>
              <span className="app-card gold-ring inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm">
                <ShieldCheck className="h-4 w-4 text-[#C13515]" /> {t("verifiedDrivers")}
              </span>
              <h1 className="premium-title mt-5 text-[30px] leading-[1.08] md:text-5xl">
                {t("arrivalTitle")}
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-6 text-[#6a6a6a] md:text-base">
                {t("arrivalText")}
              </p>
              <Link href="#mobilite" className="gold-cta mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
                {t("seeTransport")} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="app-card relative mx-auto grid h-52 w-full max-w-sm place-items-center rounded-[26px] shadow-[0_12px_32px_rgba(0,0,0,.09)]">
              <Plane className="absolute left-8 top-8 h-10 w-10 -rotate-12 text-[#C13515]" />
              <CarFront className="h-24 w-24 text-[#222]" strokeWidth={1.25} />
              <span className="absolute bottom-6 rounded-full bg-[#f2f2f2] px-4 py-2 text-sm font-semibold">AIBD → votre logement</span>
            </div>
          </div>
        </section>

        <ServiceRail id="mobilite" title={t("transportTitle")} offers={mobility} />
        <ServiceRail title={t("duringStay")} offers={stayServices} />
      </div>
    </div>
  );
}

function ServiceRail({ title, offers, id }: { title: string; offers: typeof SERVICES; id?: string }) {
  return (
    <section id={id} className="pt-10">
      <h2 className="premium-title text-[24px] md:text-[30px]">{title}</h2>
      <div className="mobile-rail -mx-4 mt-5 px-4 pb-2 md:mx-0 md:px-0 lg:grid lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
      </div>
    </section>
  );
}
