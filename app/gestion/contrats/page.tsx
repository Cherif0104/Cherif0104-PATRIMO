"use client";

import { useEffect, useMemo, useState } from "react";
import { FileCheck2, Send } from "lucide-react";
import { PageHead, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { btnPrimary, btnSecondary, fieldClass, formatDate, formatMoney } from "@/lib/format";
import {
  createPropertyContract,
  loadMyBookings,
  loadPropertyContracts,
  updatePropertyContractStatus,
} from "@/lib/supabase";
import { useScope } from "@/lib/store";
import type { MarketBooking, PropertyContract } from "@/lib/types";

export default function ContractsPage() {
  const { user } = useAuth();
  const scope = useScope();
  const [contracts, setContracts] = useState<PropertyContract[]>([]);
  const [bookings, setBookings] = useState<MarketBooking[]>([]);
  const [listingId, setListingId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [title, setTitle] = useState("Bail d’habitation");
  const [kind, setKind] = useState<PropertyContract["contract_kind"]>("bail_habitation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const listingById = useMemo(() => new Map(scope.listings.flatMap((listing) => listing.databaseId ? [[listing.databaseId, listing] as const] : [])), [scope.listings]);

  useEffect(() => {
    Promise.all([loadPropertyContracts(), loadMyBookings()])
      .then(([contractRows, bookingRows]) => {
        setContracts(contractRows);
        setBookings(bookingRows.filter((booking) => booking.listing_id && ["confirmed", "completed"].includes(booking.status)));
      })
      .catch(() => setError("Les contrats ne peuvent pas être chargés."));
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !listingId || title.trim().length < 3) return;
    const booking = bookings.find((row) => row.id === bookingId);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const contract = await createPropertyContract({
        listingId,
        bookingId: booking?.id,
        tenantId: booking?.guest_id,
        ownerId: listingById.get(listingId)?.ownerUserId,
        organizationId: listingById.get(listingId)?.organizationId,
        userId: user.id,
        title,
        kind,
        startDate,
        endDate,
        amount: Number(amount) || undefined,
        currency: listingById.get(listingId)?.currency ?? "XOF",
      });
      setContracts((rows) => [contract, ...rows]);
      setMessage("Contrat créé. Vous pouvez maintenant l’envoyer au client.");
    } catch {
      setError("Le contrat n’a pas pu être créé.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(contract: PropertyContract, status: PropertyContract["status"]) {
    setBusy(true);
    setError("");
    try {
      const updated = await updatePropertyContractStatus(contract.id, status);
      setContracts((rows) => rows.map((row) => row.id === updated.id ? updated : row));
    } catch {
      setError("Le statut du contrat n’a pas pu être modifié.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHead eyebrow="Relation contractuelle" title="Contrats et mandats" text="Préparez les baux, rattachez-les à une réservation réelle et notifiez le client depuis un seul espace." />
      {message && <p className="mb-4 rounded-xl bg-[#e7f4f2] px-4 py-3 text-sm text-[#145e57]">{message}</p>}
      {error && <p role="alert" className="mb-4 rounded-xl bg-[#fff1ee] px-4 py-3 text-sm text-[#a52a12]">{error}</p>}
      <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
        <form onSubmit={create} className="grid content-start gap-3 rounded-[24px] border border-[#e5e5e5] p-5 xl:sticky xl:top-24">
          <h2 className="text-lg font-bold">Nouveau contrat</h2>
          <select className={fieldClass} value={listingId} onChange={(event) => { setListingId(event.target.value); setBookingId(""); }} required>
            <option value="">Sélectionner un bien</option>
            {scope.listings.map((listing) => listing.databaseId && <option key={listing.databaseId} value={listing.databaseId}>{listing.title}</option>)}
          </select>
          <select className={fieldClass} value={bookingId} onChange={(event) => {
            const next = bookings.find((row) => row.id === event.target.value);
            setBookingId(event.target.value);
            if (next?.listing_id) {
              setListingId(next.listing_id);
              setStartDate(next.start_date);
              setEndDate(next.end_date);
              setAmount(String(next.total));
            }
          }}>
            <option value="">Sans réservation liée</option>
            {bookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.guest_name} · {booking.listing_title}</option>)}
          </select>
          <input className={fieldClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre du contrat" minLength={3} required />
          <select className={fieldClass} value={kind} onChange={(event) => setKind(event.target.value as PropertyContract["contract_kind"])}>
            <option value="bail_habitation">Bail d’habitation</option>
            <option value="location_meublee">Location meublée</option>
            <option value="mandat_gestion">Mandat de gestion</option>
            <option value="reservation">Contrat de réservation</option>
            <option value="vente">Dossier de vente</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className={fieldClass} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} aria-label="Date de début" />
            <input className={fieldClass} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} aria-label="Date de fin" />
          </div>
          <input className={fieldClass} value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Montant mensuel ou total" />
          <button className={btnPrimary} disabled={busy || !listingId || title.trim().length < 3}><FileCheck2 className="h-4 w-4" /> Créer le contrat</button>
        </form>

        <section className="grid content-start gap-3">
          {contracts.map((contract) => {
            const listing = listingById.get(contract.listing_id);
            return (
              <article key={contract.id} className="rounded-[22px] border border-[#e5e5e5] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{contract.title}</p>
                    <p className="mt-1 text-sm text-[#6a6a6a]">{listing?.title ?? "Bien immobilier"}{contract.start_date ? ` · ${formatDate(contract.start_date)}` : ""}</p>
                  </div>
                  <Pill tone={contract.status === "active" || contract.status === "signed" ? "good" : contract.status === "cancelled" ? "warn" : "neutral"}>{contract.status}</Pill>
                </div>
                {contract.monthly_amount && <p className="mt-3 text-sm font-semibold">{formatMoney(contract.monthly_amount, contract.currency)}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {contract.status === "draft" && <button className={btnPrimary} disabled={busy} onClick={() => void changeStatus(contract, "sent")}><Send className="h-4 w-4" /> Envoyer</button>}
                  {contract.status === "sent" && <button className={btnSecondary} disabled={busy} onClick={() => void changeStatus(contract, "signed")}>Marquer signé</button>}
                  {contract.status === "signed" && <button className={btnPrimary} disabled={busy} onClick={() => void changeStatus(contract, "active")}>Activer</button>}
                  {contract.status === "active" && <button className={btnSecondary} disabled={busy} onClick={() => void changeStatus(contract, "ended")}>Clôturer</button>}
                </div>
              </article>
            );
          })}
          {contracts.length === 0 && <p className="rounded-2xl border border-dashed border-[#cccccc] p-6 text-sm text-[#6a6a6a]">Aucun contrat persistant pour le moment.</p>}
        </section>
      </div>
    </div>
  );
}
