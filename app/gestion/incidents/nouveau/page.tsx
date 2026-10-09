"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHead } from "@/components/ui";
import { btnPrimary, fieldClass } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { INCIDENT_LABEL } from "@/lib/labels";
import { createPropertyIncident } from "@/lib/supabase";
import { useScope } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import type { IncidentCategory } from "@/lib/types";

function Form() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const scope = useScope();
  const [listingId, setListingId] = useState(params.get("bien") || scope.listings[0]?.id || "");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<IncidentCategory>("panne");
  const [description, setDescription] = useState("");
  const [reporter, setReporter] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useTitle("Signaler un incident · Se Loger au Sénégal");

  const listing = scope.listings.find((item) => item.id === listingId);
  const notifiedName = listing?.managedByPlatform ? "L’équipe de gestion et le propriétaire" : "Votre équipe de gestion";

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    setFiles((current) => [...current, ...Array.from(selected)].slice(0, 4));
  }

  async function submit() {
    if (!listing?.databaseId || !title.trim() || !user) return;
    setBusy(true);
    setError("");
    try {
      const id = await createPropertyIncident({
        listingId: listing.databaseId,
        userId: user.id,
        title,
        category,
        description,
        reporter: reporter.trim() || profile?.full_name || "Gestionnaire",
        files,
      });
      setSent(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Le signalement n’a pas pu être enregistré.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-xl rounded-3xl bg-[#e7f4f2] p-6">
        <h1 className="text-2xl font-semibold">Notification envoyée</h1>
        <p className="mt-2 text-sm leading-6">{notifiedName} reçoit le signalement avec {files.length} photo{files.length > 1 ? "s" : ""}.</p>
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
        {files.length > 0 && <p className="text-sm text-[#6a6a6a]">{files.map((file) => file.name).join(", ")}</p>}
        {error && <p role="alert" className="text-sm text-[#a52a12]">{error}</p>}
        <button className={btnPrimary} disabled={busy || !title.trim() || !listing?.databaseId} onClick={() => void submit()}>
          {busy ? "Enregistrement sécurisé…" : "Envoyer le signalement"}
        </button>
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
