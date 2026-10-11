"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDollarSign,
  Home,
  ImagePlus,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PickMap } from "@/components/map";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { btnPrimary, btnSecondary, fieldClass, formatMoney, uid } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { loadOrganizations, loadOwnedListings, submitListing, uploadListingPhoto } from "@/lib/supabase";
import { useAmeena } from "@/lib/store";
import { useAccess } from "@/lib/use-access";
import { useTitle } from "@/lib/use-title";
import type {
  Currency,
  Furnishing,
  ListingPurpose,
  ManagementMandate,
  Mode,
  Organization,
  PropertyType,
  RentalTerm,
  Standing,
} from "@/lib/types";

const defaultPlace = {
  label: "Almadies, Dakar, Sénégal",
  city: "Dakar",
  country: "Sénégal",
  neighborhood: "Almadies",
  lat: 14.745,
  lng: -17.52,
};

const AMENITY_OPTIONS = [
  "Wifi",
  "Climatisation",
  "Cuisine",
  "Stationnement",
  "Gardien",
  "Groupe électrogène",
  "Réserve d’eau",
  "Piscine",
  "Terrasse",
  "Balcon",
  "Ascenseur",
  "Vue mer",
  "Accès routier",
  "Électricité à proximité",
  "Eau à proximité",
];

const STEPS = [
  { number: 1, label: "Le bien", detail: "Projet et adresse", icon: Home },
  { number: 2, label: "L’offre", detail: "Prix et caractéristiques", icon: CircleDollarSign },
  { number: 3, label: "L’annonce", detail: "Photos et description", icon: ImagePlus },
] as const;

const PROPERTY_TYPES: Array<{ value: PropertyType; label: string; group: string }> = [
  { value: "appartement", label: "Appartement", group: "Habitation" },
  { value: "studio", label: "Studio", group: "Habitation" },
  { value: "maison", label: "Maison", group: "Habitation" },
  { value: "villa", label: "Villa", group: "Habitation" },
  { value: "duplex", label: "Duplex", group: "Habitation" },
  { value: "rooftop", label: "Rooftop", group: "Habitation" },
  { value: "riad", label: "Riad", group: "Habitation" },
  { value: "ecolodge", label: "Écolodge", group: "Habitation" },
  { value: "terrain", label: "Terrain", group: "Foncier" },
  { value: "champ", label: "Champ", group: "Foncier" },
  { value: "immeuble", label: "Immeuble", group: "Professionnel" },
  { value: "bureau", label: "Bureau", group: "Professionnel" },
  { value: "commerce", label: "Commerce", group: "Professionnel" },
  { value: "hotel", label: "Hôtel", group: "Professionnel" },
];

