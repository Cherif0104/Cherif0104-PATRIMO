"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, LocateFixed, MapPin, MessageCircle, Search, Store } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fieldClass, formatMoney } from "@/lib/format";
import { loadPartnerProducts, loadPublishedPartners, submitPartnerApplication } from "@/lib/supabase";
import type { MarketplacePartner, PartnerCategory, PartnerProduct } from "@/lib/types";

const categories: Array<{ value: "" | PartnerCategory; label: string }> = [
  { value: "", label: "Tous les métiers" },
  { value: "artisan", label: "Artisans" },
  { value: "blanchisserie", label: "Blanchisserie" },
  { value: "demenagement", label: "Déménagement" },
  { value: "mobilite", label: "Taxi et mobilité" },
  { value: "securite", label: "Sécurité" },
  { value: "assurance", label: "Assurance" },
  { value: "ameublement", label: "Ameublement" },
  { value: "entretien", label: "Entretien" },
  { value: "juridique", label: "Juridique et foncier" },
];

export default function PartnersPage() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<MarketplacePartner[]>([]);
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"" | PartnerCategory>("");
  const [radius, setRadius] = useState(15);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [applicationCategory, setApplicationCategory] = useState<PartnerCategory>("artisan");
  const [city, setCity] = useState("Dakar");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("candidater") === "1") setFormOpen(true);
    loadPublishedPartners()
      .then(async (rows) => {
        setPartners(rows);
        setProducts(await loadPartnerProducts(rows.map((row) => row.id)));
      })
      .catch(() => setStatus("Le catalogue des partenaires est momentanément indisponible."))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => partners
    .map((partner) => ({
      partner,
      distance: position ? distanceKm(position, partner) : null,
    }))
    .filter(({ partner, distance }) => {
      const text = `${partner.business_name} ${partner.category} ${partner.description} ${partner.city}`.toLowerCase();
      if (query.trim() && !text.includes(query.toLowerCase().trim())) return false;
      if (category && partner.category !== category) return false;
      if (distance !== null && distance > Math.min(radius, partner.service_radius_km)) return false;
      return true;
    })
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999)), [partners, query, category, position, radius]);

  function locate() {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n’est pas disponible sur cet appareil.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => setLocationError("Autorisez la position pour filtrer les professionnels à proximité."),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  async function apply(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setStatus("");
    try {
      await submitPartnerApplication({
        userId: user.id,
        businessName,
        category: applicationCategory,
        city,
        phone,
        message,
      });
      setStatus("Votre candidature a été transmise à l’équipe de vérification.");
      setFormOpen(false);
    } catch {
      setStatus("La candidature n’a pas pu être transmise.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f8] px-4 py-8 md:px-10 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[30px] bg-[#182A39] p-6 text-white md:p-10">
          <p className="text-sm font-bold uppercase tracking-[.14em] text-[#FFB21F]">Écosystème immobilier</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-[-.045em] md:text-6xl">Professionnels et boutiques autour du logement.</h1>
              <p className="mt-4 max-w-2xl text-white/70">Artisans, entretien, mobilité, assurance, ameublement et accompagnement foncier vérifiés.</p>
            </div>
            <button onClick={() => setFormOpen((value) => !value)} className="rounded-full bg-[#FF4845] px-5 py-3 text-sm font-semibold">Référencer mon activité</button>
          </div>
        </section>

        {formOpen && (
          <section className="mt-5 rounded-[24px] border border-[#e5e5e5] bg-white p-5">
            <h2 className="text-xl font-bold">Candidature partenaire</h2>
            {!user ? (
              <p className="mt-3 text-sm text-[#6a6a6a]">Créez un compte pour transmettre une candidature traçable. <Link href="/connexion?retour=/partenaires?candidater=1" className="font-semibold underline">Créer mon compte</Link></p>
            ) : (
              <form onSubmit={apply} className="mt-4 grid gap-3 md:grid-cols-2">
                <input className={fieldClass} value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Nom de l’activité" minLength={2} required />
                <select className={fieldClass} value={applicationCategory} onChange={(event) => setApplicationCategory(event.target.value as PartnerCategory)}>
                  {categories.filter((item) => item.value).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  <option value="autre">Autre métier immobilier</option>
                </select>
                <input className={fieldClass} value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ville" required />
                <input className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+221 77 000 00 00" required />
                <textarea className={`${fieldClass} min-h-24 md:col-span-2`} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Décrivez vos services, votre zone et vos références." />
                <button className="rounded-full bg-[#182A39] px-5 py-3 text-sm font-semibold text-white md:col-span-2">Envoyer pour vérification</button>
              </form>
            )}
          </section>
        )}

        <section className="sticky top-20 z-20 mt-6 grid gap-3 rounded-[24px] border border-[#e5e5e5] bg-white/95 p-4 shadow-sm backdrop-blur md:grid-cols-[1fr_220px_170px_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a6a6a]" />
            <input className={`${fieldClass} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Plombier, blanchisserie, taxi…" />
          </label>
          <select className={fieldClass} value={category} onChange={(event) => setCategory(event.target.value as "" | PartnerCategory)}>
            {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select className={fieldClass} value={radius} onChange={(event) => setRadius(Number(event.target.value))} disabled={!position}>
            {[5, 10, 15, 30, 60].map((value) => <option key={value} value={value}>Rayon {value} km</option>)}
          </select>
          <button onClick={locate} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dddddd] px-4 py-2 text-sm font-semibold">
            <LocateFixed className="h-4 w-4" /> {position ? "Position active" : "Autour de moi"}
          </button>
        </section>
        {locationError && <p className="mt-2 text-sm text-[#a52a12]">{locationError}</p>}
        {status && <p className="mt-3 rounded-xl bg-white px-4 py-3 text-sm">{status}</p>}

        <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ partner, distance }) => {
            const partnerProducts = products.filter((product) => product.partner_id === partner.id).slice(0, 3);
            const whatsapp = partner.whatsapp_e164?.replace(/\D/g, "");
            return (
              <article key={partner.id} className="overflow-hidden rounded-[24px] border border-[#e5e5e5] bg-white">
                <div className="h-44 bg-[#eef1f1]">
                  {partner.image_url ? <img src={partner.image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Store className="h-12 w-12 text-[#aab4b8]" /></div>}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.12em] text-[#FF4845]">{partner.category}</p>
                      <h2 className="mt-1 text-xl font-bold text-[#182A39]">{partner.business_name}</h2>
                    </div>
                    {partner.verified && <BadgeCheck className="h-5 w-5 text-[#16836f]" aria-label="Partenaire vérifié" />}
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#6a6a6a]">{partner.description}</p>
                  <p className="mt-3 flex items-center gap-1 text-xs text-[#6a6a6a]"><MapPin className="h-3.5 w-3.5" /> {partner.address}, {partner.city}{distance !== null ? ` · ${distance.toFixed(1)} km` : ""}</p>
                  {partnerProducts.length > 0 && <div className="mt-4 grid gap-2">{partnerProducts.map((product) => <div key={product.id} className="flex justify-between gap-3 rounded-xl bg-[#f7f8f8] px-3 py-2 text-sm"><span>{product.name}</span>{product.price !== null && <strong>{formatMoney(product.price, product.currency)}</strong>}</div>)}</div>}
                  <div className="mt-5 flex gap-2">
                    {whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Bonjour ${partner.business_name}, je vous contacte depuis Se Loger au Sénégal.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#16836f] px-4 py-2.5 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
                    {partner.phone && <a href={`tel:${partner.phone}`} className="inline-flex items-center justify-center rounded-full border border-[#dddddd] px-4 py-2.5 text-sm font-semibold">Appeler</a>}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
        {!loading && visible.length === 0 && <p className="mt-10 rounded-[24px] border border-dashed border-[#cccccc] bg-white p-10 text-center text-[#6a6a6a]">Aucun partenaire ne correspond encore à cette recherche.</p>}
      </div>
    </main>
  );
}

function distanceKm(origin: { lat: number; lng: number }, target: { lat: number; lng: number }) {
  const toRad = (value: number) => value * Math.PI / 180;
  const earth = 6371;
  const dLat = toRad(target.lat - origin.lat);
  const dLng = toRad(target.lng - origin.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(origin.lat)) * Math.cos(toRad(target.lat)) * Math.sin(dLng / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
