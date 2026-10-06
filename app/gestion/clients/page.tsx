"use client";

import { PageHead, Pill } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { useAmeena, useScope } from "@/lib/store";
import { useTitle } from "@/lib/use-title";

export default function ClientsPage() {
  const { state } = useAmeena();
  const scope = useScope();
  useTitle("Clientèle · Ameena");

  return (
    <div>
      <PageHead title="Clientèle" text="Locataires et voyageurs rattachés à un bien, avec le solde encore dû." />
      <div className="grid gap-3">
        {scope.clients.map((client) => {
          const listing = state.listings.find((item) => item.id === client.listingId);
          return (
            <article key={client.id} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#ebebeb] p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{client.name}</h2>
                  <Pill>{client.kind === "locataire" ? "Locataire" : "Voyageur"}</Pill>
                </div>
                <p className="mt-1 text-sm text-[#6a6a6a]">{listing?.title}</p>
                <p className="mt-1 text-sm text-[#6a6a6a]">{[client.phone, client.email].filter(Boolean).join(" · ") || "Coordonnées à compléter"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6a6a6a]">Solde</p>
                <p className="text-xl font-semibold">{formatMoney(client.balance, client.currency)}</p>
                <p className="text-xs text-[#6a6a6a]">Depuis le {client.since}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