export default function PublishPage() {
  const { dispatch } = useAmeena();
  const { user, profile, loading } = useAuth();
  const { can } = useAccess();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState(defaultPlace);
  const [mode, setMode] = useState<Mode>("sejour");
  const [type, setType] = useState<PropertyType>("appartement");
  const [purpose, setPurpose] = useState<ListingPurpose>("location");
  const [rentalTerm, setRentalTerm] = useState<RentalTerm>("courte_duree");
  const [furnishing, setFurnishing] = useState<Furnishing>("meuble");
  const [standing, setStanding] = useState<Standing>("standard");
  const [managementMandate, setManagementMandate] = useState<ManagementMandate>("direct_proprietaire");
  const [price, setPrice] = useState(50000);
  const [currency, setCurrency] = useState<Currency>("XOF");
  const [guests, setGuests] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [baths, setBaths] = useState(1);
  const [surface, setSurface] = useState(40);
  const [amenities, setAmenities] = useState<string[]>(["Wifi"]);
  const [description, setDescription] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [publisherDataLoaded, setPublisherDataLoaded] = useState(false);
  const [existingIndividualListing, setExistingIndividualListing] = useState<{ id: string; title: string } | null>(null);
  const [organizationId, setOrganizationId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lat, setLat] = useState(defaultPlace.lat);
  const [lng, setLng] = useState(defaultPlace.lng);
  const [step, setStep] = useState(1);
  useTitle("Publier un bien · Se Loger au Sénégal");

  const professional = can("publish_listing");
  const isLand = type === "terrain" || type === "champ";
  const isProfessionalProperty = ["bureau", "commerce", "immeuble"].includes(type);
  const stepValid = step === 1
    ? title.trim().length >= 10 && Boolean(place.city) && Number.isFinite(lat) && Number.isFinite(lng)
    : step === 2
      ? price > 0 && surface > 0
      : images.length >= 3;
  const progress = Math.round((step / STEPS.length) * 100);
  const selectedType = PROPERTY_TYPES.find((option) => option.value === type)?.label ?? type;

  useEffect(() => {
    if (!user) {
      setExistingIndividualListing(null);
      setPublisherDataLoaded(true);
      return;
    }
    setPublisherDataLoaded(false);
    Promise.all([loadOrganizations(), loadOwnedListings(user.id)])
      .then(([organizationRows, listingRows]) => {
        setOrganizations(organizationRows);
        setOrganizationId(organizationRows[0]?.id ?? "");
        const individualListing = listingRows.find((listing) =>
          listing.ownerUserId === user.id
          && !listing.organizationId
          && listing.publicationStatus !== "archived");
        setExistingIndividualListing(
          individualListing ? { id: individualListing.id, title: individualListing.title } : null,
        );
      })
      .catch(() => {
        setOrganizations([]);
        setExistingIndividualListing(null);
      })
      .finally(() => setPublisherDataLoaded(true));
  }, [user]);

  async function onFiles(files: FileList | null) {
    if (!files || !user) return;
    setUploading(true);
    setError("");
    try {
      const next: string[] = [];
      for (const file of Array.from(files).slice(0, 5 - images.length)) {
        if (!file.type.startsWith("image/")) throw new Error("Sélectionnez uniquement des fichiers image.");
        if (file.size > 10 * 1024 * 1024) throw new Error("Chaque photo doit peser moins de 10 Mo.");
        next.push(await uploadListingPhoto(user.id, file));
      }
      setImages((current) => [...current, ...next].slice(0, 5));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Une photo n’a pas pu être envoyée.");
    } finally {
      setUploading(false);
    }
  }

  function selectPropertyType(next: PropertyType) {
    setType(next);
    if (next === "terrain" || next === "champ") {
      setBedrooms(0);
      setBeds(0);
      setBaths(0);
      setGuests(1);
      setAmenities([]);
    }
  }

  function goNext() {
    setError("");
    if (!stepValid) {
      setError(
        step === 1
          ? "Ajoutez un titre précis et confirmez la localisation du bien."
          : step === 2
            ? "Renseignez une surface et un prix valides."
            : "Ajoutez au moins trois photos pour poursuivre.",
      );
      return;
    }
    setStep((value) => Math.min(3, value + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function publish() {
    if (!user || !professional || title.trim().length < 10 || price <= 0 || images.length < 3) return;
    setSubmitting(true);
    setError("");
    const id = uid("bien");
    const listing = {
        id,
        ownerUserId: user.id,
        organizationId: organizationId || undefined,
        publicationStatus: "pending_review" as const,
        title: title.trim(),
        city: place.city,
        country: place.country,
        neighborhood: place.neighborhood,
        mode,
        type,
        purpose,
        rentalTerm: purpose === "location" ? rentalTerm : undefined,
        furnishing,
        standing,
        managementMandate,
        price: Number(price) || 0,
        currency,
        guests: isLand ? 1 : guests,
        bedrooms: isLand ? 0 : bedrooms,
        beds: isLand || isProfessionalProperty ? 0 : beds,
        baths: isLand ? 0 : baths,
        surface,
        rating: 5,
        reviewsCount: 0,
        images,
        lat,
        lng,
        description: description.trim() || "Bien publié en direct sur Se Loger au Sénégal.",
        amenities,
        hostId: `user-${user.id}`,
        managedByPlatform: managementMandate === "plateforme",
        reviews: [],
      };
    try {
      const saved = await submitListing(user.id, listing);
      dispatch({
        type: "add-listing",
        listing: { ...listing, databaseId: saved.id, publicationStatus: saved.status },
      });
      router.push(`/logements/${id}`);
    } catch (cause) {
      const message = typeof cause === "object" && cause && "message" in cause
        ? String(cause.message)
        : "";
      setError(
        message.includes("marketplace_listings_one_active_individual_idx")
          ? "Votre compte particulier possède déjà un bien actif. Archivez-le avant d’en publier un autre."
          : "La publication n’a pas pu être enregistrée. Vérifiez les informations puis réessayez.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !publisherDataLoaded) {
    return <div className="p-12 text-center text-sm text-[#6a6a6a]">Ouverture de la publication…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold">Connectez-vous pour publier</h1>
        <p className="mt-3 text-[#6a6a6a]">Le compte permet d’attribuer le bien au bon propriétaire et de protéger ses demandes.</p>
        <Link href="/connexion?retour=/publier" className={`${btnPrimary} mt-7`}>Créer un compte ou se connecter</Link>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold">Activez votre profil propriétaire</h1>
        <p className="mt-3 text-[#6a6a6a]">La vérification documentaire protège les propriétaires, les visiteurs et la qualité du catalogue.</p>
        <Link href="/compte#certification" className={`${btnPrimary} mt-7`}>Demander la vérification</Link>
      </div>
    );
  }

  if (
    profile?.account_type === "proprietaire"
    && user.app_metadata?.role !== "admin"
    && existingIndividualListing
  ) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold">Votre bien est déjà enregistré</h1>
        <p className="mt-3 text-[#6a6a6a]">
          Un compte propriétaire particulier gère un seul bien actif. Vous pouvez modifier, suivre ou archiver « {existingIndividualListing.title} » depuis son espace.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link href={`/gestion/biens/${existingIndividualListing.id}`} className={btnPrimary}>Gérer mon bien</Link>
          <Link href="/gestion/biens" className="inline-flex items-center justify-center rounded-full border border-[#dddddd] px-5 py-2.5 text-sm font-semibold">Voir mon espace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      <header className="border-b border-[#e7e2dc] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <Link href="/compte" className="inline-flex items-center gap-2 text-sm font-semibold text-[#182A39]">
            <ArrowLeft className="h-4 w-4" /> Quitter
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#53636f]">
            <ShieldCheck className="h-4 w-4 text-[#16836f]" />
            Brouillon privé · publication après contrôle
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-7 md:px-8 md:py-10">
        <div className="mb-8 max-w-3xl">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#C13515]">
            <Sparkles className="h-4 w-4" /> Nouvelle annonce
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-[#182A39] md:text-5xl">
            Présentez votre bien sous son meilleur jour.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66727b] md:text-base">
            Trois étapes courtes. Votre annonce restera privée jusqu’à sa vérification par notre équipe.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-[#e7e2dc] bg-[#182A39] p-5 text-white lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[.14em] text-white/60">Progression</span>
              <span className="text-sm font-semibold">{progress}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-[#D8B56A] transition-all" style={{ width: `${progress}%` }} />
            </div>
            <nav className="mt-6 grid gap-2" aria-label={`Étape ${step} sur 3`}>
              {STEPS.map(({ number, label, detail, icon: Icon }) => {
                const active = step === number;
                const done = step > number;
                return (
                  <button
                    key={number}
                    type="button"
                    disabled={number > step}
                    onClick={() => number < step && setStep(number)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                      active ? "bg-white text-[#182A39]" : done ? "bg-white/10 text-white" : "text-white/50"
                    }`}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                      active ? "bg-[#fff3d8] text-[#8a641c]" : done ? "bg-[#16836f] text-white" : "bg-white/10"
                    }`}>
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className={`block text-xs ${active ? "text-[#66727b]" : "text-white/50"}`}>{detail}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-xs text-white/55">Aperçu du bien</p>
              <p className="mt-2 font-semibold">{title.trim() || "Votre titre apparaîtra ici"}</p>
              <p className="mt-1 text-xs text-white/60">{selectedType} · {place.neighborhood || place.city}</p>
              <p className="mt-3 text-lg font-semibold text-[#E9CC8D]">{formatMoney(price || 0, currency)}</p>
            </div>
          </aside>

          <main className="rounded-[28px] border border-[#e7e2dc] bg-white p-5 shadow-[0_16px_50px_rgba(24,42,57,.07)] md:p-8">
            <div className="mb-7 flex items-start justify-between gap-4 border-b border-[#eee9e3] pb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[#C13515]">Étape {step} sur 3</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-.03em] text-[#182A39]">
                  {step === 1 ? "Quel bien proposez-vous ?" : step === 2 ? "Construisez une offre claire" : "Donnez envie de le découvrir"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#66727b]">
                  {step === 1
                    ? "Choisissez le marché, le type de bien et confirmez sa localisation."
                    : step === 2
                      ? "Renseignez uniquement les informations utiles à la décision."
                      : "Ajoutez des photos nettes et une description fidèle au bien."}
                </p>
              </div>
              <span className="hidden rounded-full bg-[#f5f1eb] px-3 py-1.5 text-xs font-semibold text-[#53636f] sm:block">
                {step === 3 ? `${images.length}/5 photos` : "≈ 2 min"}
              </span>
            </div>

            {error && <p role="alert" className="mb-5 rounded-2xl bg-[#fff1ee] px-4 py-3 text-sm text-[#a52a12]">{error}</p>}
            <div className="grid gap-5">
              {step === 1 && <>
                <fieldset>
                  <legend className="text-sm font-semibold text-[#182A39]">Votre projet</legend>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {([
                      { value: "location", label: "Mettre en location", detail: "Courte ou longue durée", icon: Home },
                      { value: "vente", label: "Mettre en vente", detail: "Bien ou terrain", icon: CircleDollarSign },
                    ] as const).map(({ value, label, detail, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setPurpose(value);
                          if (value === "vente") setMode("location");
                        }}
                        className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                          purpose === value
                            ? "border-[#182A39] bg-[#f5f1eb] ring-1 ring-[#182A39]"
                            : "border-[#ddd7d0] hover:border-[#9b9187]"
                        }`}
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#C13515] shadow-sm">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-[#182A39]">{label}</span>
                          <span className="mt-1 block text-xs text-[#66727b]">{detail}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {purpose === "location" && (
                  <fieldset>
                    <legend className="text-sm font-semibold text-[#182A39]">Type de location</legend>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {([
                        { mode: "sejour", term: "journalier", label: "À la journée" },
                        { mode: "sejour", term: "courte_duree", label: "Court séjour" },
                        { mode: "location", term: "longue_duree", label: "Longue durée" },
                      ] as const).map((option) => {
                        const selected = mode === option.mode && rentalTerm === option.term;
                        return (
                          <button
                            key={option.term}
                            type="button"
                            onClick={() => {
                              setMode(option.mode);
                              setRentalTerm(option.term);
                            }}
                            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                              selected ? "border-[#C13515] bg-[#fff1ee] text-[#9f2d14]" : "border-[#ddd7d0] text-[#53636f]"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                <fieldset>
                  <legend className="text-sm font-semibold text-[#182A39]">Type de bien</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PROPERTY_TYPES.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        title={option.group}
                        onClick={() => selectPropertyType(option.value)}
                        className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                          type === option.value
                            ? "border-[#182A39] bg-[#182A39] text-white"
                            : "border-[#ddd7d0] bg-white text-[#53636f] hover:border-[#9b9187]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="text-sm font-semibold text-[#182A39]">
                  Titre de l’annonce
                  <input
                    className={`${fieldClass} mt-2`}
                    value={title}
                    maxLength={100}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ex. Appartement lumineux avec vue mer"
                  />
                  <span className="mt-1.5 flex justify-between text-xs font-normal text-[#78838b]">
                    <span>Précis, sans numéro de téléphone.</span>
                    <span>{title.trim().length}/100</span>
                  </span>
                </label>

                <section className="rounded-2xl border border-[#ddd7d0] p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#C13515]" />
                    <h3 className="text-sm font-semibold text-[#182A39]">Localisation du bien</h3>
                  </div>
                  <div className="mt-3">
                    <AddressAutocomplete
                      value={place.label}
                      onSelect={(next) => {
                        setPlace(next);
                        setLat(next.lat);
                        setLng(next.lng);
                        setCurrency("XOF");
                      }}
                    />
                  </div>
                  <div className="mt-3 overflow-hidden rounded-2xl">
                    <PickMap lat={lat} lng={lng} onChange={(nextLat, nextLng) => { setLat(nextLat); setLng(nextLng); }} />
                  </div>
                  <p className="mt-2 text-xs text-[#78838b]">Ajustez le repère sur la carte. L’adresse exacte ne sera pas affichée publiquement.</p>
                </section>
              </>}
              {step === 2 && <>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-[#182A39]">
            Surface en m²
            <input className={`${fieldClass} mt-1`} type="number" min={1} value={surface} onChange={(event) => setSurface(Number(event.target.value))} />
          </label>
          {!isLand && (
          <label className="text-sm font-semibold text-[#182A39]">
            Ameublement
            <select className={`${fieldClass} mt-1`} value={furnishing} onChange={(event) => setFurnishing(event.target.value as Furnishing)}>
              <option value="meuble">Meublé</option>
              <option value="semi_meuble">Semi-meublé</option>
              <option value="non_meuble">Non meublé</option>
            </select>
          </label>
          )}
          <label className="text-sm font-semibold text-[#182A39]">
            Standing
            <select className={`${fieldClass} mt-1`} value={standing} onChange={(event) => setStanding(event.target.value as Standing)}>
              <option value="essentiel">Essentiel</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="luxe">Luxe</option>
              <option value="presidentiel">Présidentiel</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-[#182A39]">
            Gestion du bien
            <select className={`${fieldClass} mt-1`} value={managementMandate} onChange={(event) => setManagementMandate(event.target.value as ManagementMandate)}>
              <option value="direct_proprietaire">Directement par le propriétaire</option>
              <option value="agence">Confiée à une agence</option>
              <option value="plateforme">Confiée à Se Loger au Sénégal</option>
            </select>
          </label>
          <label className="rounded-2xl border border-[#d9c7a0] bg-[#fffaf0] p-4 text-sm font-semibold text-[#182A39] sm:col-span-2">
            {purpose === "vente" ? "Prix de vente" : `Prix ${mode === "sejour" ? "par nuit" : "par mois"}`}
            <div className="mt-2 grid grid-cols-[1fr_110px] gap-2">
              <input className={`${fieldClass} text-lg font-semibold`} type="number" min={1} value={price} onChange={(event) => setPrice(Number(event.target.value))} />
              <select className={fieldClass} value={currency} onChange={(event) => setCurrency(event.target.value as Currency)}>
                <option value="XOF">F CFA</option>
                <option value="EUR">Euro</option>
              </select>
            </div>
            <span className="mt-2 block text-xs font-normal text-[#786b52]">Le prix et la commission seront affichés clairement avant toute demande.</span>
          </label>
          {!isLand && <>
            {!isProfessionalProperty && (
              <label className="text-sm font-semibold text-[#182A39]">
                Capacité d’accueil
                <input className={`${fieldClass} mt-1`} type="number" min={1} value={guests} onChange={(event) => setGuests(Number(event.target.value))} />
              </label>
            )}
            <label className="text-sm font-semibold text-[#182A39]">
              Chambres ou pièces
              <input className={`${fieldClass} mt-1`} type="number" min={0} value={bedrooms} onChange={(event) => setBedrooms(Number(event.target.value))} />
            </label>
            {!isProfessionalProperty && (
              <label className="text-sm font-semibold text-[#182A39]">
                Lits
                <input className={`${fieldClass} mt-1`} type="number" min={0} value={beds} onChange={(event) => setBeds(Number(event.target.value))} />
              </label>
            )}
            <label className="text-sm font-semibold text-[#182A39]">
              Salles d’eau
              <input className={`${fieldClass} mt-1`} type="number" min={0} value={baths} onChange={(event) => setBaths(Number(event.target.value))} />
            </label>
          </>}
        </div>
        <fieldset className="rounded-2xl bg-[#f7f5f2] p-4">
          <legend className="px-1 text-sm font-semibold text-[#182A39]">Équipements et accès</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((amenity) => {
              const selected = amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => setAmenities((items) => selected ? items.filter((item) => item !== amenity) : [...items, amenity])}
                  className={`rounded-full border px-3 py-2 text-xs font-medium ${selected ? "border-[#C13515] bg-[#FFF1EE] text-[#9f2d14]" : "border-[#d8d2cb] bg-white text-[#53636f]"}`}
                >
                  {amenity}
                </button>
              );
            })}
          </div>
        </fieldset>
        </>}
              {step === 3 && <>
                <section>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#182A39]">Photos du bien</h3>
                      <p className="mt-1 text-xs text-[#78838b]">3 minimum, 5 maximum · JPG, PNG ou WebP · 10 Mo par image</p>
                    </div>
                    <span className={`text-xs font-semibold ${images.length >= 3 ? "text-[#16836f]" : "text-[#C13515]"}`}>
                      {images.length}/5
                    </span>
                  </div>
                  <label className={`mt-3 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                    uploading ? "border-[#d8d2cb] bg-[#f7f5f2]" : "border-[#c9c1b8] bg-[#fcfbf9] hover:border-[#C13515] hover:bg-[#fff8f5]"
                  }`}>
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#C13515] shadow-sm">
                      <ImagePlus className="h-6 w-6" />
                    </span>
                    <span className="mt-3 text-sm font-semibold text-[#182A39]">
                      {uploading ? "Envoi sécurisé en cours…" : images.length ? "Ajouter d’autres photos" : "Sélectionner les photos"}
                    </span>
                    <span className="mt-1 text-xs text-[#78838b]">La première image devient la couverture.</span>
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={uploading || images.length >= 5}
                      onChange={(event) => {
                        void onFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {images.map((image, index) => (
                        <div key={image.slice(0, 40)} className={`relative overflow-hidden rounded-2xl ${index === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}>
                          <img src={image} alt={`Photo ${index + 1} du bien`} className={`w-full object-cover ${index === 0 ? "h-52 sm:h-full" : "h-36"}`} />
                          {index === 0 && <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#182A39] shadow">Couverture</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <label className="text-sm font-semibold text-[#182A39]">
                  Description
                  <textarea
                    className={`${fieldClass} mt-2 min-h-36 resize-y`}
                    value={description}
                    maxLength={1200}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Décrivez les espaces, l’environnement, les accès et ce qui rend ce bien unique."
                  />
                  <span className="mt-1.5 flex justify-between text-xs font-normal text-[#78838b]">
                    <span>Restez factuel : les coordonnées privées sont interdites.</span>
                    <span>{description.length}/1200</span>
                  </span>
                </label>

                {organizations.length > 0 && (
                  <label className="text-sm font-semibold text-[#182A39]">
                    Publier pour
                    <select className={`${fieldClass} mt-2`} value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
                      <option value="">Mon compte personnel</option>
                      {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
                    </select>
                  </label>
                )}

                <div className="flex gap-3 rounded-2xl border border-[#cfe3df] bg-[#eff8f6] p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#16836f]" />
                  <div>
                    <p className="text-sm font-semibold text-[#145e57]">Contrôle avant publication</p>
                    <p className="mt-1 text-xs leading-5 text-[#43716b]">Notre équipe vérifie la cohérence, la qualité des photos et les informations du propriétaire avant la mise en ligne.</p>
                  </div>
                </div>
              </>}
        {step === 1 && title.trim().length < 10 && (
          <p className="text-sm text-[#6a6a6a]">Saisissez un titre précis d’au moins 10 caractères pour continuer.</p>
        )}
        {step === 3 && images.length < 3 && (
          <p className="text-sm text-[#6a6a6a]">Ajoutez encore {3 - images.length} photo{3 - images.length > 1 ? "s" : ""} pour envoyer l’annonce en validation.</p>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-[#eee9e3] pt-5">
          {step > 1 ? (
            <button className={btnSecondary} onClick={() => { setError(""); setStep((value) => value - 1); }}>
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>
          ) : <Link href="/compte" className="inline-flex items-center gap-2 px-2 py-2.5 text-sm font-semibold text-[#53636f]"><ArrowLeft className="h-4 w-4" /> Quitter</Link>}
          {step < 3 ? (
            <button className={btnPrimary} onClick={goNext}>
              Continuer <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button className={btnPrimary} disabled={submitting || uploading || !stepValid || title.trim().length < 10 || price <= 0} onClick={() => void publish()}>
              {submitting ? "Envoi en validation…" : "Envoyer en validation"}
            </button>
          )}
        </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
