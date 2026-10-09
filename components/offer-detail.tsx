"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgeCheck, Clock3, MapPin, Star } from "lucide-react";
import { btnPrimary, btnSecondary, fieldClass, formatMoney } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { createOfferRequest } from "@/lib/supabase";
import type { Offer } from "@/lib/catalog";
import { MediaCarousel } from "./media-carousel";
import { Photo } from "./photo";

export function OfferDetail({ offer }: { offer: Offer }) {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [when, setWhen] = useState("");
  const [people, setPeople] = useState(2);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const back = offer.kind === "experience" ? "/experiences" : "/services";
  const backLabel = offer.kind === "experience" ? "Expériences" : "Services";

  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
    if (profile?.phone) setPhone(profile.phone);
  }, [profile]);

  async function requestOffer() {
    if (!user || !name.trim() || !when) return;
    setBusy(true);
    setError("");
    try {
      await createOfferRequest({
        userId: user.id,
        kind: offer.kind,
        offerKey: offer.id,
        offerTitle: offer.title,
        customerName: name,
        customerPhone: phone,
        preferredDate: when,
        people,
      });
      setSent(true);
    } catch {
      setError("Votre demande n’a pas pu être enregistrée. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="mx-auto max-w-[1120px] px-0 pb-36 md:px-6 md:pb-16 lg:pb-10">
      <div className="px-4 pt-4 md:px-0 md:pt-6">
        <Link href={back} className="text-sm underline">
          {backLabel}
        </Link>
        <h1 className="mt-3 text-[26px] font-semibold tracking-tight md:text-[32px]">{offer.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1 font-medium">
            <Star className="h-4 w-4 fill-current" />
            {offer.reviewsCount > 0 ? offer.rating.toFixed(2).replace(".", ",") : "Nouveau"}
          </span>
          {offer.reviewsCount > 0 && <span className="text-[#6a6a6a]">{offer.reviewsCount} avis</span>}
          <span className="inline-flex items-center gap-1 underline">
            <MapPin className="h-4 w-4" />
            {offer.neighborhood}, {offer.city}
          </span>
        </p>
      </div>

      <div className="mt-4 md:hidden">
        <MediaCarousel
          images={offer.images}
          alt={offer.title}
          ratio="h-[72vw] min-h-[280px] max-h-[520px]"
          radius="rounded-none"
          sizes="100vw"
          priority
          counter
        />
      </div>
      <div className="relative mt-4 hidden h-[min(52vh,480px)] gap-2 overflow-hidden rounded-[20px] md:grid md:grid-cols-4 md:grid-rows-2">
        {offer.images.slice(0, 5).map((image, index) => (
          <div
            key={`${image}-${index}`}
            className={`relative overflow-hidden ${index === 0 ? "col-span-2 row-span-2" : ""} ${
              offer.images.length <= 3 && index > 0 ? "col-span-2" : ""
            } ${offer.images.length === 4 && index === offer.images.length - 1 ? "col-span-2" : ""}`}
          >
            <Photo src={image} alt="" priority={index === 0} sizes={index === 0 ? "50vw" : "25vw"} />
          </div>
        ))}
      </div>

      <div className="mt-8 grid items-start gap-12 px-4 lg:grid-cols-[minmax(0,1.4fr)_380px] md:px-0">
        <div>
          <div className="border-b border-[#ebebeb] pb-6">
            <p className="text-xl font-semibold">
              {offer.kind === "experience" ? "Expérience" : "Service"} proposé par {offer.host}
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-[#6a6a6a]">
              <Clock3 className="h-4 w-4" />
              {offer.duration}
            </p>
          </div>
          <div className="border-b border-[#ebebeb] py-6">
            {offer.description.split("\n\n").map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="mt-3 text-[16px] leading-7 first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="py-6">
            <h2 className="text-xl font-semibold">Ce qui est inclus</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {offer.includes.map((item) => (
                <li key={item} className="flex items-center gap-2 text-[15px]">
                  <BadgeCheck className="h-4 w-4 text-[#1F6F66]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside id="reservation" className="rounded-[20px] border border-[#dddddd] p-6 shadow-[0_6px_16px_rgba(0,0,0,0.08)] lg:sticky lg:top-28">
          <p className="text-2xl font-semibold tracking-tight">
            {formatMoney(offer.price, offer.currency)}
            <span className="text-base font-normal text-[#222]"> {offer.unit}</span>
          </p>
          <div className="mt-4 grid gap-3">
            <label className="text-xs font-medium">
              Date souhaitée
              <input className={`${fieldClass} mt-1`} type="date" value={when} onChange={(event) => setWhen(event.target.value)} />
            </label>
            <label className="text-xs font-medium">
              Personnes
              <input
                className={`${fieldClass} mt-1`}
                type="number"
                min={1}
                max={12}
                value={people}
                onChange={(event) => setPeople(Number(event.target.value))}
              />
            </label>
            <label className="text-xs font-medium">
              Votre nom
              <input className={`${fieldClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom et prénom" />
            </label>
            <label className="text-xs font-medium">
              Téléphone
              <input className={`${fieldClass} mt-1`} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+221 77 000 00 00" autoComplete="tel" />
            </label>
          </div>
          {sent ? (
            <p className="mt-5 rounded-2xl bg-[#e7f4f2] px-4 py-3 text-sm leading-6 text-[#145e57]">
              Demande notée pour {offer.title}. {offer.host} revient vers vous avec le créneau.
            </p>
          ) : !user ? (
            <Link href={`/connexion?retour=${encodeURIComponent(pathname)}`} className={`${btnPrimary} mt-5 w-full py-3`}>
              Se connecter pour demander
            </Link>
          ) : (
            <button
              className={`${btnPrimary} mt-5 w-full py-3`}
              disabled={busy || !name.trim() || !when}
              onClick={() => void requestOffer()}
            >
              {busy ? "Enregistrement…" : offer.kind === "experience" ? "Demander l'expérience" : "Demander le service"}
            </button>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-[#a52a12]">{error}</p>}
          <p className="mt-3 text-center text-xs text-[#6a6a6a]">Aucun débit à cette étape. Le prix affiché est celui du catalogue.</p>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-[4.25rem] z-40 border-t border-[#ebebeb] bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold">{formatMoney(offer.price, offer.currency)}</p>
            <p className="text-xs text-[#6a6a6a]">{offer.unit}</p>
          </div>
          <a href="#reservation" className={`${btnSecondary} px-5 py-2.5`}>
            Réserver
          </a>
        </div>
      </div>
    </article>
  );
}
