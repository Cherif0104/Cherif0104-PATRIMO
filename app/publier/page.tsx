"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PickMap } from "@/components/map";
import { PageHead } from "@/components/ui";
import { btnPrimary, btnSecondary, fieldClass, roleLabel, uid } from "@/lib/format";
import { readImage } from "@/lib/images";
import { hostIdForRole } from "@/lib/seed";
import { useAmeena } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import type { Currency, Mode, PropertyType } from "@/lib/types";

const places = [
  { label: "Dakar · Almadies", city: "Dakar", country: "Sénégal", neighborhood: "Almadies", lat: 14.745, lng: -17.52 },
  { label: "Dakar · Plateau", city: "Dakar", country: "Sénégal", neighborhood: "Plateau", lat: 14.668, lng: -17.43 },
  { label: "Saly", city: "Saly", country: "Sénégal", neighborhood: "Saly", lat: 14.449, lng: -17.02 },
  { label: "Saint-Louis", city: "Saint-Louis", country: "Sénégal", neighborhood: "Île", lat: 16.025, lng: -16.505 },
  { label: "Abidjan", city: "Abidjan", country: "Côte d'Ivoire", neighborhood: "Cocody", lat: 5.36, lng: -3.987 },
  { label: "Marrakech", city: "Marrakech", country: "Maroc", neighborhood: "Médina", lat: 31.63, lng: -7.981 },
  { label: "Paris", city: "Paris", country: "France", neighborhood: "11e", lat: 48.863, lng: 2.378 },
];

export default function PublishPage() {
  const { state, dispatch } = useAmeena();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState(places[0]);
  const [mode, setMode] = useState<Mode>("sejour");
  const [type, setType] = useState<PropertyType>("appartement");
  const [price, setPrice] = useState(50000);
  const [currency, setCurrency] = useState<Currency>("XOF");
  const [guests, setGuests] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [description, setDescription] = useState("");
  const [managed, setManaged] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [lat, setLat] = useState(places[0].lat);
  const [lng, setLng] = useState(places[0].lng);
  useTitle("Publier un bien · Ameena");

  const professional = state.role === "proprietaire" || state.role === "agence" || state.role === "admin";

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const next: string[] = [];
    for (const file of Array.from(files).slice(0, 5 - images.length)) {
      next.push(await readImage(file));
    }
    setImages((current) => [...current, ...next].slice(0, 5));
  }

  function publish() {
    if (!title.trim()) return;
    const id = uid("bien");
    dispatch({
      type: "add-listing",
      listing: {
        id,
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
        images: images.length ? images : ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1800&q=80"],
        lat,
        lng,
        description: description.trim() || "Bien publié en direct sur Ameena.",
        amenities: ["Wifi"],
        hostId: hostIdForRole(state.role),
        managedByPlatform: managed,
        reviews: [],
      },
    });
    router.push(`/logements/${id}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHead
        eyebrow="Publication"
        title="Mettre un bien en ligne"
        text="Le logement rejoint la carte tout de suite. La commission appliquée est celle des réglages en cours."
      />
      {!professional && (
        <div className="mb-6 rounded-2xl bg-[#f7f7f7] p-4 text-sm leading-6">
          Vous êtes en vue voyageur. Choisissez un espace pour signer la publication.
          <div className="mt-3 flex gap-2">
            <button className={btnSecondary} onClick={() => dispatch({ type: "set-role", role: "proprietaire" })}>
              {roleLabel("proprietaire")}
            </button>
            <button className={btnSecondary} onClick={() => dispatch({ type: "set-role", role: "agence" })}>
              {roleLabel("agence")}
            </button>
          </div>
        </div>
      )}
      <div className="grid gap-4">
        <label className="text-sm font-medium">
          Titre
          <input className={`${fieldClass} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Appartement lumineux à ..." />
        </label>
        <label className="text-sm font-medium">
          Lieu
          <select
            className={`${fieldClass} mt-1`}
            value={place.label}
            onChange={(event) => {
              const next = places.find((item) => item.label === event.target.value) ?? places[0];
              setPlace(next);
              setLat(next.lat);
              setLng(next.lng);
              setCurrency(next.country === "France" || next.country === "Maroc" ? "EUR" : "XOF");
            }}
          >
            {places.map((item) => (
              <option key={item.label}>{item.label}</option>
            ))}
          </select>
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
            <input className={`${fieldClass} mt-1`} type="number" min={0} value={price} onChange={(event) => setPrice(Number(event.target.value))} />
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
          Géré par Ameena — la règle Gestion s&apos;applique
        </label>
        <label className="text-sm font-medium">
          Photos
          <input className="mt-2 block text-sm" type="file" accept="image/*" multiple onChange={(event) => onFiles(event.target.files)} />
        </label>
        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((image) => (
              <img key={image.slice(0, 40)} src={image} alt="" className="h-20 w-full rounded-xl object-cover" />
            ))}
          </div>
        )}
        <button className={`${btnPrimary} mt-2`} disabled={!professional || !title.trim()} onClick={publish}>
          Publier
        </button>
      </div>
    </div>
  );
}
