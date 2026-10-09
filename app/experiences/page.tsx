"use client";

import { useState } from "react";
import { DiscoveryHeader } from "@/components/discovery-header";
import { OfferCard } from "@/components/offer-card";
import { cx } from "@/lib/format";
import { EXPERIENCES } from "@/lib/catalog";
import { usePreferences } from "@/lib/preferences";
import { useTitle } from "@/lib/use-title";

const cities = ["Toutes", ...Array.from(new Set(EXPERIENCES.map((item) => item.city)))];

export default function ExperiencesPage() {
  const [city, setCity] = useState("Toutes");
  const { t } = usePreferences();
  useTitle("Expériences · Se Loger au Sénégal");
  const items = EXPERIENCES.filter((item) => city === "Toutes" || item.city === city);

  return (
    <div className="app-surface mobile-page">
      <DiscoveryHeader active="experiences" />
      <div className="section-champagne px-4 py-8 md:px-10 xl:px-16">
      <h1 className="premium-title text-[28px] md:text-[32px]">{t("experiences")}</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#6a6a6a]">
        Sorties courtes avec des gens du quartier : pirogue, table, marché, lagune. Même logique que les logements, prix affiché avant la demande.
      </p>
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {cities.map((item) => (
          <button
            key={item}
            onClick={() => setCity(item)}
            className={cx(
              "shrink-0 rounded-full border px-4 py-2 text-sm",
              city === item ? "border-[#FF385C] bg-[#FF385C] text-[#000000]" : "theme-border app-card border-[#dddddd]",
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 min-[550px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
      </div>
    </div>
  );
}
