"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Wrench, X } from "lucide-react";
import { LocationSearchInput } from "@/components/location-search-input";
import { ProfessionalCard } from "@/components/professional-card";
import { useAuth } from "@/lib/auth";
import { fieldClass } from "@/lib/format";
import {
  DEMO_PROFESSIONALS,
  PROFESSIONAL_CATEGORIES,
  professionalCategoryLabel,
  type Professional,
} from "@/lib/professionals";
import { loadPartnerProducts, loadPublishedPartners, submitPartnerApplication } from "@/lib/supabase";
import type { MarketplacePartner, PartnerCategory, PartnerProduct } from "@/lib/types";
import { useTitle } from "@/lib/use-title";

function fromDatabase(partner: MarketplacePartner, products: PartnerProduct[]): Professional {
  const partnerProducts = products.filter((item) => item.partner_id === partner.id);
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
    services: partnerProducts.map((item) => item.name),
    portfolio: partnerProducts.flatMap((item) => item.image_url ? [item.image_url] : []),
    reviews: [],
  };
}

function ServicesContent() {
  const params = useSearchParams();
  const { user } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>(DEMO_PROFESSIONALS);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState<PartnerCategory | "tous">(
    (params.get("categorie") as PartnerCategory | null) ?? "tous",
  );
  const [radius, setRadius] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(params.get("rejoindre") === "1");
  const [application, setApplication] = useState({
    businessName: "",
    category: "artisan" as PartnerCategory,
    city: "Dakar",
    phone: "",
    message: "",
  });
  const [applicationStatus, setApplicationStatus] = useState("");
  const [busy, setBusy] = useState(false);
  useTitle("Services immobiliers · Se Loger au Sénégal");

  useEffect(() => {
    loadPublishedPartners()
      .then(async (partners) => {
        const products = await loadPartnerProducts(partners.map((partner) => partner.id));
        setProfessionals([...partners.map((partner) => fromDatabase(partner, products)), ...DEMO_PROFESSIONALS]);
      })
      .catch(() => setProfessionals(DEMO_PROFESSIONALS));
  }, []);

  const visible = useMemo(() => professionals.filter((professional) => {
    const search = `${professional.businessName} ${professional.categoryLabel} ${professional.description} ${professional.services.join(" ")}`.toLowerCase();
    if (query.trim() && !query.toLowerCase().split(/\s+/).every((term) => search.includes(term))) return false;
    if (city.trim() && !`${professional.city} ${professional.address}`.toLowerCase().includes(city.toLowerCase())) return false;
    if (category !== "tous" && professional.category !== category) return false;
    if (verifiedOnly && !professional.verified) return false;
    if (radius && professional.serviceRadiusKm < Number(radius)) return false;
    return true;
  }), [category, city, professionals, query, radius, verifiedOnly]);

  async function apply(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setApplicationStatus("");
    try {
      await submitPartnerApplication({
        userId: user.id,
        businessName: application.businessName,
        category: application.category,
        city: application.city,
        phone: application.phone,
        message: application.message,
      });
      setApplicationStatus("Votre candidature a été transmise. Notre équipe vous contactera avant toute publication.");
    } catch {
      setApplicationStatus("La candidature n’a pas pu être envoyée. Vérifiez les informations puis réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-surface mobile-page">
      <section className="section-champagne px-4 pb-9 pt-8 md:px-10 lg:py-12 xl:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[.14em] text-[#C13515]">Réseau immobilier</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="premium-title text-3xl md:text-4xl">Trouvez le bon professionnel, près de votre bien.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6a6a6a]">
                Construction, maintenance, topographie, nettoyage, sécurité et conciergerie : des profils contrôlés,
                leurs prestations et un contact direct.
              </p>
            </div>
            <button onClick={() => setJoinOpen((value) => !value)} className="rounded-full border border-[#222] bg-white px-5 py-3 text-sm font-semibold">
              Référencer mon activité
            </button>
          </div>

          <div className="mt-7">
            <div className="flex items-center gap-2">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a6a6a]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Plombier, géomètre, nettoyage…"
                  className={`${fieldClass} h-12 rounded-full pl-11 shadow-sm`}
                />
              </label>
              <button
                type="button"
                onClick={() => setFiltersOpen((value) => !value)}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-[#dddddd] bg-white px-4 text-sm font-semibold shadow-sm"
                aria-label="Afficher les filtres"
                aria-expanded={filtersOpen}
              >
                {filtersOpen ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
                <span className="hidden sm:inline">Filtres</span>
              </button>
            </div>
            {filtersOpen && (
              <div className="mt-3 grid gap-3 rounded-[22px] border border-[#dddddd] bg-white p-4 shadow-lg sm:grid-cols-2 lg:grid-cols-4">
                <LocationSearchInput value={city} onChange={setCity} placeholder="Ville ou quartier" className={fieldClass} />
                <select value={category} onChange={(event) => setCategory(event.target.value as PartnerCategory | "tous")} className={fieldClass}>
                  {PROFESSIONAL_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <select value={radius} onChange={(event) => setRadius(event.target.value)} className={fieldClass}>
                  <option value="">Toute zone d’intervention</option>
                  <option value="10">Intervient à 10 km ou plus</option>
                  <option value="30">Intervient à 30 km ou plus</option>
                  <option value="60">Intervient à 60 km ou plus</option>
                </select>
                <label className="flex items-center gap-2 rounded-xl bg-[#FFF8ED] px-3 text-sm font-semibold">
                  <input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} className="accent-[#FF4845]" />
                  Profils vérifiés
                </label>
              </div>
            )}
          </div>

          <nav className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" aria-label="Catégories de services">
            {PROFESSIONAL_CATEGORIES.map((item) => (
              <button
                key={item.value}
                onClick={() => setCategory(item.value)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm ${category === item.value ? "border-[#222] bg-[#222] font-semibold text-white" : "border-[#dddddd] bg-white"}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      {joinOpen && (
        <section className="section-ivory px-4 py-8 md:px-10 xl:px-16">
          <div className="mx-auto max-w-3xl rounded-[28px] border border-[#eadfcb] bg-white p-6">
            <h2 className="text-2xl font-semibold">Rejoindre le réseau professionnel</h2>
            <p className="mt-2 text-sm leading-6 text-[#6a6a6a]">Chaque activité est contrôlée par notre équipe avant d’être visible publiquement.</p>
            {!user ? (
              <Link href="/connexion?retour=%2Fservices%3Frejoindre%3D1" className="mt-5 inline-flex rounded-full bg-[#FF385C] px-5 py-3 text-sm font-semibold text-white">
                Se connecter pour candidater
              </Link>
            ) : (
              <form onSubmit={apply} className="mt-5 grid gap-3 sm:grid-cols-2">
                <input required minLength={2} className={fieldClass} placeholder="Nom de l’activité" value={application.businessName} onChange={(event) => setApplication((value) => ({ ...value, businessName: event.target.value }))} />
                <select className={fieldClass} value={application.category} onChange={(event) => setApplication((value) => ({ ...value, category: event.target.value as PartnerCategory }))}>
                  {PROFESSIONAL_CATEGORIES.filter((item) => item.value !== "tous").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <input required className={fieldClass} placeholder="Ville" value={application.city} onChange={(event) => setApplication((value) => ({ ...value, city: event.target.value }))} />
                <input required className={fieldClass} placeholder="+221 77 000 00 00" value={application.phone} onChange={(event) => setApplication((value) => ({ ...value, phone: event.target.value }))} />
                <textarea className={`${fieldClass} min-h-24 sm:col-span-2`} placeholder="Vos services, références et zone d’intervention" value={application.message} onChange={(event) => setApplication((value) => ({ ...value, message: event.target.value }))} />
                <button disabled={busy} className="rounded-full bg-[#222] px-5 py-3 text-sm font-semibold text-white sm:col-span-2">{busy ? "Envoi…" : "Envoyer ma candidature"}</button>
              </form>
            )}
            {applicationStatus && <p className="mt-3 text-sm">{applicationStatus}</p>}
          </div>
        </section>
      )}

      <section className="section-pearl px-4 py-10 md:px-10 xl:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="premium-title text-2xl">Professionnels disponibles</h2>
              <p className="mt-1 text-sm text-[#6a6a6a]">{visible.length} profil{visible.length > 1 ? "s" : ""}</p>
            </div>
            <Wrench className="h-6 w-6 text-[#C13515]" />
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((professional) => <ProfessionalCard key={professional.id} professional={professional} />)}
          </div>
          {visible.length === 0 && <p className="rounded-[24px] bg-white p-10 text-center text-sm text-[#6a6a6a]">Aucun professionnel ne correspond encore à cette recherche.</p>}
        </div>
      </section>
    </main>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-[#6a6a6a]">Ouverture de l’annuaire…</div>}>
      <ServicesContent />
    </Suspense>
  );
}
