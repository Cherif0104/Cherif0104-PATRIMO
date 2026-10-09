"use client";

import Link from "next/link";
import { AdSlot } from "@/components/ad-slot";
import { Photo } from "@/components/photo";
import { PageHead, Pill } from "@/components/ui";
import { formatDate, formatMoney, roleLabel } from "@/lib/format";
import { INCIDENT_STATUS } from "@/lib/labels";
import { useAmeena, useScope } from "@/lib/store";
import { useTitle } from "@/lib/use-title";

export default function DashboardPage() {
  const { state } = useAmeena();
  const scope = useScope();
  useTitle("Tableau de bord · Se Loger au Sénégal");
  const openIncidents = scope.incidents.filter((item) => item.status !== "resolu");
  const upcoming = scope.reservations.filter((item) => item.status === "confirmee" || item.status === "en-cours");

  return (
    <div>
      <PageHead
        eyebrow="Système d'exploitation du parc"
        title={`Bonjour ${roleLabel(state.role).split(" ")[0]}`}
        text="Biens, encaissements, clients, pannes et états des lieux. Le même dossier sert de preuve et de pilotage."
      />
      <div className="mb-8">
        <AdSlot placement="gestion" compact />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Biens" value={String(scope.listings.length)} href="/gestion/biens" />
        <Stat label="Incidents ouverts" value={String(openIncidents.length)} href="/gestion/incidents" />
        <Stat label="Réservations actives" value={String(upcoming.length)} href="/gestion/reservations" />
        <Stat label="États des lieux" value={String(scope.inspections.length)} href="/gestion/etats-des-lieux" />
      </div>

      <h2 className="mb-4 mt-10 text-xl font-semibold">Biens</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {scope.listings.map((listing) => (
          <Link key={listing.id} href={`/logements/${listing.id}`} className="flex gap-4 rounded-3xl border border-[#ebebeb] p-3">
            <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-2xl">
              <Photo src={listing.images[0]} alt="" sizes="120px" />
            </div>
            <div>
              <p className="font-semibold">{listing.title}</p>
              <p className="text-sm text-[#6a6a6a]">{listing.neighborhood}, {listing.city}</p>
              <p className="mt-2 text-sm">{formatMoney(listing.price, listing.currency)} {listing.mode === "sejour" ? "/ nuit" : "/ mois"}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xl font-semibold">À traiter</h2>
          <div className="space-y-3">
            {openIncidents.map((incident) => (
              <Link key={incident.id} href={`/gestion/incidents/${incident.id}`} className="block rounded-2xl border border-[#ebebeb] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{incident.title}</p>
                  <Pill tone={incident.status === "nouveau" ? "bad" : "warn"}>{INCIDENT_STATUS[incident.status]}</Pill>
                </div>
                <p className="mt-1 text-sm text-[#6a6a6a]">{incident.photos.length} photo{incident.photos.length > 1 ? "s" : ""} · {incident.notifiedName}</p>
              </Link>
            ))}
            {openIncidents.length === 0 && <p className="text-sm text-[#6a6a6a]">Aucun incident ouvert.</p>}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold">Séjours et baux en cours</h2>
          <div className="space-y-3">
            {upcoming.map((reservation) => {
              const listing = state.listings.find((item) => item.id === reservation.listingId);
              return (
                <div key={reservation.id} className="rounded-2xl border border-[#ebebeb] p-4">
                  <p className="font-medium">{reservation.guestName}</p>
                  <p className="text-sm text-[#6a6a6a]">{listing?.title}</p>
                  <p className="mt-1 text-sm">{formatDate(reservation.from)} → {formatDate(reservation.to)}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="rounded-3xl border border-[#ebebeb] p-5 hover:shadow-sm">
      <p className="text-sm text-[#6a6a6a]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </Link>
  );
}
