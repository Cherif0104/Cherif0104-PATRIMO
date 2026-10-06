"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Pill } from "@/components/ui";
import { ROOM_LABEL } from "@/lib/labels";
import { useAmeena } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import type { RoomState } from "@/lib/types";

const rank: Record<RoomState, number> = { neuf: 0, bon: 1, use: 2, degrade: 3 };

export default function ComparePage() {
  const { listingId } = useParams<{ listingId: string }>();
  const { state } = useAmeena();
  const listing = state.listings.find((item) => item.id === listingId);
  const entry = state.inspections.find((item) => item.listingId === listingId && item.kind === "entree");
  const exit = state.inspections.find((item) => item.listingId === listingId && item.kind === "sortie");
  useTitle("Comparaison · Ameena");

  if (!listing || !entry || !exit) {
    return (
      <div>
        <p>Il faut un état d&apos;entrée et un état de sortie pour comparer.</p>
        <Link className="mt-3 inline-block underline" href={`/gestion/etats-des-lieux/nouveau?bien=${listingId}`}>
          Rédiger la pièce manquante
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <Link href="/gestion/etats-des-lieux" className="text-sm underline">États des lieux</Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Entrée et restitution</h1>
      <p className="mt-2 text-[#6a6a6a]">{listing.title}</p>
      <div className="mt-6 overflow-hidden rounded-3xl border border-[#ebebeb]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fafafa]">
            <tr>
              <th className="px-4 py-3 font-medium">Pièce</th>
              <th className="px-4 py-3 font-medium">Entrée</th>
              <th className="px-4 py-3 font-medium">Sortie</th>
            </tr>
          </thead>
          <tbody>
            {entry.rooms.map((room) => {
              const after = exit.rooms.find((item) => item.name === room.name);
              const worse = after ? rank[after.state] > rank[room.state] : false;
              return (
                <tr key={room.name} className="border-t border-[#f2f2f2]">
                  <td className="px-4 py-3 font-medium">{room.name}</td>
                  <td className="px-4 py-3">{ROOM_LABEL[room.state]}</td>
                  <td className="px-4 py-3">
                    {after ? ROOM_LABEL[after.state] : "—"}
                    {worse && <Pill tone="bad">Dégradé</Pill>}
                  </td>
                </tr>
              );
            })}
            {entry.meters.map((meter) => {
              const after = exit.meters.find((item) => item.kind === meter.kind);
              const delta = after && meter.index && after.index ? Number(after.index) - Number(meter.index) : null;
              return (
                <tr key={meter.kind} className="border-t border-[#f2f2f2]">
                  <td className="px-4 py-3 font-medium">{meter.kind === "eau" ? "Compteur d'eau" : "Compteur électrique"}</td>
                  <td className="px-4 py-3">{meter.index || "—"} {meter.unit}</td>
                  <td className="px-4 py-3">
                    {after?.index || "—"} {after?.unit}
                    {delta !== null && !Number.isNaN(delta) && <span className="text-[#6a6a6a]"> · écart {delta}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
