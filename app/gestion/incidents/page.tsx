"use client";

import Link from "next/link";
import { PageHead, Pill } from "@/components/ui";
import { btnPrimary, formatDateTime } from "@/lib/format";
import { INCIDENT_LABEL, INCIDENT_STATUS } from "@/lib/labels";
import { useAmeena, useScope } from "@/lib/store";
import { useTitle } from "@/lib/use-title";

export default function IncidentsPage() {
  const { state } = useAmeena();
  const scope = useScope();
  useTitle("Incidents · Se Loger au Sénégal");

  return (
    <div>
      <PageHead
        title="Incidents"
        text="Panne, sinistre ou problème : la photo part avec le signalement vers le propriétaire ou le gestionnaire."
        action={<Link className={btnPrimary} href="/gestion/incidents/nouveau">Signaler</Link>}
      />
      <div className="grid gap-3">
        {scope.incidents.map((incident) => {
          const listing = state.listings.find((item) => item.id === incident.listingId);
          return (
            <Link key={incident.id} href={`/gestion/incidents/${incident.id}`} className="grid gap-4 rounded-3xl border border-[#ebebeb] p-4 sm:grid-cols-[96px_1fr]">
              <div className="h-24 overflow-hidden rounded-2xl bg-[#f3f3f3]">
                {incident.photos[0] && <img src={incident.photos[0]} alt="" className="h-full w-full object-cover" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={incident.status === "resolu" ? "good" : incident.status === "nouveau" ? "bad" : "warn"}>
                    {INCIDENT_STATUS[incident.status]}
                  </Pill>
                  <Pill>{INCIDENT_LABEL[incident.category]}</Pill>
                </div>
                <h2 className="mt-2 font-semibold">{incident.title}</h2>
                <p className="text-sm text-[#6a6a6a]">{listing?.title} · {formatDateTime(incident.createdAt)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
