"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Bath, BedDouble, Heart, MapPin, MessageCircle, Ruler, Share2, Star, X } from "lucide-react";
import { BookingCard } from "@/components/booking-card";
import { MapView } from "@/components/map";
import { MediaCarousel } from "@/components/media-carousel";
import { Photo } from "@/components/photo";
import { btnSecondary, formatDate, formatMoney, whatsappHref } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { hostById } from "@/lib/seed";
import { getOrCreateConversation, loadHostPublicProfile, setFavorite } from "@/lib/supabase";
import type { HostPublicProfile } from "@/lib/types";
import { useAmeena } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import { TYPE_LABEL } from "@/lib/labels";

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch, ready } = useAmeena();
  const { user } = useAuth();
  const listing = state.listings.find((item) => item.id === id);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [publicHost, setPublicHost] = useState<HostPublicProfile | null>(null);
  const [contactError, setContactError] = useState("");
  const [contactBusy, setContactBusy] = useState(false);
  useTitle(listing ? `${listing.title} · Se Loger au Sénégal` : "Logement · Se Loger au Sénégal");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLightbox(null);
      if (lightbox === null || !listing) return;
      if (event.key === "ArrowRight") setLightbox((value) => (value === null ? value : (value + 1) % listing.images.length));
      if (event.key === "ArrowLeft") {
        setLightbox((value) => (value === null ? value : (value - 1 + listing.images.length) % listing.images.length));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, listing]);

  useEffect(() => {
    if (!listing?.ownerUserId) {
      setPublicHost(null);
      return;
    }
    loadHostPublicProfile(listing.ownerUserId)
      .then(setPublicHost)
      .catch(() => setPublicHost(null));
  }, [listing?.ownerUserId]);

  if (!ready) {
    return <div className="px-6 py-24 text-center text-sm text-[#6a6a6a]">Chargement du logement…</div>;
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">Ce bien n&apos;est plus publié</h1>
        <Link href="/explorer" className={`${btnSecondary} mt-6`}>
          Retour à la carte
        </Link>
      </div>
    );
  }

  const host = listing.databaseId ? undefined : hostById(listing.hostId);
  const hostName = !listing.databaseId
    ? "catalogue de démonstration"
    : publicHost?.business_name || publicHost?.display_name || host?.name || "Hôte Se Loger au Sénégal";
  const images = listing.images.slice(0, 5);
  const saved = state.saved.includes(listing.id);
  const currentListing = listing;

  async function contactHost() {
    if (!user) {
      router.push(`/connexion?retour=${encodeURIComponent(`/logements/${currentListing.id}`)}`);
      return;
    }
    setContactBusy(true);
    setContactError("");
    try {
      const conversation = await getOrCreateConversation(currentListing, user.id);
      router.push(`/messages?conversation=${conversation.id}`);
    } catch (cause) {
      setContactError(cause instanceof Error ? cause.message : "Impossible d’ouvrir la conversation.");
    } finally {
      setContactBusy(false);
    }
  }

  async function toggleSaved() {
    dispatch({ type: "toggle-save", id: currentListing.id });
    if (!user) return;
    try {
      await setFavorite(user.id, currentListing.id, !saved);
    } catch {
      dispatch({ type: "toggle-save", id: currentListing.id });
    }
  }

  return (
    <article className="mx-auto max-w-[1120px] px-0 pb-36 pt-4 md:px-6 md:py-6 lg:pb-10">
      <div className="hidden px-4 md:block md:px-0">
      {!listing.databaseId && (
        <p className="mb-4 rounded-xl bg-[#fff4dd] px-4 py-3 text-sm font-medium text-[#7a4c00]">
          Offre de démonstration · disponibilité, propriétaire et dossier à confirmer avec notre équipe.
        </p>
      )}
      {listing.publicationStatus === "pending_review" && (
        <p className="mb-4 rounded-xl bg-[#fff4dd] px-4 py-3 text-sm text-[#7a4c00]">
          Annonce envoyée en validation. Elle n’est visible que dans votre espace tant que le contrôle n’est pas terminé.
        </p>
      )}
      <Link href="/explorer" className="text-sm underline">
        Explorer
      </Link>
      <h1 className="mt-3 text-[26px] font-semibold tracking-tight md:text-[32px]">{listing.title}</h1>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1 font-medium">
          <Star className="h-4 w-4 fill-current" />
          {listing.rating.toFixed(2).replace(".", ",")}
        </span>
        <span className="text-[#6a6a6a]">{listing.reviewsCount} avis</span>
        <span className="inline-flex items-center gap-1 underline">
          <MapPin className="h-4 w-4" />
          {listing.neighborhood}, {listing.city}, {listing.country}
        </span>
      </p>
      </div>

      <div className="relative mt-4 md:hidden">
        <MediaCarousel
          images={listing.images}
          alt={listing.title}
          ratio="h-[72vw] min-h-[280px] max-h-[520px]"
          radius="rounded-none"
          sizes="100vw"
          priority
          counter
          onOpen={(index) => setLightbox(index)}
        />
        <Link href="/" aria-label="Retour" className="absolute left-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="absolute right-4 top-4 z-20 flex gap-3">
          <button aria-label="Partager" onClick={() => void navigator.share?.({ title: listing.title, url: window.location.href })} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm"><Share2 className="h-5 w-5" /></button>
          <button aria-label={saved ? "Retirer des favoris" : "Enregistrer"} onClick={() => void toggleSaved()} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm"><Heart className={saved ? "h-5 w-5 fill-[#FF385C] text-[#FF385C]" : "h-5 w-5"} /></button>
        </div>
      </div>
      <section className="relative z-10 -mt-3 rounded-t-[30px] bg-white px-6 pb-2 pt-9 text-center md:hidden">
        <h1 className="text-[28px] font-semibold leading-[1.12] tracking-[-0.035em]">{listing.title}</h1>
        <p className="mt-5 text-[16px] text-[#6a6a6a]">
          {TYPE_LABEL[listing.type]} entier · {listing.neighborhood}, {listing.country}
        </p>
        <p className="mt-1 text-[15px] text-[#6a6a6a]">
          {listing.guests} voyageurs · {listing.bedrooms} chambre{listing.bedrooms > 1 ? "s" : ""} · {listing.beds} lits · {listing.baths} salles de bain
        </p>
        <div className="mt-7 grid grid-cols-3 divide-x divide-[#dddddd]">
          <div><p className="text-xl font-semibold">{listing.rating.toFixed(2).replace(".", ",")}</p><p className="text-xs">★★★★★</p></div>
          <div><p className="text-sm font-semibold">Coup de cœur</p><p className="mt-1 text-xs text-[#6a6a6a]">voyageurs</p></div>
          <div><p className="text-xl font-semibold">{listing.reviewsCount}</p><p className="text-xs underline">Commentaires</p></div>
        </div>
      </section>
      <div className="relative mt-4 hidden h-[min(52vh,480px)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[20px] md:grid">
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            className={`relative overflow-hidden ${index === 0 ? "col-span-2 row-span-2" : ""} ${
              images.length <= 3 && index > 0 ? "col-span-2" : ""
            } ${images.length === 4 && index === images.length - 1 ? "col-span-2" : ""}`}
            onClick={() => setLightbox(index)}
          >
            <Photo src={image} alt="" priority={index === 0} sizes={index === 0 ? "50vw" : "25vw"} />
          </button>
        ))}
        <button
          className="absolute bottom-4 right-4 rounded-lg border border-[#222] bg-white px-4 py-2 text-sm font-medium shadow-sm"
          onClick={() => setLightbox(0)}
        >
          Afficher les photos
        </button>
      </div>

      <div className="mt-8 grid items-start gap-12 px-4 lg:grid-cols-[minmax(0,1.4fr)_380px] md:px-0">
        <div>
          <div className="flex items-start justify-between gap-4 border-b border-[#ebebeb] pb-6">
            <div>
              <p className="text-xl font-semibold">
                {TYPE_LABEL[listing.type]} {listing.purpose === "vente" ? "à vendre" : listing.mode === "sejour" ? "entier" : "à louer"} · proposé par {hostName}
              </p>
              {publicHost?.certified && <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#16836f]"><BadgeCheck className="h-4 w-4" /> Profil certifié</p>}
              <p className="mt-1 text-sm text-[#6a6a6a]">
                {listing.guests} voyageurs · {listing.bedrooms} chambres · {listing.beds} lits · {listing.baths} salles d&apos;eau
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#1F6F66] text-sm font-semibold text-white">
              {hostName.slice(0, 1)}
            </div>
          </div>
          {listing.ownerUserId !== user?.id && (
            <div className="border-b border-[#ebebeb] py-5">
              <div className="flex flex-wrap gap-3">
                <button onClick={() => void contactHost()} disabled={contactBusy || !listing.databaseId} className={btnSecondary}>
                  {contactBusy ? "Ouverture…" : user ? "Écrire sur la plateforme" : "Se connecter pour écrire"}
                </button>
                {publicHost?.whatsapp_enabled && publicHost.whatsapp_e164 && (
                  <a
                    href={whatsappHref(publicHost.whatsapp_e164, listing.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#16836f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#116b5b]"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                )}
                {!listing.databaseId && (
                  <a
                    href={whatsappHref("+221788324069", listing.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#16836f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#116b5b]"
                  >
                    <MessageCircle className="h-4 w-4" /> Demander des informations à Se Loger au Sénégal
                  </a>
                )}
              </div>
              {!listing.databaseId && <p className="mt-2 text-xs text-[#6a6a6a]">La messagerie s’active sur les annonces publiées par les propriétaires.</p>}
              {contactError && <p role="alert" className="mt-2 text-sm text-[#a52a12]">{contactError}</p>}
            </div>
          )}
          {publicHost?.bio && <p className="border-b border-[#ebebeb] py-5 text-sm leading-6 text-[#6a6a6a]">{publicHost.bio}</p>}

          <ul className="grid gap-4 border-b border-[#ebebeb] py-6 sm:grid-cols-3">
            <Fact icon={<BedDouble className="h-5 w-5" />} title={`${listing.bedrooms} chambres`} text={`${listing.surface} m²`} />
            <Fact icon={<Bath className="h-5 w-5" />} title={`${listing.baths} salles d'eau`} text="Comptées dans l'état des lieux" />
            <Fact icon={<Ruler className="h-5 w-5" />} title={listing.managedByPlatform ? "Géré par Se Loger au Sénégal" : "En direct"} text={listing.managedByPlatform ? "Accueil, linge, incidents" : host?.kind === "agence" ? "Agence identifiée" : "Propriétaire identifié"} />
          </ul>

          <div className="border-b border-[#ebebeb] py-6">
            {listing.description.split("\n\n").map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="mt-3 text-[16px] leading-7 first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="border-b border-[#ebebeb] py-6">
            <h2 className="text-xl font-semibold">Ce que propose ce logement</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {listing.amenities.map((amenity) => (
                <li key={amenity} className="flex items-center gap-2 text-[15px]">
                  <BadgeCheck className="h-4 w-4 text-[#1F6F66]" />
                  {amenity}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-b border-[#ebebeb] py-6">
            <h2 className="text-xl font-semibold">Où se trouve le bien</h2>
            <p className="mt-1 text-sm text-[#6a6a6a]">{listing.neighborhood}, {listing.city}</p>
            <div className="mt-4 h-80 overflow-hidden rounded-2xl">
              <MapView listings={[listing]} activeId={listing.id} />
            </div>
          </div>

          <div className="py-6">
            <h2 className="text-xl font-semibold">Avis</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {listing.reviews.map((review) => (
                <figure key={review.id} className="rounded-2xl bg-[#f7f7f7] p-4">
                  <figcaption className="text-sm font-semibold">
                    {review.name} · <span className="font-normal text-[#6a6a6a]">{formatDate(review.date)}</span>
                  </figcaption>
                  <blockquote className="mt-2 text-sm leading-6">{review.text}</blockquote>
                </figure>
              ))}
            </div>
          </div>
        </div>
        {listing.purpose === "vente" ? (
          <aside id="reservation" className="rounded-[24px] border border-[#dddddd] p-6 shadow-[0_8px_28px_rgba(0,0,0,.08)]">
            <p className="text-sm text-[#6a6a6a]">Prix de vente</p>
            <p className="mt-1 text-2xl font-semibold">{formatMoney(listing.price, listing.currency)}</p>
            <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">Demandez le dossier du bien, les informations foncières et une visite. Aucun paiement de vente n’est encaissé en ligne.</p>
            <button onClick={() => void contactHost()} disabled={contactBusy || !listing.databaseId} className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#FF4845] px-5 py-3 text-sm font-semibold text-white">
              {contactBusy ? "Ouverture…" : "Demander le dossier"}
            </button>
            <a href="https://wa.me/221788324069?text=Bonjour%2C%20je%20souhaite%20des%20informations%20sur%20un%20bien%20%C3%A0%20vendre." target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#dddddd] px-5 py-3 text-sm font-semibold">
              <MessageCircle className="h-4 w-4" /> Assistance WhatsApp
            </a>
          </aside>
        ) : <BookingCard listing={listing} />}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ebebeb] bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold">{formatMoney(listing.price, listing.currency)}</p>
            <p className="text-xs text-[#6a6a6a]">{listing.purpose === "vente" ? "prix de vente" : listing.mode === "sejour" ? "par nuit" : "par mois"}</p>
          </div>
          <a href="#reservation" className="inline-flex items-center justify-center rounded-full bg-[#FF385C] px-7 py-3 text-sm font-semibold text-white">
            {!listing.databaseId ? "Voir les détails" : listing.purpose === "vente" ? "Contacter" : listing.mode === "sejour" ? "Réserver" : "Demander"}
          </a>
        </div>
      </div>

      {lightbox !== null && (
        <div className="fixed inset-0 z-[1400] bg-black" role="dialog" aria-modal>
          <button className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white" onClick={() => setLightbox(null)} aria-label="Fermer">
            <X />
          </button>
          <div className="flex h-full items-center px-2 md:px-16">
            <MediaCarousel
              images={listing.images}
              alt={listing.title}
              ratio="h-[78vh] w-full"
              radius="rounded-none"
              sizes="100vw"
              priority
              counter
              index={lightbox}
              onIndexChange={setLightbox}
            />
          </div>
        </div>
      )}
    </article>
  );
}

function Fact({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5">{icon}</span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-sm text-[#6a6a6a]">{text}</span>
      </span>
    </li>
  );
}
