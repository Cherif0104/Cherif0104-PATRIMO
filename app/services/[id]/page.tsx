"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, MapPin, MessageCircle, ShieldCheck, Star } from "lucide-react";
import { MediaCarousel } from "@/components/media-carousel";
import { Photo } from "@/components/photo";
import { useAuth } from "@/lib/auth";
import { fieldClass, formatDate, whatsappHref } from "@/lib/format";
import {
  DEMO_PROFESSIONALS,
  professionalCategoryLabel,
  type Professional,
} from "@/lib/professionals";
import { loadPartnerProducts, loadPartnerReviews, loadPublishedPartners, savePartnerReview } from "@/lib/supabase";
import type { MarketplacePartner, PartnerProduct, PartnerReview } from "@/lib/types";
import { useTitle } from "@/lib/use-title";

function fromDatabase(partner: MarketplacePartner, products: PartnerProduct[]): Professional {
  const ownProducts = products.filter((item) => item.partner_id === partner.id);
  return {
    id: partner.id,
    databaseId: partner.id,
    businessName: partner.business_name,
    category: partner.category,
    categoryLabel: professionalCategoryLabel(partner.category),
    city: partner.city,
    address: partner.address,
    serviceRadiusKm: partner.service_radius_km,
    description: partner.description,
    image: partner.image_url || "/brand/mark.png",
    verified: partner.verified,
    whatsapp: partner.whatsapp_e164 || partner.phone || "",
    services: ownProducts.map((item) => item.name),
    portfolio: ownProducts.flatMap((item) => item.image_url ? [item.image_url] : []),
    reviews: [],
  };
}

