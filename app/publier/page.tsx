"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PickMap } from "@/components/map";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { PageHead } from "@/components/ui";
import { btnPrimary, fieldClass, uid } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { loadOrganizations, submitListing, uploadListingPhoto } from "@/lib/supabase";
import { useAmeena } from "@/lib/store";
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

export default function PublishPage() {
  const { dispatch } = useAmeena();
  const { user, profile, loading } = useAuth();
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
  const [description, setDescription] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lat, setLat] = useState(defaultPlace.lat);
  const [lng, setLng] = useState(defaultPlace.lng);
  const [step, setStep] = useState(1);
  useTitle("Publier un bien · Se Loger au Sénégal");

  const professional = profile?.account_type === "proprietaire" || profile?.account_type === "agence" || user?.app_metadata?.role === "admin";

  useEffect(() => {
    if (!user || profile?.account_type !== "agence") return;
    loadOrganizations().then((rows) => {
      setOrganizations(rows);
      setOrganizationId(rows[0]?.id ?? "");
    }).catch(() => setOrganizations([]));
  }, [profile?.account_type, user]);

  async function onFiles(files: FileList | null) {
    if (!files || !user) return;
    setUploading(true);
    setError("");
    try {
      const next: string[] = [];
      for (const file of Array.from(files).slice(0, 5 - images.length)) {
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
        guests,
        bedrooms,
        beds: bedrooms,
        baths: 1,
        surface: 40,
        rating: 5,
        reviewsCount: 0,
        images,
        lat,
        lng,
        description: description.trim() || "Bien publié en direct sur Se Loger au Sénégal.",
        amenities: ["Wifi"],
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
    } catch {
      setError("La publication n’a pas pu être enregistrée. Vérifiez les informations puis réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-12 text-center text-sm text-[#6a6a6a]">Ouverture de la publication…</div>;

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
        <p className="mt-3 text-[#6a6a6a]">Les propriétaires passent par la vérification documentaire. Les agences sont créées et activées uniquement par le service commercial Impulcia Afrique.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link href="/compte" className={btnPrimary}>Demander la vérification</Link>
          <a href="https://wa.me/221788324069?text=Bonjour%2C%20je%20souhaite%20inscrire%20mon%20agence%20sur%20Se%20Loger%20au%20S%C3%A9n%C3%A9gal." target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full border border-[#dddddd] px-5 py-2.5 text-sm font-semibold">Contacter l’équipe sur WhatsApp</a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHead
        eyebrow="Publication"
        title="Mettre un bien en ligne"
        text="Le logement est envoyé en validation. Une annonce ne devient publique qu'après contrôle de son contenu et de son propriétaire."
      />
      <div className="grid gap-4">
        <div className="mb-2 grid grid-cols-3 gap-2" aria-label={`Étape ${step} sur 3`}>
          {["Projet", "Caractéristiques", "Photos et validation"].map((label, index) => (
            <div key={label} className="text-center">
              <div className={`h-1.5 rounded-full ${step >= index + 1 ? "bg-[#FF4845]" : "bg-[#e5e5e5]"}`} />
              <p className={`mt-2 text-xs ${step === index + 1 ? "font-semibold" : "text-[#6a6a6a]"}`}>{label}</p>
            </div>
          ))}
        </div>
        {step === 1 && <>
        <label className="text-sm font-medium">
          Titre
          <input className={`${fieldClass} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Appartement lumineux à ..." />
        </label>
        <label className="text-sm font-medium">
          Adresse ou point de repère
          <div className="mt-1">
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
        </label>
        <PickMap lat={lat} lng={lng} onChange={(nextLat, nextLng) => { setLat(nextLat); setLng(nextLng); }} />
        <p className="text-xs text-[#6a6a6a]">Cliquez sur la carte pour placer le bien. {lat}, {lng}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Marché
            <select className={`${fieldClass} mt-1`} value={purpose} onChange={(event) => setPurpose(event.target.value as ListingPurpose)}>
              <option value="location">Location</option>
              <option value="vente">Vente</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Rythme de location
            <select className={`${fieldClass} mt-1`} value={mode} onChange={(event) => setMode(event.target.value as Mode)}>
              <option value="sejour">Séjour</option>
              <option value="location">Location longue durée</option>
            </select>
          </label>
          {purpose === "location" && (
            <label className="text-sm font-medium">
              Durée
              <select className={`${fieldClass} mt-1`} value={rentalTerm} onChange={(event) => setRentalTerm(event.target.value as RentalTerm)}>
                <option value="journalier">Journalier</option>
                <option value="courte_duree">Courte durée</option>
                <option value="longue_duree">Longue durée</option>
              </select>
            </label>
          )}
          <label className="text-sm font-medium">
            Type de bien
            <select className={`${fieldClass} mt-1`} value={type} onChange={(event) => setType(event.target.value as PropertyType)}>
              <option value="appartement">Appartement</option>
              <option value="villa">Villa</option>
              <option value="maison">Maison</option>
              <option value="studio">Studio</option>
              <option value="riad">Riad</option>
              <option value="ecolodge">Écolodge</option>
              <option value="duplex">Duplex</option>
              <option value="rooftop">Rooftop</option>
              <option value="hotel">Hôtel</option>
              <option value="terrain">Terrain</option>
              <option value="immeuble">Immeuble</option>
              <option value="bureau">Bureau</option>
              <option value="commerce">Commerce</option>
            </select>
          </label>
        </div>
        </>}
        {step === 2 && <>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Ameublement
            <select className={`${fieldClass} mt-1`} value={furnishing} onChange={(event) => setFurnishing(event.target.value as Furnishing)}>
              <option value="meuble">Meublé</option>
              <option value="semi_meuble">Semi-meublé</option>
              <option value="non_meuble">Non meublé</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Standing
            <select className={`${fieldClass} mt-1`} value={standing} onChange={(event) => setStanding(event.target.value as Standing)}>
              <option value="essentiel">Essentiel</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="luxe">Luxe</option>
              <option value="presidentiel">Présidentiel</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Gestion du bien
            <select className={`${fieldClass} mt-1`} value={managementMandate} onChange={(event) => setManagementMandate(event.target.value as ManagementMandate)}>
              <option value="direct_proprietaire">Directement par le propriétaire</option>
              <option value="agence">Confiée à une agence</option>
              <option value="plateforme">Confiée à Se Loger au Sénégal</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Prix {mode === "sejour" ? "par nuit" : "par mois"}
            <input className={`${fieldClass} mt-1`} type="number" min={1} value={price} onChange={(event) => setPrice(Number(event.target.value))} />
          </label>
          <label className="text-sm font-medium">
            Devise
            <select className={`${fieldClass} mt-1`} value={currency} onChange={(event) => setCurrency(event.target.value as Currency)}>
              <option value="XOF">F CFA</option>
              <option value="EUR">Euro</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Voyageurs
            <input className={`${fieldClass} mt-1`} type="number" min={1} value={guests} onChange={(event) => setGuests(Number(event.target.value))} />
          </label>
          <label className="text-sm font-medium">
            Chambres
            <input className={`${fieldClass} mt-1`} type="number" min={0} value={bedrooms} onChange={(event) => setBedrooms(Number(event.target.value))} />
          </label>
        </div>
        </>}
        {step === 3 && <>
        <label className="text-sm font-medium">
          Description
          <textarea className={`${fieldClass} mt-1 min-h-28`} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        {organizations.length > 0 && (
          <label className="text-sm font-medium">
            Organisation responsable
            <select className={`${fieldClass} mt-1`} value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
              <option value="">Compte personnel</option>
              {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
          </label>
        )}
        <label className="text-sm font-medium">
          Photos <span className="font-normal text-[#6a6a6a]">· 3 minimum, 5 maximum</span>
          <input className="mt-2 block text-sm" type="file" accept="image/*" multiple onChange={(event) => onFiles(event.target.files)} />
        </label>
        {uploading && <p className="text-sm text-[#6a6a6a]">Envoi sécurisé des photos…</p>}
        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((image) => (
              <img key={image.slice(0, 40)} src={image} alt="" className="h-20 w-full rounded-xl object-cover" />
            ))}
          </div>
        )}
        {error && <p role="alert" className="rounded-xl bg-[#fff1ee] px-4 py-3 text-sm text-[#a52a12]">{error}</p>}
        </>}
        <div className="mt-4 flex items-center justify-between border-t border-[#eeeeee] pt-4">
          {step > 1 ? (
            <button className="inline-flex items-center gap-2 rounded-full border border-[#dddddd] px-4 py-2.5 text-sm font-semibold" onClick={() => setStep((value) => value - 1)}>
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>
          ) : <Link href="/compte" className="inline-flex items-center gap-2 px-2 py-2.5 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Quitter</Link>}
          {step < 3 ? (
            <button className={btnPrimary} disabled={step === 1 && title.trim().length < 10} onClick={() => setStep((value) => value + 1)}>
              Continuer <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button className={btnPrimary} disabled={submitting || uploading || title.trim().length < 10 || price <= 0 || images.length < 3} onClick={() => void publish()}>
              {submitting ? "Envoi en validation…" : "Envoyer en validation"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
