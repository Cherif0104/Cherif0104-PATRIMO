"use client";

import Link from "next/link";
import { PageHead } from "@/components/ui";
import { useAmeena } from "@/lib/store";
import { useTitle } from "@/lib/use-title";

export default function BoutiquesPage() {
  const { state } = useAmeena();
  const shops = state.settings.ads.filter((ad) => ad.active && (ad.placement === "boutique" || ad.offer));
  useTitle("Boutiques · Ameena");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <PageHead
        eyebrow="Partenaires"
        title="Boutiques"
        text="Assurances, artisans, linge, paiement. Ces offres se posent depuis l'administration, au même titre que les bandeaux publicitaires."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {shops.map((shop) => {
          const card = (
            <article className="overflow-hidden rounded-3xl border border-[#ebebeb] bg-white">
              <div className="relative h-52">
                <img src={shop.image} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-[#6a6a6a]">{shop.partner}</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">{shop.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#6a6a6a]">{shop.subtitle}</p>
                {shop.offer && <p className="mt-4 text-sm font-medium">{shop.offer}</p>}
              </div>
            </article>
          );
          return shop.href.startsWith("/") ? (
            <Link key={shop.id} href={shop.href}>{card}</Link>
          ) : (
            <a key={shop.id} href={shop.href} target="_blank" rel="noreferrer">{card}</a>
          );
        })}
      </div>
      {shops.length === 0 && <p className="text-[#6a6a6a]">Aucune boutique active. Ajoutez-en une dans les réglages.</p>}
    </div>
  );
}
