"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PickMap } from "@/components/map";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { PageHead } from "@/components/ui";
import { btnPrimary, fieldClass, uid } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { loadOrganizations, submitListing, uploadListingPhoto } from "@/lib/supabase";
import { useAmeena } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import type { Currency, Mode, Organization, PropertyType } from "@/lib/types";

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
  const [price, setPrice] = useState(50000);
  const [currency, setCurrency] = useState<Currency>("XOF");
  const [guests, setGuests] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [description, setDescription] = useState("");
  const [managed, setManaged] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lat, setLat] = useState(defaultPlace.lat);
  const [lng, setLng] = useState(defaultPlace.lng);
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
        managedByPlatform: managed,
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
        <p className="mt-3 text-[#6a6a6a]">Choisissez « Propriétaire » ou « Agence » dans votre compte avant d’envoyer un bien en validation.</p>
        <Link href="/compte" className={`${btnPrimary} mt-7`}>Ouvrir mon compte</Link>
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
            Type d&apos;offre
            <select className={`${fieldClass} mt-1`} value={mode} onChange={(event) => setMode(event.target.value as Mode)}>
              <option value="sejour">Séjour</option>
              <option value="location">Location longue durée</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Type de bien
            <select className={`${fieldClass} mt-1`} value={type} onChange={(event) => setType(event.target.value as PropertyType)}>
              <option value="appartement">Appartement</option>
              <option value="villa">Villa</option>
              <option value="maison">Maison</option>
              <option value="studio">Studio</option>
              <option value="riad">Riad</option>
              <option value="ecolodge">Écolodge</option>
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
        <label className="text-sm font-medium">
          Description
          <textarea className={`${fieldClass} mt-1 min-h-28`} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={managed} onChange={(event) => setManaged(event.target.checked)} />
          Géré par Se Loger au Sénégal — la règle Gestion s&apos;applique
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
        <button className={`${btnPrimary} mt-2`} disabled={submitting || uploading || title.trim().length < 10 || price <= 0 || images.length < 3} onClick={() => void publish()}>
          {submitting ? "Envoi en validation…" : "Envoyer en validation"}
        </button>
      </div>
    </div>
  );
}
