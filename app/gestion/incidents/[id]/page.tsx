"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHead, Pill } from "@/components/ui";
import { btnSecondary, formatDateTime } from "@/lib/format";
import { INCIDENT_LABEL, INCIDENT_STATUS } from "@/lib/labels";
import { loadPropertyIncidents, updatePropertyIncidentStatus } from "@/lib/supabase";
import { useScope } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import type { IncidentStatus, PropertyIncident } from "@/lib/types";

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const scope = useScope();
  const [incident, setIncident] = useState<PropertyIncident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const listing = scope.listings.find((item) => item.databaseId === incident?.listing_id);
  useTitle(incident ? `${incident.title} · Se Loger au Sénégal` : "Incident · Se Loger au Sénégal");

  useEffect(() => {
    loadPropertyIncidents()
      .then((rows) => setIncident(rows.find((row) => row.id === id) ?? null))
      .catch(() => setError("Le signalement ne peut pas être chargé."))
      .finally(() => setLoading(false));
  }, [id]);

  async function changeStatus(status: IncidentStatus) {
    if (!incident) return;
    setBusy(true);
    setError("");
    try {
      await updatePropertyIncidentStatus(incident.id, status);
      setIncident({
        ...incident,
        status,
        resolved_at: status === "resolu" ? new Date().toISOString() : null,
      });
    } catch {
      setError("Le statut n’a pas pu être enregistré.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-[#6a6a6a]">Chargement du signalement…</p>;
  if (!incident) {
    return <p className="text-sm text-[#6a6a6a]">{error || "Signalement introuvable."}</p>;
  }

  return (
    <div className="max-w-3xl">
      <Link href="/gestion/incidents" className="text-sm underline">Incidents</Link>
      <PageHead title={incident.title} text={`${listing?.title ?? "Bien"} · signalé par ${incident.reporter}`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Pill tone={incident.status === "resolu" ? "good" : incident.status === "nouveau" ? "bad" : "warn"}>
          {INCIDENT_STATUS[incident.status]}
        </Pill>
        <Pill>{INCIDENT_LABEL[incident.category]}</Pill>
      </div>
      <p className="text-[16px] leading-7">{incident.description}</p>
      <p className="mt-4 rounded-2xl bg-[#f6fbfa] px-4 py-3 text-sm leading-6">
        Signalement enregistré le {formatDateTime(incident.created_at)}, avec {incident.photos.length} photo{incident.photos.length > 1 ? "s" : ""}.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {incident.photos.map((photo) => (
          <img key={photo.slice(0, 48)} src={photo} alt="Photo du signalement" className="h-56 w-full rounded-2xl object-cover" />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {error && <p role="alert" className="w-full text-sm text-[#a52a12]">{error}</p>}
        {(["nouveau", "pris-en-charge", "resolu"] as IncidentStatus[]).map((status) => (
          <button
            key={status}
            className={btnSecondary}
            disabled={busy || incident.status === status}
            onClick={() => void changeStatus(status)}
          >
            {INCIDENT_STATUS[status]}
          </button>
        ))}
      </div>
    </div>
  );
}
