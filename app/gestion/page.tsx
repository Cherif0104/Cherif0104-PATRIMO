"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import { Photo } from "@/components/photo";
import { PageHead, Pill } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { loadMyBookings, loadPropertyContracts, loadPropertyIncidents } from "@/lib/supabase";
import { useScope } from "@/lib/store";
import type { MarketBooking, PropertyContract, PropertyIncident } from "@/lib/types";
import { useTitle } from "@/lib/use-title";

export default function DashboardPage() {
  const { profile } = useAuth();
  const scope = useScope();
  const [bookings, setBookings] = useState<MarketBooking[]>([]);
  const [contracts, setContracts] = useState<PropertyContract[]>([]);
  const [incidents, setIncidents] = useState<PropertyIncident[]>([]);
  const [error, setError] = useState("");
  useTitle("Tableau de bord · Se Loger au Sénégal");
  const listingIds = new Set(scope.listings.flatMap((listing) => listing.databaseId ? [listing.databaseId] : []));
  const listingIdsKey = [...listingIds].sort().join(",");

  useEffect(() => {
    const allowed = new Set(listingIdsKey ? listingIdsKey.split(",") : []);
    Promise.all([loadMyBookings(), loadPropertyContracts(), loadPropertyIncidents()])
      .then(([rows, contractRows, incidentRows]) => {
        setBookings(rows.filter((booking) => booking.listing_id && allowed.has(booking.listing_id)));
        setContracts(contractRows.filter((contract) => allowed.has(contract.listing_id)));
        setIncidents(incidentRows.filter((incident) => allowed.has(incident.listing_id)));
      })
      .catch(() => setError("Les indicateurs de réservation ne peuvent pas être chargés."));
  }, [listingIdsKey]);

  const activeBookings = bookings.filter((booking) =>
    ["requested", "preapproved", "awaiting_payment", "confirmed"].includes(booking.status));

  return (
    <div>
      <PageHead
        eyebrow="Système d'exploitation du parc"
        title={`Bonjour ${profile?.full_name?.split(" ")[0] || "partenaire"}`}
        text="Les indicateurs ci-dessous proviennent exclusivement des annonces et demandes persistées sur le serveur."
      />
      {error && <p role="alert" className="mb-4 rounded-xl bg-[#fff1ee] px-4 py-3 text-sm text-[#a52a12]">{error}</p>}
      <div className="mb-8">
        <AdSlot placement="gestion" compact />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Biens" value={String(scope.listings.length)} href="/gestion/biens" />
        <Stat label="Demandes actives" value={String(activeBookings.length)} href="/gestion/reservations" />
        <Stat label="Contrats actifs" value={String(contracts.filter((contract) => ["signed", "active"].includes(contract.status)).length)} href="/gestion/contrats" />
        <Stat label="Incidents ouverts" value={String(incidents.filter((incident) => incident.status !== "resolu").length)} href="/gestion/incidents" />
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

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold">Demandes récentes</h2>
        <div className="space-y-3">
          {activeBookings.slice(0, 6).map((booking) => (
            <Link key={booking.id} href="/gestion/reservations" className="block rounded-2xl border border-[#ebebeb] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{booking.guest_name}</p>
                  <p className="text-sm text-[#6a6a6a]">{booking.listing_title}</p>
                  <p className="mt-1 text-sm">{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</p>
                </div>
                <Pill tone={booking.status === "confirmed" ? "good" : "warn"}>{booking.status}</Pill>
              </div>
            </Link>
          ))}
          {activeBookings.length === 0 && <p className="rounded-2xl border border-dashed border-[#cccccc] p-5 text-sm text-[#6a6a6a]">Aucune demande réelle à traiter.</p>}
        </div>
      </section>
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
