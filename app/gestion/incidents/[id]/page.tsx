"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHead, Pill } from "@/components/ui";
import { btnSecondary, formatDateTime } from "@/lib/format";
import { INCIDENT_LABEL, INCIDENT_STATUS } from "@/lib/labels";
import { useAmeena } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import type { IncidentStatus } from "@/lib/types";

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useAmeena();
  const incident = state.incidents.find((item) => item.id === id);
  const listing = state.listings.find((item) => item.id === incident?.listingId);
  useTitle(incident ? `${incident.title} · Se Loger au Sénégal` : "Incident · Se Loger au Sénégal");

  if (!incident) {
    return <p className="text-sm text-[#6a6a6a]">Signalement introuvable.</p>;
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
        Notification envoyée à {incident.notifiedName} le {formatDateTime(incident.createdAt)}, avec {incident.photos.length} photo{incident.photos.length > 1 ? "s" : ""}.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {incident.photos.map((photo) => (
          <img key={photo.slice(0, 48)} src={photo} alt="Photo du signalement" className="h-56 w-full rounded-2xl object-cover" />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {(["nouveau", "pris-en-charge", "resolu"] as IncidentStatus[]).map((status) => (
          <button
            key={status}
            className={btnSecondary}
            onClick={() => dispatch({ type: "set-incident-status", id: incident.id, status })}
          >
            {INCIDENT_STATUS[status]}
          </button>
        ))}
      </div>
    </div>
  );
}