export default function ProfessionalPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const initial = DEMO_PROFESSIONALS.find((item) => item.id === id) ?? null;
  const [professional, setProfessional] = useState<Professional | null>(initial);
  const [reviews, setReviews] = useState<PartnerReview[]>([]);
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [loaded, setLoaded] = useState(Boolean(initial));
  useTitle(professional ? `${professional.businessName} · Services immobiliers` : "Professionnel immobilier");

  useEffect(() => {
    if (initial) return;
    loadPublishedPartners()
      .then(async (partners) => {
        const partner = partners.find((item) => item.id === id);
        if (!partner) return null;
        const products = await loadPartnerProducts([partner.id]);
        return fromDatabase(partner, products);
      })
      .then(setProfessional)
      .finally(() => setLoaded(true));
  }, [id, initial]);

  useEffect(() => {
    if (!professional?.databaseId) {
      setReviews([]);
      return;
    }
    loadPartnerReviews(professional.databaseId).then(setReviews).catch(() => setReviews([]));
  }, [professional?.databaseId]);

  const images = useMemo(() => professional ? [professional.image, ...professional.portfolio].filter((value, index, all) => all.indexOf(value) === index) : [], [professional]);

  if (!loaded) return <div className="p-10 text-sm text-[#6a6a6a]">Chargement du profil…</div>;
  if (!professional) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">Ce professionnel n’est plus référencé</h1>
        <Link href="/services" className="mt-6 inline-flex rounded-full border border-[#222] px-5 py-3 text-sm font-semibold">Retour aux services</Link>
      </main>
    );
  }

  const contact = professional.whatsapp
    ? whatsappHref(professional.whatsapp, `${professional.businessName} — ${professional.categoryLabel}`)
    : "";

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !professional?.databaseId || reviewBody.trim().length < 20) return;
    setReviewBusy(true);
    setReviewStatus("");
    try {
      const review = await savePartnerReview({
        partnerId: professional.databaseId,
        authorId: user.id,
        rating,
        body: reviewBody,
      });
      setReviews((rows) => [review, ...rows.filter((item) => item.id !== review.id && item.author_id !== user.id)]);
      setReviewBody("");
      setReviewStatus("Votre avis est publié.");
    } catch {
      setReviewStatus("Votre avis n’a pas pu être publié.");
    } finally {
      setReviewBusy(false);
    }
  }

  return (
    <article className="app-surface mx-auto max-w-[1120px] px-0 pb-32 pt-4 md:px-6 md:py-8 lg:pb-12">
      <div className="px-4 md:px-0">
        <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" /> Tous les services
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.12em] text-[#C13515]">{professional.categoryLabel}</p>
            <h1 className="premium-title mt-1 text-3xl md:text-4xl">{professional.businessName}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#6a6a6a]">
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {professional.address}</span>
              <span>Intervention dans un rayon de {professional.serviceRadiusKm} km</span>
            </p>
          </div>
          <div className="flex gap-2">
            {professional.demonstration && <span className="rounded-full bg-[#fff4dd] px-3 py-2 text-xs font-semibold text-[#7a4c00]">Profil de démonstration</span>}
            {professional.verified && <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f4f2] px-3 py-2 text-xs font-semibold text-[#145e57]"><BadgeCheck className="h-4 w-4" /> Vérifié</span>}
          </div>
        </div>
      </div>

      <div className="mt-6 md:hidden">
        <MediaCarousel images={images} alt={professional.businessName} ratio="h-[72vw] min-h-[280px]" radius="rounded-none" sizes="100vw" counter />
      </div>
      <div className="mt-6 hidden h-[440px] grid-cols-2 gap-2 overflow-hidden rounded-[24px] md:grid">
        {images.slice(0, 3).map((image, index) => (
          <div key={image} className={`relative overflow-hidden ${index === 0 ? "row-span-2" : ""}`}>
            <Photo src={image} alt={index === 0 ? professional.businessName : ""} sizes={index === 0 ? "50vw" : "25vw"} />
          </div>
        ))}
      </div>

      <div className="mt-8 grid items-start gap-10 px-4 md:px-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <section className="border-b border-[#ebebeb] pb-7">
            <h2 className="text-2xl font-semibold">À propos</h2>
            <p className="mt-3 text-base leading-7 text-[#6a6a6a]">{professional.description}</p>
          </section>
          <section className="border-b border-[#ebebeb] py-7">
            <h2 className="text-2xl font-semibold">Prestations</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {professional.services.map((service) => (
                <li key={service} className="flex items-center gap-2 rounded-2xl bg-[#f7f7f7] px-4 py-3 text-sm font-medium">
                  <BadgeCheck className="h-4 w-4 text-[#16836f]" /> {service}
                </li>
              ))}
            </ul>
          </section>
          <section className="py-7">
            <h2 className="text-2xl font-semibold">Avis clients</h2>
            {professional.reviews.length > 0 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {professional.reviews.map((review) => (
                  <figure key={review.id} className="rounded-[22px] bg-[#f7f7f7] p-4">
                    <figcaption className="flex items-center justify-between gap-3 text-sm font-semibold">
                      {review.name}
                      <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-current" /> {review.rating}</span>
                    </figcaption>
                    <blockquote className="mt-2 text-sm leading-6 text-[#6a6a6a]">{review.text}</blockquote>
                  </figure>
                ))}
              </div>
            )}
            {reviews.length > 0 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {reviews.map((review) => (
                  <figure key={review.id} className="rounded-[22px] bg-[#f7f7f7] p-4">
                    <figcaption className="flex items-center justify-between gap-3 text-sm font-semibold">
                      Client de la plateforme
                      <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-current" /> {review.rating}</span>
                    </figcaption>
                    <blockquote className="mt-2 text-sm leading-6 text-[#6a6a6a]">{review.body}</blockquote>
                    <p className="mt-2 text-xs text-[#8a8a8a]">{formatDate(review.created_at)}</p>
                  </figure>
                ))}
              </div>
            )}
            {professional.reviews.length === 0 && reviews.length === 0 && <p className="mt-3 text-sm text-[#6a6a6a]">Aucun avis public pour le moment.</p>}
            {professional.databaseId && (
              user ? (
                <form onSubmit={submitReview} className="mt-6 rounded-[22px] border border-[#ebebeb] p-4">
                  <h3 className="font-semibold">Partager votre expérience</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr]">
                    <select className={fieldClass} value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                      <option value={5}>5 · Excellent</option>
                      <option value={4}>4 · Très bien</option>
                      <option value={3}>3 · Bien</option>
                      <option value={2}>2 · Moyen</option>
                      <option value={1}>1 · Décevant</option>
                    </select>
                    <textarea className={`${fieldClass} min-h-24`} minLength={20} maxLength={1200} required value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} placeholder="Décrivez la prestation, les délais et le résultat…" />
                  </div>
                  <button disabled={reviewBusy || reviewBody.trim().length < 20} className="mt-3 rounded-full bg-[#222] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                    {reviewBusy ? "Publication…" : "Publier mon avis"}
                  </button>
                  {reviewStatus && <p className="mt-2 text-sm">{reviewStatus}</p>}
                </form>
              ) : (
                <Link href={`/connexion?retour=${encodeURIComponent(`/services/${professional.id}`)}`} className="mt-5 inline-flex text-sm font-semibold underline">
                  Se connecter pour publier un avis
                </Link>
              )
            )}
          </section>
        </div>

        <aside className="rounded-[26px] border border-[#dddddd] bg-white p-6 shadow-[0_8px_28px_rgba(0,0,0,.08)] lg:sticky lg:top-28">
          <ShieldCheck className="h-7 w-7 text-[#16836f]" />
          <h2 className="mt-3 text-xl font-semibold">{professional.verified ? "Profil contrôlé" : "Profil référencé"}</h2>
          <p className="mt-2 text-sm leading-6 text-[#6a6a6a]">
            Vérifiez le devis, le périmètre et les assurances nécessaires avant le début de la prestation.
          </p>
          {professional.demonstration && (
            <p className="mt-3 rounded-2xl bg-[#fff4dd] px-3 py-2 text-xs leading-5 text-[#7a4c00]">
              Ce profil illustre le service. Le bouton contacte l’équipe Se Loger au Sénégal, pas un prestataire fictif.
            </p>
          )}
          {contact && (
            <a href={contact} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#16836f] px-5 py-3 text-sm font-semibold text-white">
              <MessageCircle className="h-4 w-4" /> Contacter sur WhatsApp
            </a>
          )}
        </aside>
      </div>
    </article>
  );
}
