"use client";

import { useEffect, useState } from "react";
import { PageHead, Pill } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";
import { loadMyBookings } from "@/lib/supabase";
import { useScope } from "@/lib/store";
import type { MarketBooking } from "@/lib/types";
import { useTitle } from "@/lib/use-title";

export default function ClientsPage() {
  const scope = useScope();
  const [bookings, setBookings] = useState<MarketBooking[]>([]);
  const [error, setError] = useState("");
  useTitle("Clientèle · Se Loger au Sénégal");

  const listingIdsKey = scope.listings.flatMap((listing) => listing.databaseId ? [listing.databaseId] : []).sort().join(",");
  useEffect(() => {
    const listingIds = new Set(listingIdsKey ? listingIdsKey.split(",") : []);
    loadMyBookings()
      .then((rows) => setBookings(rows.filter((booking) =>
        booking.listing_id
        && listingIds.has(booking.listing_id)
        && !["declined", "cancelled", "expired"].includes(booking.status))))
      .catch(() => setError("La clientèle ne peut pas être chargée."));
  }, [listingIdsKey]);

  const clients = [...new Map(bookings.map((booking) => [
    `${booking.guest_id}:${booking.listing_id}`,
    booking,
  ])).values()];

  return (
    <div>
      <PageHead title="Clientèle" text="Locataires et voyageurs rattachés à un bien, avec le solde encore dû." />
      {error && <p role="alert" className="mb-4 rounded-xl bg-[#fff1ee] px-4 py-3 text-sm text-[#a52a12]">{error}</p>}
      <div className="grid gap-3">
        {clients.map((client) => {
          const listing = scope.listings.find((item) => item.databaseId === client.listing_id);
          const due = ["preapproved", "awaiting_payment"].includes(client.status) ? client.total : 0;
          return (
            <article key={`${client.guest_id}:${client.listing_id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#ebebeb] p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{client.guest_name}</h2>
                  <Pill>{client.mode === "location" ? "Locataire" : "Voyageur"}</Pill>
                </div>
                <p className="mt-1 text-sm text-[#6a6a6a]">{listing?.title}</p>
                <p className="mt-1 text-sm text-[#6a6a6a]">{client.guest_phone || "Coordonnées à compléter"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6a6a6a]">Solde</p>
                <p className="text-xl font-semibold">{formatMoney(due, client.currency)}</p>
                <p className="text-xs text-[#6a6a6a]">Depuis le {formatDate(client.created_at)}</p>
              </div>
            </article>
          );
        })}
        {!error && clients.length === 0 && <p className="rounded-2xl border border-dashed border-[#cccccc] p-5 text-sm text-[#6a6a6a]">Aucun client réel rattaché à vos annonces.</p>}
      </div>
    </div>
  );
}
