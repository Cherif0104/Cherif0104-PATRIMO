"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Photo } from "@/components/photo";
import { Empty, PageHead, Pill } from "@/components/ui";
import { btnSecondary, formatMoney } from "@/lib/format";
import { MODE_LABEL } from "@/lib/labels";
import { loadPropertyIncidents, loadPropertyInspections } from "@/lib/supabase";
import { useScope } from "@/lib/store";
import type { PropertyIncident, PropertyInspection } from "@/lib/types";
import { useTitle } from "@/lib/use-title";

export default function BiensPage() {
  const scope = useScope();
  const [incidents, setIncidents] = useState<PropertyIncident[]>([]);
  const [inspections, setInspections] = useState<PropertyInspection[]>([]);
  useTitle("Biens · Se Loger au Sénégal");

  useEffect(() => {
    Promise.all([loadPropertyIncidents(), loadPropertyInspections()])
      .then(([incidentRows, inspectionRows]) => {
        setIncidents(incidentRows);
        setInspections(inspectionRows);
      })
      .catch(() => {
        // The listing remains manageable if operational counters are unavailable.
      });
  }, []);

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
            const openIncidents = incidents.filter((item) => item.listing_id === listing.databaseId && item.status !== "resolu").length;
            const inspection = inspections.find((item) => item.listing_id === listing.databaseId);
            return (
              <article key={listing.id} className="grid gap-4 rounded-3xl border border-[#ebebeb] p-4 md:grid-cols-[180px_1fr_auto] md:items-center">
                <div className="relative h-32 overflow-hidden rounded-2xl">
                  <Photo src={listing.images[0]} alt="" sizes="180px" />
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Pill>{MODE_LABEL[listing.mode]}</Pill>
                    {listing.managedByPlatform && <Pill tone="good">Géré par Se Loger au Sénégal</Pill>}
                  </div>
                  <h2 className="mt-2 text-lg font-semibold">{listing.title}</h2>
                  <p className="text-sm text-[#6a6a6a]">{listing.neighborhood}, {listing.city}</p>
                  <p className="mt-2 text-sm">
                    {formatMoney(listing.price, listing.currency)} {listing.mode === "sejour" ? "/ nuit" : "/ mois"}
                    {" · "}
                    {openIncidents} incident{openIncidents > 1 ? "s" : ""} ouvert{openIncidents > 1 ? "s" : ""}
                    {inspection ? ` · dernier état des lieux le ${inspection.inspection_date}` : " · pas encore d'état des lieux"}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link className={btnSecondary} href={`/gestion/biens/${listing.id}`}>Gérer</Link>
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
