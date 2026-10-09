"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Pill } from "@/components/ui";
import { btnSecondary, formatDate, formatDateTime } from "@/lib/format";
import { ROOM_LABEL } from "@/lib/labels";
import { useAmeena } from "@/lib/store";
import { useTitle } from "@/lib/use-title";

export default function InspectionPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useAmeena();
  const inspection = state.inspections.find((item) => item.id === id);
  const listing = state.listings.find((item) => item.id === inspection?.listingId);
  const twin = state.inspections.find(
    (item) => item.listingId === inspection?.listingId && item.kind !== inspection?.kind && item.id !== inspection?.id,
  );
  useTitle("État des lieux · Se Loger au Sénégal");

  if (!inspection || !listing) return <p>Document introuvable.</p>;

  return (
    <article className="mx-auto max-w-3xl">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/gestion/etats-des-lieux" className="text-sm underline">États des lieux</Link>
        <button className={btnSecondary} onClick={() => window.print()}>Imprimer</button>
      </div>
      <p className="text-sm uppercase tracking-[0.16em] text-[#6a6a6a]">Outil témoin</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        État des lieux {inspection.kind === "entree" ? "d'entrée" : "de sortie"}
      </h1>
      <p className="mt-2 text-[15px]">{listing.title}</p>
      <p className="text-sm text-[#6a6a6a]">{listing.neighborhood}, {listing.city} · {formatDate(inspection.date)} · {inspection.author}</p>
      {inspection.signedAt ? (
        <p className="mt-4 rounded-2xl border border-[#1F6F66] bg-[#f6fbfa] px-4 py-3 text-sm leading-6">
          Document signé le {formatDateTime(inspection.signedAt)}. Il constate l&apos;état des lieux et des compteurs à cette date.
        </p>
      ) : (
        <p className="mt-4 text-sm text-[#8a5a00]">Brouillon, pas encore signé.</p>
      )}

      <h2 className="mb-3 mt-8 text-xl font-semibold">Pièces</h2>
      <div className="space-y-3">
        {inspection.rooms.map((room) => (
          <section key={room.name} className="rounded-2xl border border-[#ebebeb] p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{room.name}</h3>
              <Pill tone={room.state === "degrade" ? "bad" : room.state === "use" ? "warn" : "good"}>{ROOM_LABEL[room.state]}</Pill>
            </div>
            {room.notes && <p className="mt-2 text-sm leading-6">{room.notes}</p>}
            {room.photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {room.photos.map((photo) => (
                  <img key={photo.slice(0, 24)} src={photo} alt="" className="h-24 w-full rounded-xl object-cover" />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-xl font-semibold">Compteurs</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {inspection.meters.map((meter) => (
          <div key={meter.kind} className="rounded-2xl border border-[#ebebeb] p-4">
            <p className="text-sm text-[#6a6a6a]">{meter.kind === "eau" ? "Eau" : "Électricité"}</p>
            <p className="text-2xl font-semibold">{meter.index || "—"} <span className="text-base font-normal">{meter.unit}</span></p>
            {meter.photo && <img src={meter.photo} alt="Compteur" className="mt-3 h-32 w-full rounded-xl object-cover" />}
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm">Clés remises : {inspection.keys}</p>
      {inspection.comments && <p className="mt-2 text-sm leading-6">{inspection.comments}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Signature label="Locataire" name={inspection.tenantSignature} />
        <Signature label="Propriétaire ou gestionnaire" name={inspection.ownerSignature} />
      </div>
      {twin && (
        <p className="no-print mt-8">
          <Link className="underline" href={`/gestion/etats-des-lieux/comparer/${listing.id}`}>
            Comparer l&apos;entrée et la sortie
          </Link>
        </p>
      )}
    </article>
  );
}

function Signature({ label, name }: { label: string; name?: string }) {
  return (
    <div className="rounded-2xl border border-[#ebebeb] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-[#6a6a6a]">{label}</p>
      <p className="logo-word mt-4 text-2xl">{name || "—"}</p>
      <p className="mt-2 text-xs text-[#6a6a6a]">Lu et approuvé</p>
    </div>
  );
}
