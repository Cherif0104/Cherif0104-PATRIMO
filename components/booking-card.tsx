"use client";

import { useEffect, useMemo, useState } from "react";
import { btnPrimary, fieldClass, nightsBetween, addDaysISO } from "@/lib/format";
import { buildQuote } from "@/lib/quote";
import { useAmeena } from "@/lib/store";
import type { Listing } from "@/lib/types";
import { QuoteView } from "./quote-view";
import { uid } from "@/lib/format";

export function BookingCard({ listing }: { listing: Listing }) {
  const { state, dispatch } = useAmeena();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setFrom(addDaysISO(5));
    setTo(addDaysISO(8));
  }, []);

  const nights = listing.mode === "sejour" ? Math.max(1, nightsBetween(from, to) || 3) : 1;
  const invalid = Boolean(listing.mode === "sejour" && from && to && nightsBetween(from, to) < 1);
  const quote = useMemo(
    () => buildQuote(listing, invalid ? 3 : nights, state.settings),
    [listing, nights, invalid, state.settings],
  );

  function reserve() {
    if (!name.trim() || invalid) return;
    dispatch({
      type: "add-reservation",
      reservation: {
        id: uid("res"),
        listingId: listing.id,
        guestName: name.trim(),
        mode: listing.mode,
        from: from || addDaysISO(5),
        to: listing.mode === "sejour" ? to || addDaysISO(8) : addDaysISO(370),
        status: "demande",
        subtotal: quote.subtotal,
        commission: quote.commission,
        guestPays: quote.guestPays,
        currency: quote.currency,
      },
    });
    setSent(true);
  }

  return (
    <aside id="reservation" className="rounded-[20px] border border-[#dddddd] p-6 shadow-[0_6px_16px_rgba(0,0,0,0.08)] lg:sticky lg:top-28">
      <p className="text-2xl font-semibold tracking-tight">
        {listing.mode === "sejour" ? "Réserver un séjour" : "Demander la location"}
      </p>
      <div className="mt-4 grid gap-3">
        {listing.mode === "sejour" ? (
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-medium">
              Arrivée
              <input className={`${fieldClass} mt-1`} type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label className="text-xs font-medium">
              Départ
              <input className={`${fieldClass} mt-1`} type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </label>
          </div>
        ) : (
          <p className="rounded-2xl bg-[#f7f7f7] px-4 py-3 text-sm leading-6">
            Le client verse {state.settings.advanceMonths} mois d&apos;avance au propriétaire. La commission se règle à part, selon qui en a la charge.
          </p>
        )}
        <label className="text-xs font-medium">
          Votre nom
          <input className={`${fieldClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom et prénom" />
        </label>
      </div>
      {invalid && <p className="mt-3 text-sm text-[#c13515]">Le départ doit suivre l&apos;arrivée.</p>}
      <div className="mt-5">
        <QuoteView quote={quote} />
      </div>
      {sent ? (
        <p className="mt-5 rounded-2xl bg-[#e7f4f2] px-4 py-3 text-sm leading-6 text-[#145e57]">
          Demande envoyée. Elle apparaît dans l&apos;espace du propriétaire, avec le montant et la commission du moment.
        </p>
      ) : (
        <button className={`${btnPrimary} mt-5 w-full py-3`} disabled={!name.trim() || invalid} onClick={reserve}>
          {listing.mode === "sejour" ? "Demander le séjour" : "Demander à visiter"}
        </button>
      )}
    </aside>
  );
}
