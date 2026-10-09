"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, MapPinned, Plane } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { btnPrimary, formatDate, formatMoney } from "@/lib/format";
import { loadMyBookings } from "@/lib/supabase";
import type { MarketBooking } from "@/lib/types";
import { useTitle } from "@/lib/use-title";

export default function TripsPage() {
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<MarketBooking[]>([]);
  const [loaded, setLoaded] = useState(false);
  useTitle("Voyages · Ameena");

  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    loadMyBookings()
      .then((rows) => setBookings(rows.filter((booking) => !["declined", "cancelled", "expired"].includes(booking.status))))
      .finally(() => setLoaded(true));
  }, [user]);

  if (loading || !loaded) return <p className="p-8 text-sm text-[#6a6a6a]">Chargement de vos voyages…</p>;

  return (
    <main className="mobile-page px-4 py-7 md:px-10 lg:py-12 xl:px-16">
      <h1 className="text-[30px] font-semibold tracking-[-0.04em]">Voyages</h1>
      {bookings.length > 0 ? (
        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-[24px] border border-[#e5e5e5] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{booking.listing_title}</h2>
                  <p className="mt-1 text-sm text-[#6a6a6a]">{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</p>
                </div>
                <CalendarDays className="h-5 w-5 text-[#A77D12]" />
              </div>
              <p className="mt-5 border-t border-[#eeeeee] pt-4 text-sm font-semibold">{formatMoney(booking.total, booking.currency)}</p>
            </article>
          ))}
        </div>
      ) : (
        <section className="relative mx-auto mt-8 min-h-[520px] max-w-2xl overflow-hidden rounded-[30px] bg-[#f4f7f7] px-6 py-14 text-center">
          <MapPinned className="absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 text-[#d5dfde]" strokeWidth={0.7} />
          <div className="relative mx-auto mt-14 grid h-28 w-28 place-items-center rounded-full bg-white shadow-[0_12px_30px_rgba(0,0,0,.1)]">
            <Plane className="h-12 w-12 -rotate-12 text-[#A77D12]" />
          </div>
          <div className="relative mt-12">
            <h2 className="text-2xl font-semibold">Préparez votre prochain voyage</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-[#6a6a6a]">
              Après avoir réservé un logement, une expérience ou un transfert, vous retrouverez ici toutes les informations utiles.
            </p>
            <Link href={user ? "/" : "/connexion?retour=/voyages"} className={`${btnPrimary} mt-6`}>
              {user ? "Commencer" : "Se connecter"}
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
