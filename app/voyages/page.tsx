"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, CreditCard, Download, FileText, Home, MapPinned } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { btnPrimary, btnSecondary, formatDate, formatMoney } from "@/lib/format";
import { acceptPropertyContract, loadMyBookings, loadPropertyContracts, supabase } from "@/lib/supabase";
import type { MarketBooking, PropertyContract } from "@/lib/types";
import { useTitle } from "@/lib/use-title";

export default function TripsPage() {
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<MarketBooking[]>([]);
  const [contracts, setContracts] = useState<PropertyContract[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState("");
  const [contractBusy, setContractBusy] = useState("");
  const [acceptedContractTerms, setAcceptedContractTerms] = useState<string[]>([]);
  const [error, setError] = useState("");
  useTitle("Mes dossiers · Se Loger au Sénégal");

  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    Promise.all([loadMyBookings(), loadPropertyContracts()])
      .then(([bookingRows, contractRows]) => {
        setBookings(bookingRows.filter((booking) => !["declined", "cancelled", "expired"].includes(booking.status)));
        setContracts(contractRows);
      })
      .finally(() => setLoaded(true));
  }, [user]);

  if (loading || !loaded) return <p className="p-8 text-sm text-[#6a6a6a]">Chargement de vos voyages…</p>;

  async function startPayment(booking: MarketBooking) {
    if (!supabase || !user) return;
    setPaymentBusy(booking.id);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Votre session a expiré. Reconnectez-vous.");
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `checkout:${booking.id}:${user.id}`,
        },
        body: JSON.stringify({ bookingId: booking.id, paymentMethod: "hosted_checkout" }),
      });
      const result = await response.json() as { checkoutUrl?: string; message?: string };
      if (!response.ok || !result.checkoutUrl) throw new Error(result.message || "Le paiement ne peut pas être ouvert.");
      window.location.assign(result.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Le paiement ne peut pas être ouvert.");
      setPaymentBusy("");
    }
  }

  async function acceptContract(contract: PropertyContract) {
    setContractBusy(contract.id);
    setError("");
    try {
      const accepted = await acceptPropertyContract(contract.id);
      setContracts((rows) => rows.map((row) => row.id === accepted.id ? accepted : row));
    } catch {
      setError("Le contrat n’a pas pu être accepté. Rechargez la page puis réessayez.");
    } finally {
      setContractBusy("");
    }
  }

  return (
    <main className="mobile-page px-4 py-7 md:px-10 lg:py-12 xl:px-16">
      <h1 className="text-[30px] font-semibold tracking-[-0.04em]">Mes dossiers</h1>
      {error && <p role="alert" className="mt-4 rounded-xl bg-[#fff1ee] px-4 py-3 text-sm text-[#a52a12]">{error}</p>}
      {contracts.length > 0 && (
        <section className="mt-7">
          <h2 className="flex items-center gap-2 text-lg font-bold"><FileText className="h-5 w-5 text-[#FF4845]" /> Mes contrats</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {contracts.map((contract) => (
              <article key={contract.id} className="rounded-[20px] border border-[#e5e5e5] bg-[#FFFDF7] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{contract.title}</p>
                    <p className="mt-1 text-sm text-[#6a6a6a]">{contract.start_date ? formatDate(contract.start_date) : "Date à confirmer"}{contract.end_date ? ` → ${formatDate(contract.end_date)}` : ""}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{contract.status}</span>
                </div>
                {contract.monthly_amount && <p className="mt-3 text-sm font-semibold">{formatMoney(contract.monthly_amount, contract.currency)}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {contract.status === "sent" && (
                    <div className="w-full rounded-2xl border border-[#e5e5e5] bg-white p-3">
                      <label className="flex items-start gap-2 text-xs leading-5">
                        <input
                          className="mt-1"
                          type="checkbox"
                          checked={acceptedContractTerms.includes(contract.id)}
                          onChange={(event) => setAcceptedContractTerms((ids) =>
                            event.target.checked
                              ? [...ids, contract.id]
                              : ids.filter((id) => id !== contract.id))}
                        />
                        J’ai téléchargé la fiche contractuelle, vérifié les informations et j’accepte cette version.
                      </label>
                      <button
                        className={`${btnPrimary} mt-3`}
                        disabled={contractBusy === contract.id || !acceptedContractTerms.includes(contract.id)}
                        aria-describedby={`contract-help-${contract.id}`}
                        onClick={() => void acceptContract(contract)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {contractBusy === contract.id ? "Acceptation…" : "Accepter le contrat"}
                      </button>
                      {!acceptedContractTerms.includes(contract.id) && (
                        <p id={`contract-help-${contract.id}`} className="mt-2 text-xs text-[#6a6a6a]">
                          Téléchargez le PDF, vérifiez-le puis cochez la case pour activer ce bouton.
                        </p>
                      )}
                    </div>
                  )}
                  <a href={`/api/contracts/${contract.id}/pdf`} className={btnSecondary}>
                    <Download className="h-4 w-4" /> Télécharger le PDF
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {bookings.length > 0 || contracts.length > 0 ? (
        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-[24px] border border-[#e5e5e5] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{booking.listing_title}</h2>
                  <p className="mt-1 text-sm text-[#6a6a6a]">{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</p>
                </div>
                <CalendarDays className="h-5 w-5 text-[#C13515]" />
              </div>
              <div className="mt-5 border-t border-[#eeeeee] pt-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <strong>{formatMoney(booking.total, booking.currency)}</strong>
                  <span className="text-[#6a6a6a]">{bookingStatus(booking.status)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/logements/${booking.listing_key}`} className={btnSecondary}>Voir le logement</Link>
                  {(booking.status === "preapproved" || booking.status === "awaiting_payment") && (
                    <button className={btnPrimary} disabled={paymentBusy === booking.id} onClick={() => void startPayment(booking)}>
                      <CreditCard className="h-4 w-4" /> {paymentBusy === booking.id ? "Ouverture…" : "Payer"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="relative mx-auto mt-8 min-h-[520px] max-w-2xl overflow-hidden rounded-[30px] bg-[#f4f7f7] px-6 py-14 text-center">
          <MapPinned className="absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 text-[#d5dfde]" strokeWidth={0.7} />
          <div className="relative mx-auto mt-14 grid h-28 w-28 place-items-center rounded-full bg-white shadow-[0_12px_30px_rgba(0,0,0,.1)]">
            <Home className="h-12 w-12 text-[#C13515]" />
          </div>
          <div className="relative mt-12">
            <h2 className="text-2xl font-semibold">Trouvez votre prochain logement</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-[#6a6a6a]">
              Vos demandes, contrats et paiements immobiliers seront regroupés ici, sans mélange avec d’autres services.
            </p>
            <Link href={user ? "/explorer" : "/connexion?retour=/voyages"} className={`${btnPrimary} mt-6`}>
              {user ? "Commencer" : "Se connecter"}
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

function bookingStatus(status: MarketBooking["status"]) {
  const labels: Record<MarketBooking["status"], string> = {
    requested: "Demande envoyée",
    preapproved: "Préapprouvée",
    awaiting_payment: "Paiement attendu",
    confirmed: "Confirmée",
    declined: "Refusée",
    cancelled: "Annulée",
    completed: "Terminée",
    expired: "Expirée",
  };
  return labels[status];
}
