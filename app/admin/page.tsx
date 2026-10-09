"use client";

import { useEffect, useState } from "react";
import { Photo } from "@/components/photo";
import { PageHead, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { QuoteView } from "@/components/quote-view";
import { btnPrimary, btnSecondary, fieldClass, uid } from "@/lib/format";
import { readImage } from "@/lib/images";
import { PLACEMENT_LABEL } from "@/lib/labels";
import type { Offer } from "@/lib/catalog";
import { buildQuote } from "@/lib/quote";
import {
  createAdminOffer,
  loadListingsForReview,
  loadOfferRequests,
  loadOffersForReview,
  loadVerificationRequests,
  loadVerificationDocuments,
  getVerificationDocumentUrl,
  reviewListing,
  reviewOffer,
  reviewVerificationRequest,
  savePlatformSettings,
  startAgencyOnboarding,
  updateOfferRequestStatus,
} from "@/lib/supabase";
import { useAmeena } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import type { Ad, AdPlacement, CommissionRule, Listing, OfferRequest, Payer, Promo, VerificationRequest } from "@/lib/types";

export default function AdminPage() {
  const { state, dispatch, storageWarning, ready } = useAmeena();
  const { user } = useAuth();
  const [settingsStatus, setSettingsStatus] = useState("");
  const { settings, listings } = state;
  const villa = listings.find((item) => item.id === "villa-almadies") ?? listings.find((item) => item.mode === "sejour");
  const flat = listings.find((item) => item.id === "mermoz") ?? listings.find((item) => item.mode === "location");
  useTitle("Réglages · Se Loger au Sénégal");

  useEffect(() => {
    if (!ready || !user) return;
    setSettingsStatus("Enregistrement…");
    const timer = window.setTimeout(() => {
      savePlatformSettings(user.id, settings)
        .then(() => setSettingsStatus("Réglages enregistrés"))
        .catch(() => setSettingsStatus("Échec de l’enregistrement"));
    }, 600);
    return () => window.clearTimeout(timer);
  }, [ready, settings, user]);

  function save(next: typeof settings) {
    dispatch({ type: "patch-settings", settings: next });
  }

  function patchRule(id: string, partial: Partial<CommissionRule>) {
    save({
      ...settings,
      rules: settings.rules.map((rule) => (rule.id === id ? { ...rule, ...partial } : rule)),
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <PageHead
        eyebrow="Administration"
        title="Qualité, catalogue et opérations"
        text="Pilotez les annonces, certifications, services, commissions et partenaires depuis un panel de gouvernance unique."
      />
      {storageWarning && <p className="mb-4 rounded-2xl bg-[#fff4e5] px-4 py-3 text-sm">{storageWarning}</p>}
      {settingsStatus && <p className="mb-4 text-right text-xs text-[#6a6a6a]">{settingsStatus}</p>}
      <ReviewQueue />
      <OperationsQueue />
      <AgencyOnboarding />
      <OfferCatalogAdmin userId={user?.id} />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <label className="block rounded-3xl border border-[#ebebeb] p-5 text-sm">
            Mois d&apos;avance demandés au locataire
            <input
              className={`${fieldClass} mt-2 max-w-[120px]`}
              type="number"
              min={1}
              max={12}
              value={settings.advanceMonths}
              onChange={(event) => save({ ...settings, advanceMonths: Math.max(1, Number(event.target.value) || 1) })}
            />
          </label>
          {settings.rules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} onChange={(partial) => patchRule(rule.id, partial)} />
          ))}
        </div>
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {villa && (
            <Preview title="Séjour · 3 nuits" note={villa.managedByPlatform ? "Bien géré : règle Gestion si elle est active." : "Règle Séjour."}>
              <QuoteView quote={buildQuote(villa, 3, settings)} />
            </Preview>
          )}
          {flat && (
            <Preview title="Location" note="Règle Location, ou Gestion si le bien est géré et que cette règle est active.">
              <QuoteView quote={buildQuote(flat, 1, settings)} />
            </Preview>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Gestes commerciaux</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6a6a6a]">
          Une promotion active réduit soit la commission, soit le prix. Elle s&apos;applique aux séjours, aux locations, ou aux deux.
        </p>
        <div className="mt-4 space-y-3">
          {settings.promos.map((promo) => (
            <PromoCard
              key={promo.id}
              promo={promo}
              onChange={(partial) =>
                save({
                  ...settings,
                  promos: settings.promos.map((item) => (item.id === promo.id ? { ...item, ...partial } : item)),
                })
              }
              onRemove={() => save({ ...settings, promos: settings.promos.filter((item) => item.id !== promo.id) })}
            />
          ))}
        </div>
        <AddPromo
          onAdd={(promo) => save({ ...settings, promos: [...settings.promos, promo] })}
        />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Publicités et boutiques</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6a6a6a]">
          Chaque emplacement accueille une offre partenaire : accueil, carte, fiche logement, espace de gestion, ou boutique.
        </p>
        <div className="mt-4 grid gap-4">
          {settings.ads.map((ad) => (
            <AdCard
              key={ad.id}
              ad={ad}
              onChange={(partial) =>
                save({
                  ...settings,
                  ads: settings.ads.map((item) => (item.id === ad.id ? { ...item, ...partial } : item)),
                })
              }
              onRemove={() => save({ ...settings, ads: settings.ads.filter((item) => item.id !== ad.id) })}
            />
          ))}
        </div>
        <AddAd onAdd={(ad) => save({ ...settings, ads: [...settings.ads, ad] })} />
      </section>
    </div>
  );
}

