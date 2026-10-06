"use client";

import { PageHead, Pill } from "@/components/ui";
import { btnSecondary, formatDate, formatMoney } from "@/lib/format";
import { RESERVATION_STATUS } from "@/lib/labels";
import { useAmeena, useScope } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import type { ReservationStatus } from "@/lib/types";

const tone = {
  demande: "warn",
  confirmee: "good",
  "en-cours": "good",
  terminee: "neutral",
} as const;

export default function ReservationsPage() {
  const { state, dispatch } = useAmeena();
  const scope = useScope();
  useTitle("Réservations · Ameena");

  return (
    <div>
      <PageHead title="Réservations" text="Une demande confirmée crée la facture client et la commission Ameena." />
      <div className="overflow-hidden rounded-3xl border border-[#ebebeb]">
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
