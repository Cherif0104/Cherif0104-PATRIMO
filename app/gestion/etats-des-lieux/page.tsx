"use client";

import Link from "next/link";
import { PageHead, Pill } from "@/components/ui";
import { btnPrimary, formatDate } from "@/lib/format";
import { useAmeena, useScope } from "@/lib/store";
import { useTitle } from "@/lib/use-title";

export default function InspectionsPage() {
  const { state } = useAmeena();
  const scope = useScope();
  useTitle("États des lieux · Ameena");
  const pairs = scope.listings.filter((listing) => {
    const kinds = scope.inspections.filter((item) => item.listingId === listing.id).map((item) => item.kind);
    return kinds.includes("entree") && kinds.includes("sortie");
  });

  return (
    <div>
      <PageHead
        title="États des lieux"
        text="Entrée, compteurs, sortie. Une fois signé, le document reste horodaté : c'est la pièce témoin du bail."
        action={<Link className={btnPrimary} href="/gestion/etats-des-lieux/nouveau">Nouvel état des lieux</Link>}
      />
      {pairs.length > 0 && (
        <div className="mb-6 rounded-3xl border border-[#ebebeb] p-4">
          <p className="text-sm font-medium">Comparaisons entrée / sortie</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {pairs.map((listing) => (
              <Link key={listing.id} href={`/gestion/etats-des-lieux/comparer/${listing.id}`} className="text-sm underline">
                {listing.neighborhood}
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-3">
        {scope.inspections.map((inspection) => {
          const listing = state.listings.find((item) => item.id === inspection.listingId);
          return (
            <Link key={inspection.id} href={`/gestion/etats-des-lieux/${inspection.id}`} className="flex items-center justify-between gap-4 rounded-3xl border border-[#ebebeb] p-4">
              <div>
                <div className="flex gap-2">
                  <Pill tone={inspection.kind === "entree" ? "good" : "warn"}>{inspection.kind === "entree" ? "Entrée" : "Sortie"}</Pill>
                  {inspection.signedAt && <Pill>Signé</Pill>}
                </div>
                <p className="mt-2 font-semibold">{listing?.title}</p>
                <p className="text-sm text-[#6a6a6a]">{formatDate(inspection.date)} · {inspection.author}</p>
              </div>
              <span className="text-sm underline">Ouvrir</span>
            </Link>
          );
        })}
        {scope.inspections.length === 0 && <p className="text-sm text-[#6a6a6a]">Aucun état des lieux pour ce portefeuille.</p>}
      </div>
    </div>
  );
}