function AgencyOnboarding() {
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await startAgencyOnboarding(email, businessName);
      setMessage("Parcours agence ouvert. Le responsable peut maintenant transmettre ses justificatifs.");
      setEmail("");
      setBusinessName("");
    } catch (cause) {
      const text = cause instanceof Error ? cause.message : "";
      setMessage(text.includes("account_not_found") ? "Ce responsable doit d’abord créer un compte client avec cet e-mail." : "L’ouverture du parcours agence a échoué.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-12 rounded-3xl border border-[#ebebeb] bg-[#FFFDF7] p-5">
      <h2 className="text-2xl font-semibold">Ouvrir un compte agence</h2>
      <p className="mt-2 text-sm text-[#6a6a6a]">Le responsable crée d’abord un compte client. L’administration ouvre ensuite son parcours documentaire agence.</p>
      <form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail du responsable" required />
        <input className={fieldClass} value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Nom de l’agence" minLength={2} required />
        <button className={btnPrimary} disabled={busy}>{busy ? "Ouverture…" : "Ouvrir le parcours"}</button>
      </form>
      {message && <p className="mt-3 text-sm">{message}</p>}
    </section>
  );
}

function OfferCatalogAdmin({ userId }: { userId?: string }) {
  const [pending, setPending] = useState<Offer[]>([]);
  const [kind, setKind] = useState<Offer["kind"]>("experience");
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("Dakar");
  const [neighborhood, setNeighborhood] = useState("");
  const [price, setPrice] = useState(25000);
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadOffersForReview().then(setPending).catch(() => setMessage("La file des offres ne peut pas être chargée."));
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!userId || title.trim().length < 5 || !neighborhood.trim() || price <= 0 || !image.startsWith("https://")) return;
    setBusy(true);
    setMessage("");
    try {
      await createAdminOffer(userId, {
        id: uid(kind),
        kind,
        title: title.trim(),
        city: city.trim(),
        country: "Sénégal",
        neighborhood: neighborhood.trim(),
        price,
        currency: "XOF",
        unit: kind === "experience" ? "par personne" : "par prestation",
        rating: 0,
        reviewsCount: 0,
        duration: "À confirmer",
        images: [image],
        description: "Offre publiée et administrée par Se Loger au Sénégal.",
        includes: ["Confirmation par l’équipe"],
        host: "Se Loger au Sénégal",
      });
      setTitle("");
      setNeighborhood("");
      setImage("");
      setMessage("Offre publiée dans le catalogue serveur.");
    } catch {
      setMessage("L’offre n’a pas pu être publiée.");
    } finally {
      setBusy(false);
    }
  }

  async function decide(offer: Offer, status: "published" | "suspended") {
    if (!offer.databaseId) return;
    setBusy(true);
    try {
      await reviewOffer(offer.databaseId, status);
      setPending((rows) => rows.filter((row) => row.databaseId !== offer.databaseId));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-12 rounded-3xl border border-[#ebebeb] p-5">
      <h2 className="text-2xl font-semibold">Catalogue expériences et services</h2>
      <p className="mt-2 text-sm text-[#6a6a6a]">Les offres publiées ici deviennent immédiatement visibles dans le catalogue public serveur.</p>
      <form onSubmit={create} className="mt-5 grid gap-3 md:grid-cols-2">
        <select className={fieldClass} value={kind} onChange={(event) => setKind(event.target.value as Offer["kind"])}>
          <option value="experience">Expérience</option>
          <option value="service">Service</option>
        </select>
        <input className={fieldClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre" minLength={5} required />
        <input className={fieldClass} value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ville" required />
        <input className={fieldClass} value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} placeholder="Quartier ou zone" required />
        <input className={fieldClass} type="number" min={1} value={price} onChange={(event) => setPrice(Number(event.target.value))} required />
        <input className={fieldClass} type="url" value={image} onChange={(event) => setImage(event.target.value)} placeholder="URL HTTPS de l’image" required />
        <button className={`${btnPrimary} md:col-span-2`} disabled={busy || !userId}>{busy ? "Publication…" : "Publier l’offre"}</button>
      </form>
      {message && <p className="mt-3 text-sm">{message}</p>}
      {pending.length > 0 && (
        <div className="mt-6 grid gap-2">
          <h3 className="font-semibold">Offres soumises à valider</h3>
          {pending.map((offer) => (
            <div key={offer.databaseId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f7f7f7] p-3">
              <span>{offer.title} · {offer.city}</span>
              <span className="flex gap-2">
                <button className={btnPrimary} disabled={busy} onClick={() => void decide(offer, "published")}>Publier</button>
                <button className={btnSecondary} disabled={busy} onClick={() => void decide(offer, "suspended")}>Refuser</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function OperationsQueue() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [offers, setOffers] = useState<OfferRequest[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [documentLinks, setDocumentLinks] = useState<Record<string, Array<{ label: string; url: string }>>>({});

  useEffect(() => {
    Promise.all([loadVerificationRequests(), loadOfferRequests()])
      .then(([verificationRows, offerRows]) => {
        setVerifications(verificationRows);
        setOffers(offerRows);
      })
      .catch(() => setError("Les demandes opérationnelles ne peuvent pas être chargées."));
  }, []);

  async function decideVerification(request: VerificationRequest, approved: boolean) {
    setBusy(request.id);
    setError("");
    try {
      await reviewVerificationRequest(request.id, approved);
      setVerifications((rows) => rows.filter((row) => row.id !== request.id));
    } catch {
      setError("La décision de certification n’a pas été enregistrée.");
    } finally {
      setBusy("");
    }
  }

  async function openDocuments(request: VerificationRequest) {
    setBusy(request.id);
    setError("");
    try {
      const documents = await loadVerificationDocuments(request.id);
      const links = await Promise.all(
        documents.map(async (document) => ({
          label: document.document_kind,
          url: await getVerificationDocumentUrl(document.storage_path),
        })),
      );
      setDocumentLinks((current) => ({ ...current, [request.id]: links }));
    } catch {
      setError("Les documents de certification ne peuvent pas être ouverts.");
    } finally {
      setBusy("");
    }
  }

  async function setOfferStatus(request: OfferRequest, status: "contacted" | "confirmed" | "declined" | "completed") {
    setBusy(request.id);
    setError("");
    try {
      await updateOfferRequestStatus(request.id, status);
      setOffers((rows) =>
        status === "declined" || status === "completed"
          ? rows.filter((row) => row.id !== request.id)
          : rows.map((row) => row.id === request.id ? { ...row, status } : row),
      );
    } catch {
      setError("Le statut de la demande n’a pas été enregistré.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="mb-12 grid gap-8 lg:grid-cols-2">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Certifications</h2>
          <Pill tone={verifications.length ? "warn" : "good"}>{verifications.length} à traiter</Pill>
        </div>
        <div className="mt-4 grid gap-3">
          {verifications.map((request) => (
            <article key={request.id} className="rounded-[20px] border border-[#e5e5e5] p-4">
              <p className="font-semibold">{request.business_name || (request.account_type === "agence" ? "Agence" : "Propriétaire")}</p>
              <p className="mt-1 text-xs text-[#6a6a6a]">Demande documentaire · {request.account_type}</p>
              <button className="mt-3 text-sm font-medium underline" disabled={busy === request.id} onClick={() => void openDocuments(request)}>
                Charger les documents privés
              </button>
              {documentLinks[request.id] && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {documentLinks[request.id].length > 0 ? documentLinks[request.id].map((document, index) => (
                    <a key={`${document.label}-${index}`} href={document.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#f2f2f2] px-3 py-1 text-xs font-medium">
                      {document.label}
                    </a>
                  )) : <span className="text-xs text-[#a52a12]">Aucun document reçu.</span>}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  className={btnPrimary}
                  disabled={busy === request.id || !documentLinks[request.id]?.length}
                  title={!documentLinks[request.id]?.length ? "Chargez et contrôlez au moins un document avant de certifier." : undefined}
                  onClick={() => void decideVerification(request, true)}
                >
                  Certifier
                </button>
                <button className={btnSecondary} disabled={busy === request.id} onClick={() => void decideVerification(request, false)}>Refuser</button>
              </div>
            </article>
          ))}
          {verifications.length === 0 && <p className="rounded-2xl border border-dashed border-[#cccccc] p-5 text-sm text-[#6a6a6a]">Aucune certification en attente.</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Expériences et services</h2>
          <Pill tone={offers.length ? "warn" : "good"}>{offers.length} ouvertes</Pill>
        </div>
        <div className="mt-4 grid gap-3">
          {offers.map((request) => (
            <article key={request.id} className="rounded-[20px] border border-[#e5e5e5] p-4">
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#FF385C]">{request.offer_kind}</p>
              <p className="mt-1 font-semibold">{request.offer_title}</p>
              <p className="mt-1 text-sm text-[#6a6a6a]">{request.customer_name} · {request.preferred_date} · {request.people} personne{request.people > 1 ? "s" : ""}</p>
              {request.customer_phone && <a className="mt-2 block text-sm font-medium underline" href={`tel:${request.customer_phone}`}>{request.customer_phone}</a>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button className={btnPrimary} disabled={busy === request.id} onClick={() => void setOfferStatus(request, "contacted")}>Contacté</button>
                <button className={btnSecondary} disabled={busy === request.id} onClick={() => void setOfferStatus(request, "confirmed")}>Confirmer</button>
                <button className={btnSecondary} disabled={busy === request.id} onClick={() => void setOfferStatus(request, "declined")}>Refuser</button>
              </div>
            </article>
          ))}
          {offers.length === 0 && <p className="rounded-2xl border border-dashed border-[#cccccc] p-5 text-sm text-[#6a6a6a]">Aucune demande de service ouverte.</p>}
        </div>
      </div>
      {error && <p role="alert" className="lg:col-span-2 rounded-xl bg-[#fff1ee] px-4 py-3 text-sm text-[#a52a12]">{error}</p>}
    </section>
  );
}

function ReviewQueue() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadListingsForReview()
      .then(setListings)
      .catch(() => setError("La file de validation ne peut pas être chargée."))
      .finally(() => setLoading(false));
  }, []);

  async function decide(listing: Listing, status: "published" | "suspended" | "archived") {
    if (!listing.databaseId) return;
    setBusy(listing.id);
    setError("");
    try {
      await reviewListing(listing.databaseId, status);
      setListings((rows) =>
        status === "archived"
          ? rows.filter((row) => row.id !== listing.id)
          : rows.map((row) => row.id === listing.id ? { ...row, publicationStatus: status } : row),
      );
    } catch {
      setError("La décision n’a pas pu être enregistrée.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="mb-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Gouvernance des annonces</h2>
          <p className="mt-2 text-sm text-[#6a6a6a]">Validez, suspendez ou retirez une annonce sans effacer son historique opérationnel.</p>
        </div>
        <Pill tone={listings.some((listing) => listing.publicationStatus === "pending_review") ? "warn" : "good"}>{listings.length} annonces</Pill>
      </div>
      {error && <p className="mt-4 rounded-xl bg-[#fff1ee] px-4 py-3 text-sm text-[#a52a12]">{error}</p>}
      {loading ? (
        <p className="mt-4 rounded-2xl bg-[#f7f7f7] p-5 text-sm">Chargement de la file…</p>
      ) : listings.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-[#cccccc] p-6 text-sm text-[#6a6a6a]">Aucune annonce en attente.</p>
      ) : (
        <div className="mt-4 grid gap-4">
          {listings.map((listing) => (
            <article key={listing.id} className="grid gap-4 rounded-[20px] border border-[#e5e5e5] p-4 md:grid-cols-[160px_1fr_auto] md:items-center">
              <div className="relative h-28 overflow-hidden rounded-2xl bg-[#f2f2f2]">
                <Photo src={listing.images[0]} alt="" sizes="160px" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[.12em] text-[#1F6F66]">{listing.purpose === "vente" ? "Vente" : listing.mode === "sejour" ? "Séjour" : "Location"} · {listing.publicationStatus}</p>
                <h3 className="mt-1 font-semibold">{listing.title}</h3>
                <p className="mt-1 text-sm text-[#6a6a6a]">{listing.neighborhood}, {listing.city} · {listing.images.length} photos</p>
              </div>
              <div className="flex flex-wrap gap-2 md:flex-col">
                {listing.publicationStatus !== "published" && <button className={btnPrimary} disabled={busy === listing.id} onClick={() => void decide(listing, "published")}>Publier</button>}
                {listing.publicationStatus !== "suspended" && <button className={btnSecondary} disabled={busy === listing.id} onClick={() => void decide(listing, "suspended")}>Suspendre</button>}
                <button className={btnSecondary} disabled={busy === listing.id} onClick={() => void decide(listing, "archived")}>Retirer</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Preview({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[#ebebeb] p-5">
      <p className="font-semibold">{title}</p>
      <p className="mb-4 mt-1 text-xs leading-5 text-[#6a6a6a]">{note}</p>
      {children}
    </div>
  );
}

function RuleCard({ rule, onChange }: { rule: CommissionRule; onChange: (partial: Partial<CommissionRule>) => void }) {
  return (
    <article className="rounded-3xl border border-[#ebebeb] p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{rule.label}</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={rule.active} onChange={(event) => onChange({ active: event.target.checked })} />
          Active
        </label>
      </div>
      <p className="mt-1 text-xs leading-5 text-[#6a6a6a]">
        {rule.mode === "gestion"
          ? "S'applique à tous les biens marqués « Géré par Se Loger au Sénégal », à la place de la règle Séjour ou Location. En séjour, le pourcentage porte sur le montant du séjour. En location, il suit la base choisie."
          : rule.mode === "sejour"
            ? "Pour les séjours que le propriétaire gère lui-même. Un bien géré par Se Loger au Sénégal suit la règle Gestion, pas celle-ci."
            : "Pour les locations que le propriétaire gère lui-même. Un bien géré par Se Loger au Sénégal suit la règle Gestion."}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Valeur
          <input className={`${fieldClass} mt-1`} type="number" min={0} value={rule.value} onChange={(event) => onChange({ value: Number(event.target.value) })} />
        </label>
        <label className="text-sm">
          Nature
          <select className={`${fieldClass} mt-1`} value={rule.kind} onChange={(event) => onChange({ kind: event.target.value as CommissionRule["kind"] })}>
            <option value="percent">Pourcentage</option>
            <option value="fixed">Montant fixe</option>
          </select>
        </label>
        <label className="text-sm">
          À la charge de
          <select className={`${fieldClass} mt-1`} value={rule.payer} onChange={(event) => onChange({ payer: event.target.value as Payer })}>
            <option value="proprietaire">Propriétaire</option>
            <option value="client">Client</option>
            <option value="partage">Partage</option>
          </select>
        </label>
        {(rule.mode === "location" || rule.mode === "gestion") && (
          <label className="text-sm">
            Base en location
            <select className={`${fieldClass} mt-1`} value={rule.base} onChange={(event) => onChange({ base: event.target.value as CommissionRule["base"] })}>
              <option value="mois">Un mois de loyer</option>
              <option value="avance">L&apos;avance</option>
              <option value="encaisse">Montant encaissé</option>
            </select>
          </label>
        )}
        {rule.payer === "partage" && (
          <label className="text-sm sm:col-span-2">
            Part propriétaire : {rule.ownerShare} %
            <input className="mt-2 w-full" type="range" min={0} max={100} value={rule.ownerShare} onChange={(event) => onChange({ ownerShare: Number(event.target.value) })} />
          </label>
        )}
      </div>
    </article>
  );
}

function PromoCard({
  promo,
  onChange,
  onRemove,
}: {
  promo: Promo;
  onChange: (partial: Partial<Promo>) => void;
  onRemove: () => void;
}) {
  return (
    <article className="grid gap-3 rounded-3xl border border-[#ebebeb] p-4 md:grid-cols-[1fr_160px_140px_auto]">
      <label className="text-sm">
        Libellé
        <input className={`${fieldClass} mt-1`} value={promo.label} onChange={(event) => onChange({ label: event.target.value })} />
      </label>
      <label className="text-sm">
        Réduction %
        <input className={`${fieldClass} mt-1`} type="number" min={0} max={100} value={promo.discountPercent} onChange={(event) => onChange({ discountPercent: Number(event.target.value) })} />
      </label>
      <label className="text-sm">
        Porte sur
        <select className={`${fieldClass} mt-1`} value={promo.target} onChange={(event) => onChange({ target: event.target.value as Promo["target"] })}>
          <option value="commission">La commission</option>
          <option value="prix">Le prix</option>
        </select>
      </label>
      <label className="flex items-end gap-2 pb-2 text-sm">
        <input type="checkbox" checked={promo.active} onChange={(event) => onChange({ active: event.target.checked })} />
        Active
      </label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-4">
        <select className={`${fieldClass} w-auto`} value={promo.mode} onChange={(event) => onChange({ mode: event.target.value as Promo["mode"] })}>
          <option value="tous">Séjours et locations</option>
          <option value="sejour">Séjours</option>
          <option value="location">Locations</option>
        </select>
        <Pill tone={promo.active ? "good" : "neutral"}>{promo.active ? "En cours" : "En pause"}</Pill>
        <button className="text-sm underline" onClick={onRemove}>Retirer</button>
      </div>
    </article>
  );
}

function AddPromo({ onAdd }: { onAdd: (promo: Promo) => void }) {
  const [label, setLabel] = useState("Geste commercial");
  return (
    <form
      className="mt-4 flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd({
          id: uid("promo"),
          label,
          active: true,
          mode: "tous",
          discountPercent: 10,
          target: "commission",
          beneficiary: "les-deux",
        });
      }}
    >
      <input className={`${fieldClass} max-w-sm`} value={label} onChange={(event) => setLabel(event.target.value)} />
      <button className={btnSecondary}>Ajouter un geste</button>
    </form>
  );
}

function AdCard({ ad, onChange, onRemove }: { ad: Ad; onChange: (partial: Partial<Ad>) => void; onRemove: () => void }) {
  return (
    <article className="grid gap-4 rounded-3xl border border-[#ebebeb] p-4 md:grid-cols-[160px_1fr]">
      <div className="relative h-28 overflow-hidden rounded-2xl bg-[#f3f3f3]">
        {ad.image && <img src={ad.image} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Pill>{PLACEMENT_LABEL[ad.placement]}</Pill>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ad.active} onChange={(event) => onChange({ active: event.target.checked })} />
            Visible
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={fieldClass} value={ad.partner} onChange={(event) => onChange({ partner: event.target.value })} />
          <select className={fieldClass} value={ad.placement} onChange={(event) => onChange({ placement: event.target.value as AdPlacement })}>
            {Object.entries(PLACEMENT_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input className={fieldClass} value={ad.title} onChange={(event) => onChange({ title: event.target.value })} />
          <input className={fieldClass} value={ad.offer ?? ""} placeholder="Offre courte" onChange={(event) => onChange({ offer: event.target.value })} />
        </div>
        <textarea className={`${fieldClass} min-h-16`} value={ad.subtitle} onChange={(event) => onChange({ subtitle: event.target.value })} />
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              onChange({ image: await readImage(file, 1200) });
            }}
          />
          <button className="text-sm underline" onClick={onRemove}>Retirer</button>
        </div>
      </div>
    </article>
  );
}

function AddAd({ onAdd }: { onAdd: (ad: Ad) => void }) {
  return (
    <button
      className={`${btnPrimary} mt-4`}
      onClick={() =>
        onAdd({
          id: uid("ad"),
          placement: "boutique",
          partner: "Nouveau partenaire",
          title: "Offre à compléter",
          subtitle: "Texte de l'annonce.",
          image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80",
          href: "/boutiques",
          active: true,
        })
      }
    >
      Ajouter une publicité
    </button>
  );
}
