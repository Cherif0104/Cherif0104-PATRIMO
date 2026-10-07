"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { btnPrimary, fieldClass, nightsBetween, addDaysISO } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { buildQuote } from "@/lib/quote";
import { createMarketBooking, isListingAvailable } from "@/lib/supabase";
import { useAmeena } from "@/lib/store";
import type { Listing } from "@/lib/types";
import { QuoteView } from "./quote-view";
import { uid } from "@/lib/format";

export function BookingCard({ listing }: { listing: Listing }) {
  const { state, dispatch } = useAmeena();
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "blocked">("idle");
  const nights = listing.mode === "sejour" ? Math.max(1, nightsBetween(from, to) || 3) : 1;
  const invalid = Boolean(listing.mode === "sejour" && from && to && nightsBetween(from, to) < 1);

  useEffect(() => {
    setFrom(addDaysISO(5));
    setTo(addDaysISO(8));
  }, []);

  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
    if (profile?.phone) setPhone(profile.phone);
  }, [profile]);

  useEffect(() => {
    if (!listing.databaseId || listing.mode !== "sejour" || !from || !to || invalid) {
      setAvailability("idle");
      return;
    }
    let active = true;
    setAvailability("checking");
    isListingAvailable(listing.databaseId, from, to)
      .then((available) => {
        if (active) setAvailability(available ? "available" : "blocked");
      })
      .catch(() => {
        if (active) setAvailability("idle");
      });
    return () => {
      active = false;
    };
  }, [from, invalid, listing.databaseId, listing.mode, to]);

  const quote = useMemo(
    () => buildQuote(listing, invalid ? 3 : nights, state.settings),
    [listing, nights, invalid, state.settings],
  );

  async function reserve() {
    if (!user || !name.trim() || invalid) return;
    setBusy(true);
    setError("");
    const start = from || addDaysISO(5);
    const end = listing.mode === "sejour" ? to || addDaysISO(8) : addDaysISO(370);
    try {
      if (listing.databaseId && listing.mode === "sejour") {
        const available = await isListingAvailable(listing.databaseId, start, end);
        if (!available) {
          setAvailability("blocked");
          throw new Error("dates_blocked");
        }
      }
      await createMarketBooking({
        listing,
        userId: user.id,
        guestName: name.trim(),
        guestPhone: phone.trim(),
        from: start,
        to: end,
        quote,
      });
      dispatch({
        type: "add-reservation",
        reservation: {
          id: uid("res"),
          listingId: listing.id,
          guestName: name.trim(),
          mode: listing.mode,
          from: start,
          to: end,
          status: "demande",
          subtotal: quote.subtotal,
          commission: quote.commission,
          guestPays: quote.guestPays,
          currency: quote.currency,
        },
      });
      setSent(true);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message === "dates_blocked"
          ? "Ces dates ne sont plus disponibles. Choisissez un autre séjour."
          : "La demande n’a pas pu être enregistrée. Vérifiez votre connexion puis réessayez.",
      );
    } finally {
      setBusy(false);
    }
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
        <label className="text-xs font-medium">
          Téléphone
          <input className={`${fieldClass} mt-1`} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+221 77 000 00 00" autoComplete="tel" />
        </label>
      </div>
      {invalid && <p className="mt-3 text-sm text-[#c13515]">Le départ doit suivre l&apos;arrivée.</p>}
      {availability === "checking" && <p className="mt-3 text-sm text-[#6a6a6a]">Vérification des dates…</p>}
      {availability === "available" && <p className="mt-3 text-sm font-medium text-[#145e57]">Ces dates sont disponibles.</p>}
      {availability === "blocked" && <p className="mt-3 text-sm font-medium text-[#a52a12]">Ces dates sont déjà bloquées.</p>}
      <div className="mt-5">
        <QuoteView quote={quote} />
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-[#a52a12]">{error}</p>}
      {sent ? (
        <p className="mt-5 rounded-2xl bg-[#e7f4f2] px-4 py-3 text-sm leading-6 text-[#145e57]">
          Demande enregistrée. Vous pouvez la suivre dans votre compte, avec le prix et la commission figés à cet instant.
        </p>
      ) : !user ? (
        <Link
          className={`${btnPrimary} mt-5 w-full py-3`}
          href={`/connexion?retour=${encodeURIComponent(pathname)}`}
        >
          Se connecter pour demander
        </Link>
      ) : (
        <button className={`${btnPrimary} mt-5 w-full py-3`} disabled={busy || availability === "checking" || availability === "blocked" || !name.trim() || invalid} onClick={() => void reserve()}>
          {busy ? "Enregistrement…" : listing.mode === "sejour" ? "Demander le séjour" : "Demander à visiter"}
        </button>
      )}
      <p className="mt-3 text-center text-xs text-[#6a6a6a]">Aucun débit à cette étape.</p>
    </aside>
  );
}
