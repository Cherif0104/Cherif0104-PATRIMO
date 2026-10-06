"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHead } from "@/components/ui";
import { btnPrimary, btnSecondary, fieldClass, uid } from "@/lib/format";
import { readImage } from "@/lib/images";
import { INCIDENT_LABEL } from "@/lib/labels";
import { hostById } from "@/lib/seed";
import { useAmeena, useScope } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import type { IncidentCategory } from "@/lib/types";

const sample = "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1400&q=80";

function Form() {
  const params = useSearchParams();
  const router = useRouter();
  const { dispatch } = useAmeena();
  const scope = useScope();
  const [listingId, setListingId] = useState(params.get("bien") || scope.listings[0]?.id || "");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<IncidentCategory>("panne");
  const [description, setDescription] = useState("");
  const [reporter, setReporter] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [sent, setSent] = useState<string | null>(null);
  useTitle("Signaler un incident · Ameena");

  const listing = scope.listings.find((item) => item.id === listingId);
  const host = listing ? hostById(listing.hostId) : undefined;
  const notifiedName = listing?.managedByPlatform ? `${host?.name ?? "Le propriétaire"} et Ameena` : host?.name ?? "Le gestionnaire";

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const next: string[] = [];
    for (const file of Array.from(files).slice(0, 4 - photos.length)) next.push(await readImage(file));
    setPhotos((current) => [...current, ...next].slice(0, 4));
  }

  function submit() {
    if (!listing || !title.trim()) return;
    const id = uid("inc");
    dispatch({
      type: "add-incident",
      incident: {
        id,
        listingId: listing.id,
        title: title.trim(),
        category,
        description: description.trim(),
        photos,
        reporter: reporter.trim() || "Occupant",
        createdAt: new Date().toISOString(),
        status: "nouveau",
        notifiedName,
      },
    });
    setSent(id);
  }

  if (sent) {
    return (
      <div className="max-w-xl rounded-3xl bg-[#e7f4f2] p-6">
        <h1 className="text-2xl font-semibold">Notification envoyée</h1>
        <p className="mt-2 text-sm leading-6">{notifiedName} reçoit le signalement avec {photos.length} photo{photos.length > 1 ? "s" : ""}.</p>
        <button className={`${btnPrimary} mt-4`} onClick={() => router.push(`/gestion/incidents/${sent}`)}>
          Voir le dossier
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHead
        title="Signaler une panne"
        text="Le propriétaire ou l'entité gestionnaire reçoit le dossier automatiquement, photos comprises."
      />
      <div className="grid gap-3">
        <select className={fieldClass} value={listingId} onChange={(event) => setListingId(event.target.value)}>
          {scope.listings.map((item) => (
            <option key={item.id} value={item.id}>{item.title}</option>
          ))}
        </select>
        <p className="rounded-2xl bg-[#f7f7f7] px-4 py-3 text-sm">Destinataire : {notifiedName}</p>
        <select className={fieldClass} value={category} onChange={(event) => setCategory(event.target.value as IncidentCategory)}>
          {Object.entries(INCIDENT_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input className={fieldClass} placeholder="Titre" value={title} onChange={(event) => setTitle(event.target.value)} />
        <textarea className={`${fieldClass} min-h-28`} placeholder="Ce qui se passe, depuis quand" value={description} onChange={(event) => setDescription(event.target.value)} />
        <input className={fieldClass} placeholder="Votre nom" value={reporter} onChange={(event) => setReporter(event.target.value)} />
        <input type="file" accept="image/*" multiple onChange={(event) => addFiles(event.target.files)} />
        <button type="button" className={btnSecondary} onClick={() => setPhotos((current) => [...current, sample].slice(0, 4))}>
          Joindre une photo d&apos;exemple
        </button>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <img key={photo.slice(0, 32)} src={photo} alt="" className="h-24 w-full rounded-xl object-cover" />
          ))}
        </div>
        <button className={btnPrimary} disabled={!title.trim() || !listing} onClick={submit}>Envoyer le signalement</button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Form />
    </Suspense>
  );
}
