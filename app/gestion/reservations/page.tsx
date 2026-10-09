"use client";

import { useEffect, useState } from "react";
import { PageHead, Pill } from "@/components/ui";
import { btnSecondary, formatDate, formatMoney } from "@/lib/format";
import { RESERVATION_STATUS } from "@/lib/labels";
import { loadMyBookings, preapproveMarketBooking, updateMarketBookingStatus } from "@/lib/supabase";
import { useAmeena, useScope } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import type { MarketBooking, ReservationStatus } from "@/lib/types";

const tone = {
  demande: "warn",
  confirmee: "good",
  "en-cours": "good",
  terminee: "neutral",
} as const;

export default function ReservationsPage() {
  const { state, dispatch } = useAmeena();
  const scope = useScope();
  const [marketBookings, setMarketBookings] = useState<MarketBooking[]>([]);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  useTitle("Réservations · Se Loger au Sénégal");

  const ownerListingIdsKey = scope.listings
    .map((listing) => listing.databaseId)
    .filter((id): id is string => Boolean(id))
    .sort()
    .join(",");

  useEffect(() => {
    const ownerListingIds = new Set(ownerListingIdsKey ? ownerListingIdsKey.split(",") : []);
    loadMyBookings()
      .then((rows) => setMarketBookings(rows.filter((booking) => booking.listing_id && ownerListingIds.has(booking.listing_id))))
      .catch(() => setError("Les demandes en ligne ne peuvent pas être chargées."));
  }, [ownerListingIdsKey]);

  async function changeStatus(booking: MarketBooking, status: "preapproved" | "declined") {
    setBusyId(booking.id);
    setError("");
    try {
      const updated = status === "preapproved"
        ? await preapproveMarketBooking(booking.id)
        : await updateMarketBookingStatus(booking.id, status);
      setMarketBookings((rows) => rows.map((row) => (row.id === booking.id ? updated : row)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Le statut n’a pas pu être modifié.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <PageHead title="Réservations" text="La préapprobation réserve le créneau pendant 30 minutes. Seul un paiement vérifié par le prestataire confirme ensuite le séjour." />
      {error && <p role="alert" className="mb-4 rounded-xl bg-[#fff1ee] px-4 py-3 text-sm text-[#a52a12]">{error}</p>}

      {marketBookings.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Demandes en ligne</h2>
          <div className="grid gap-3">
            {marketBookings.map((booking) => (
              <article key={booking.id} className="rounded-2xl border border-[#e5e5e5] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{booking.guest_name}</p>
                    <p className="mt-1 text-sm text-[#6a6a6a]">{booking.listing_title}</p>
                    <p className="mt-1 text-sm">{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</p>
                  </div>
                  <div className="text-right">
                    <Pill tone={booking.status === "confirmed" ? "good" : booking.status === "declined" ? "neutral" : "warn"}>
                      {booking.status === "requested" ? "Demande" : booking.status === "preapproved" ? "Paiement attendu (30 min)" : booking.status === "awaiting_payment" ? "Paiement en cours" : booking.status === "confirmed" ? "Confirmée et payée" : booking.status === "declined" ? "Refusée" : booking.status}
                    </Pill>
                    <p className="mt-2 text-sm font-semibold">{formatMoney(booking.total, booking.currency)}</p>
                  </div>
                </div>
                {booking.status === "requested" && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-[#eeeeee] pt-4">
                    <button className={btnSecondary} disabled={busyId === booking.id} onClick={() => void changeStatus(booking, "preapproved")}>
                      Préapprouver pendant 30 min
                    </button>
                    <button className={btnSecondary} disabled={busyId === booking.id} onClick={() => void changeStatus(booking, "declined")}>
                      Refuser
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <h2 className="mb-1 text-lg font-semibold">Simulation locale</h2>
      <p className="mb-3 text-sm text-[#6a6a6a]">Ces exemples ne créent ni réservation, ni paiement, ni écriture comptable réelle.</p>
      <div className="overflow-x-auto rounded-3xl border border-[#ebebeb]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fafafa] text-[#6a6a6a]">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Bien</th>
              <th className="px-4 py-3 font-medium">Dates</th>
              <th className="px-4 py-3 font-medium">Montant</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {scope.reservations.map((reservation) => {
              const listing = state.listings.find((item) => item.id === reservation.listingId);
              return (
                <tr key={reservation.id} className="border-t border-[#f2f2f2]">
                  <td className="px-4 py-3 font-medium">{reservation.guestName}</td>
                  <td className="px-4 py-3">{listing?.neighborhood}</td>
                  <td className="px-4 py-3">{formatDate(reservation.from)} → {formatDate(reservation.to)}</td>
                  <td className="px-4 py-3">{formatMoney(reservation.guestPays, reservation.currency)}</td>
                  <td className="px-4 py-3"><Pill tone={tone[reservation.status]}>{RESERVATION_STATUS[reservation.status]}</Pill></td>
                  <td className="px-4 py-3 text-right">
                    {reservation.status === "demande" && (
                      <button className={btnSecondary} onClick={() => dispatch({ type: "set-reservation-status", id: reservation.id, status: "confirmee" satisfies ReservationStatus })}>
                        Confirmer
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {scope.reservations.length === 0 && <p className="p-6 text-sm text-[#6a6a6a]">Aucune réservation sur ce portefeuille.</p>}
      </div>
    </div>
  );
}
