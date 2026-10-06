"use client";

import Link from "next/link";
import { Photo } from "@/components/photo";
import { Empty, PageHead, Pill } from "@/components/ui";
import { btnSecondary, formatMoney } from "@/lib/format";
import { MODE_LABEL } from "@/lib/labels";
import { useScope } from "@/lib/store";
import { useTitle } from "@/lib/use-title";

export default function BiensPage() {
  const scope = useScope();
  useTitle("Biens · Ameena");

  return (
    <div>
      <PageHead
        title="Biens"
        text="Chaque fiche ouvre le dossier : public pour la marketplace, privé pour les incidents et les états des lieux."
        action={<Link href="/publier" className={btnSecondary}>Publier</Link>}
      />
      {scope.listings.length === 0 ? (
        <Empty title="Aucun bien dans cet espace" text="Publiez un logement, ou passez sur l'autre portefeuille." />
      ) : (
        <div className="grid gap-4">
          {scope.listings.map((listing) => {
            const incidents = scope.incidents.filter((item) => item.listingId === listing.id && item.status !== "resolu").length;
            const inspection = scope.inspections.find((item) => item.listingId === listing.id);
            return (
              <article key={listing.id} className="grid gap-4 rounded-3xl border border-[#ebebeb] p-4 md:grid-cols-[180px_1fr_auto] md:items-center">
                <div className="relative h-32 overflow-hidden rounded-2xl">
                  <Photo src={listing.images[0]} alt="" sizes="180px" />
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Pill>{MODE_LABEL[listing.mode]}</Pill>
                    {listing.managedByPlatform && <Pill tone="good">Géré par Ameena</Pill>}
                  </div>
                  <h2 className="mt-2 text-lg font-semibold">{listing.title}</h2>
                  <p className="text-sm text-[#6a6a6a]">{listing.neighborhood}, {listing.city}</p>
                  <p className="mt-2 text-sm">
                    {formatMoney(listing.price, listing.currency)} {listing.mode === "sejour" ? "/ nuit" : "/ mois"}
                    {" · "}
                    {incidents} incident{incidents > 1 ? "s" : ""} ouvert{incidents > 1 ? "s" : ""}
                    {inspection ? ` · dernier état des lieux le ${inspection.date}` : " · pas encore d'état des lieux"}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link className={btnSecondary} href={`/logements/${listing.id}`}>Fiche</Link>
                  <Link className={btnSecondary} href={`/gestion/incidents/nouveau?bien=${listing.id}`}>Signaler</Link>
                  <Link className={btnSecondary} href={`/gestion/etats-des-lieux/nouveau?bien=${listing.id}`}>État des lieux</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
