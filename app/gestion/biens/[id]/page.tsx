"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarOff, Save, Trash2 } from "lucide-react";
import { PageHead, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { btnPrimary, btnSecondary, fieldClass, formatDate } from "@/lib/format";
import {
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  loadAvailabilityBlocks,
  setOwnedListingStatus,
  updateOwnedListing,
} from "@/lib/supabase";
import { useAmeena, useScope } from "@/lib/store";
import type { AvailabilityBlock } from "@/lib/types";
import { useTitle } from "@/lib/use-title";

export default function ManageListingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { dispatch, ready } = useAmeena();
  const scope = useScope();
  const listing = scope.listings.find((item) => item.id === id);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useTitle("Gérer le bien · Se Loger au Sénégal");

  useEffect(() => {
    if (!listing) return;
    setTitle(listing.title);
    setPrice(listing.price);
    setDescription(listing.description);
    if (listing.databaseId) {
      loadAvailabilityBlocks(listing.databaseId)
        .then(setBlocks)
        .catch(() => setError("Le calendrier ne peut pas être chargé."));
    }
  }, [listing]);

  if (!ready) return <p className="text-sm text-[#6a6a6a]">Chargement du bien…</p>;
  if (!listing || !listing.databaseId || !user) {
    return (
      <div className="rounded-3xl border border-dashed border-[#cccccc] p-8 text-center">
        <h1 className="text-2xl font-semibold">Bien introuvable</h1>
        <Link href="/gestion/biens" className={`${btnSecondary} mt-5`}>Retour aux biens</Link>
      </div>
    );
  }

  async function saveListing(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim().length < 10 || price <= 0) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateOwnedListing({
        ...listing!,
        title: title.trim(),
        price,
        description: description.trim(),
      });
      dispatch({ type: "merge-marketplace-listings", listings: [updated] });
      setMessage("Annonce enregistrée.");
    } catch {
      setError("L’annonce n’a pas pu être enregistrée.");
    } finally {
      setBusy(false);
    }
  }

  async function addBlock(event: React.FormEvent) {
    event.preventDefault();
    if (!startDate || !endDate || endDate <= startDate) {
      setError("La date de fin doit suivre la date de début.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const block = await createAvailabilityBlock({
        listingId: listing!.databaseId!,
        userId: user!.id,
        startDate,
        endDate,
        source: "owner",
        note,
      });
      setBlocks((rows) => [...rows, block].sort((a, b) => a.start_date.localeCompare(b.start_date)));
      setStartDate("");
      setEndDate("");
      setNote("");
    } catch (cause) {
      setError(
        cause instanceof Error && "code" in cause && cause.code === "23P01"
          ? "Cette période chevauche déjà une indisponibilité ou une réservation."
          : "La période n’a pas pu être bloquée.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeBlock(block: AvailabilityBlock) {
    setBusy(true);
    setError("");
    try {
      await deleteAvailabilityBlock(block.id);
      setBlocks((rows) => rows.filter((row) => row.id !== block.id));
    } catch {
      setError("Cette indisponibilité ne peut pas être supprimée.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: "archived" | "pending_review") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updated = await setOwnedListingStatus(listing!, status);
      dispatch({ type: "merge-marketplace-listings", listings: [updated] });
      setMessage(status === "archived" ? "Annonce archivée et retirée du catalogue." : "Annonce envoyée à l’équipe pour validation.");
    } catch {
      setError("Le statut de l’annonce n’a pas pu être modifié.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHead
        eyebrow="Bien réel"
        title={listing.title}
        text="Modifiez les informations commerciales et bloquez les périodes pendant lesquelles le logement ne peut pas être demandé."
        action={<Link href={`/logements/${listing.id}`} className={btnSecondary}>Voir la fiche</Link>}
      />
      {error && <p role="alert" className="mb-4 rounded-xl bg-[#fff1ee] px-4 py-3 text-sm text-[#a52a12]">{error}</p>}
      {message && <p className="mb-4 rounded-xl bg-[#e7f4f2] px-4 py-3 text-sm text-[#145e57]">{message}</p>}

      <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
        <form onSubmit={saveListing} className="grid gap-4 rounded-3xl border border-[#ebebeb] p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Informations de l’annonce</h2>
            <Pill tone={listing.publicationStatus === "published" ? "good" : "warn"}>{listing.publicationStatus || "brouillon"}</Pill>
          </div>
          <label className="text-sm font-medium">
            Titre
            <input className={`${fieldClass} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} minLength={10} maxLength={140} required />
          </label>
          <label className="text-sm font-medium">
            Prix {listing.mode === "sejour" ? "par nuit" : "par mois"}
            <input className={`${fieldClass} mt-1`} type="number" min={1} value={price} onChange={(event) => setPrice(Number(event.target.value))} required />
          </label>
          <label className="text-sm font-medium">
            Description
            <textarea className={`${fieldClass} mt-1 min-h-40`} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={4000} />
          </label>
          <button className={btnPrimary} disabled={busy || title.trim().length < 10 || price <= 0}>
            <Save className="h-4 w-4" /> {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
          <div className="flex flex-wrap gap-2 border-t border-[#eeeeee] pt-4">
            {listing.publicationStatus !== "pending_review" && (
              <button type="button" className={btnSecondary} disabled={busy} onClick={() => void changeStatus("pending_review")}>
                Soumettre à nouveau
              </button>
            )}
            {listing.publicationStatus !== "archived" && (
              <button type="button" className={btnSecondary} disabled={busy} onClick={() => void changeStatus("archived")}>
                Archiver l’annonce
              </button>
            )}
          </div>
        </form>

        <section className="rounded-3xl border border-[#ebebeb] p-5">
          <div className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5 text-[#FF385C]" />
            <h2 className="text-xl font-semibold">Indisponibilités</h2>
          </div>
          <form onSubmit={addBlock} className="mt-5 grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-medium">Du<input className={`${fieldClass} mt-1`} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
              <label className="text-xs font-medium">Au<input className={`${fieldClass} mt-1`} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
            </div>
            <label className="text-xs font-medium">Motif privé<input className={`${fieldClass} mt-1`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Travaux, occupation personnelle…" /></label>
            <button className={btnSecondary} disabled={busy || !startDate || !endDate}>Bloquer la période</button>
          </form>
          <div className="mt-5 grid gap-2">
            {blocks.map((block) => (
              <div key={block.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7f7f7] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{formatDate(block.start_date)} → {formatDate(block.end_date)}</p>
                  {block.note && <p className="mt-1 text-xs text-[#6a6a6a]">{block.note}</p>}
                </div>
                <button type="button" aria-label="Supprimer" disabled={busy} onClick={() => void removeBlock(block)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {blocks.length === 0 && <p className="rounded-2xl border border-dashed border-[#cccccc] p-4 text-sm text-[#6a6a6a]">Aucune indisponibilité manuelle.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
