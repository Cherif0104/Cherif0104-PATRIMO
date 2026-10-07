"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, CalendarDays, Home, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { btnPrimary, btnSecondary, cx, fieldClass, formatDate, formatMoney } from "@/lib/format";
import { loadMyBookings, updateProfile } from "@/lib/supabase";
import type { AccountType, MarketBooking } from "@/lib/types";
import { useTitle } from "@/lib/use-title";

const STATUS: Record<MarketBooking["status"], string> = {
  requested: "Demande envoyée",
  preapproved: "Préapprouvée",
  awaiting_payment: "Paiement attendu",
  confirmed: "Confirmée",
  declined: "Refusée",
  cancelled: "Annulée",
  completed: "Terminée",
};

export default function AccountPage() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const [bookings, setBookings] = useState<MarketBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("voyageur");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useTitle("Mon compte · Ameena");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name);
    setPhone(profile.phone ?? "");
    setAccountType(profile.account_type);
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    setBookingsLoading(true);
    loadMyBookings()
      .then(setBookings)
      .catch(() => setError("Les demandes ne peuvent pas être chargées pour le moment."))
      .finally(() => setBookingsLoading(false));
  }, [user]);

  if (loading) {
    return <div className="px-4 py-20 text-center text-sm text-[#6a6a6a]">Ouverture du compte…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e7f4f2] text-[#1F6F66]">
          <UserRound />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">Votre espace Ameena</h1>
        <p className="mt-3 text-[#6a6a6a]">Connectez-vous pour retrouver vos demandes, publier ou gérer un bien.</p>
        <Link href="/connexion?retour=/compte" className={`${btnPrimary} mt-7`}>Se connecter</Link>
      </div>
    );
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaved(false);
    setError("");
    try {
      await updateProfile({
        id: profile.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        account_type: accountType,
      });
      await refreshProfile();
      setSaved(true);
    } catch {
      setError("Le profil n’a pas pu être enregistré.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#1F6F66]">Compte sécurisé</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Bonjour {profile?.full_name || user.email}</h1>
          <p className="mt-2 text-sm text-[#6a6a6a]">{user.email}</p>
        </div>
        <button className={btnSecondary} onClick={() => void signOut()}>
          <LogOut className="h-4 w-4" /> Se déconnecter
        </button>
      </div>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_380px]">
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Mes demandes</h2>
              <p className="mt-1 text-sm text-[#6a6a6a]">Les demandes envoyées depuis les fiches sont privées.</p>
            </div>
            <CalendarDays className="text-[#6a6a6a]" />
          </div>
          <div className="mt-5 grid gap-3">
            {bookingsLoading && <p className="rounded-2xl bg-[#f7f7f7] p-5 text-sm">Chargement…</p>}
            {!bookingsLoading && bookings.length === 0 && (
              <div className="rounded-[20px] border border-dashed border-[#cccccc] p-8 text-center">
                <Home className="mx-auto text-[#6a6a6a]" />
                <p className="mt-3 font-semibold">Aucune demande pour le moment</p>
                <p className="mt-1 text-sm text-[#6a6a6a]">Explorez un logement et envoyez une demande avec vos dates.</p>
                <Link href="/" className={`${btnSecondary} mt-5`}>Voir les logements</Link>
              </div>
            )}
            {bookings.map((booking) => (
              <article key={booking.id} className="rounded-[20px] border border-[#e5e5e5] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{booking.listing_title}</h3>
                    <p className="mt-1 text-sm text-[#6a6a6a]">
                      {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                    </p>
                  </div>
                  <span className={cx(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    booking.status === "confirmed" || booking.status === "completed"
                      ? "bg-[#e7f4f2] text-[#145e57]"
                      : booking.status === "declined" || booking.status === "cancelled"
                        ? "bg-[#f2f2f2] text-[#6a6a6a]"
                        : "bg-[#fff4dd] text-[#7a4c00]",
                  )}>
                    {STATUS[booking.status]}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#eeeeee] pt-4 text-sm">
                  <span className="text-[#6a6a6a]">Total voyageur</span>
                  <strong>{formatMoney(booking.total, booking.currency)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="rounded-[20px] border border-[#dddddd] p-6 shadow-[0_4px_16px_rgba(0,0,0,.06)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#1F6F66] font-semibold text-white">
              {(profile?.full_name || user.email || "A").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">Profil</p>
              <p className="flex items-center gap-1 text-xs text-[#6a6a6a]">
                {profile?.identity_status === "verifie" ? <BadgeCheck className="h-3.5 w-3.5 text-[#1F6F66]" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                {profile?.identity_status === "verifie" ? "Identité vérifiée" : "Identité à vérifier avant encaissement"}
              </p>
            </div>
          </div>
          <form className="mt-6 grid gap-4" onSubmit={saveProfile}>
            <label className="text-sm font-medium">
              Nom complet
              <input className={`${fieldClass} mt-1`} value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} required />
            </label>
            <label className="text-sm font-medium">
              Téléphone
              <input className={`${fieldClass} mt-1`} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+221 77 000 00 00" autoComplete="tel" />
            </label>
            <label className="text-sm font-medium">
              Utilisation principale
              <select className={`${fieldClass} mt-1`} value={accountType} onChange={(event) => setAccountType(event.target.value as AccountType)}>
                <option value="voyageur">Voyageur</option>
                <option value="proprietaire">Propriétaire</option>
                <option value="agence">Agence</option>
              </select>
            </label>
            {saved && <p className="text-sm text-[#145e57]">Profil enregistré.</p>}
            {error && <p role="alert" className="text-sm text-[#a52a12]">{error}</p>}
            <button className={`${btnPrimary} w-full`}>Enregistrer</button>
          </form>
          {(accountType === "proprietaire" || accountType === "agence") && (
            <Link href="/publier" className={`${btnSecondary} mt-3 w-full`}>Publier un bien</Link>
          )}
        </aside>
      </div>
    </div>
  );
}
