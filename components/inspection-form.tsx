"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, fieldClass, todayISO, uid } from "@/lib/format";
import { readImage } from "@/lib/images";
import { DEFAULT_ROOMS, ROOM_LABEL } from "@/lib/labels";
import { useAmeena, useScope } from "@/lib/store";
import type { Inspection, RoomCheck, RoomState } from "@/lib/types";

export function InspectionForm({ presetListing }: { presetListing?: string }) {
  const router = useRouter();
  const { listings, dispatch } = useScopeDispatch();
  const [listingId, setListingId] = useState(presetListing || listings[0]?.id || "");
  const [kind, setKind] = useState<Inspection["kind"]>("entree");
  const [date, setDate] = useState(todayISO());
  const [author, setAuthor] = useState("");
  const [rooms, setRooms] = useState<RoomCheck[]>(
    DEFAULT_ROOMS.map((name) => ({ name, state: "bon", notes: "", photos: [] })),
  );
  const [water, setWater] = useState("");
  const [power, setPower] = useState("");
  const [waterPhoto, setWaterPhoto] = useState("");
  const [powerPhoto, setPowerPhoto] = useState("");
  const [keys, setKeys] = useState(2);
  const [comments, setComments] = useState("");
  const [tenant, setTenant] = useState("");
  const [owner, setOwner] = useState("");

  function updateRoom(index: number, partial: Partial<RoomCheck>) {
    setRooms((current) => current.map((room, i) => (i === index ? { ...room, ...partial } : room)));
  }

  function save(sign: boolean) {
    if (!listingId) return;
    const inspection: Inspection = {
      id: uid("edl"),
      listingId,
      kind,
      date,
      author: author.trim() || "Se Loger au Sénégal",
      rooms,
      meters: [
        { kind: "eau", index: water, unit: "m³", photo: waterPhoto || undefined },
        { kind: "electricite", index: power, unit: "kWh", photo: powerPhoto || undefined },
      ],
      keys,
      comments,
      tenantSignature: sign ? tenant.trim() : undefined,
      ownerSignature: sign ? owner.trim() : undefined,
      signedAt: sign && tenant.trim() && owner.trim() ? new Date().toISOString() : undefined,
    };
    dispatch(inspection);
    router.push(`/gestion/etats-des-lieux/${inspection.id}`);
  }

  return (
    <div className="grid max-w-3xl gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <select className={fieldClass} value={listingId} onChange={(event) => setListingId(event.target.value)}>
          {listings.map((listing) => (
            <option key={listing.id} value={listing.id}>{listing.title}</option>
          ))}
        </select>
        <select className={fieldClass} value={kind} onChange={(event) => setKind(event.target.value as Inspection["kind"])}>
          <option value="entree">Entrée</option>
          <option value="sortie">Sortie / restitution</option>
        </select>
        <input className={fieldClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <input className={fieldClass} placeholder="Rédigé par" value={author} onChange={(event) => setAuthor(event.target.value)} />
      </div>

      {rooms.map((room, index) => (
        <fieldset key={room.name} className="rounded-3xl border border-[#ebebeb] p-4">
          <legend className="px-1 font-semibold">{room.name}</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <select className={fieldClass} value={room.state} onChange={(event) => updateRoom(index, { state: event.target.value as RoomState })}>
              {Object.entries(ROOM_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <input className={fieldClass} placeholder="Observations" value={room.notes} onChange={(event) => updateRoom(index, { notes: event.target.value })} />
          </div>
          <input
            className="mt-3 block text-sm"
            type="file"
            accept="image/*"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const photo = await readImage(file);
              updateRoom(index, { photos: [...room.photos, photo] });
            }}
          />
        </fieldset>
      ))}

      <fieldset className="rounded-3xl border border-[#ebebeb] p-4">
        <legend className="px-1 font-semibold">Compteurs</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Eau (m³)
            <input className={`${fieldClass} mt-1`} value={water} onChange={(event) => setWater(event.target.value)} />
            <input className="mt-2 block text-sm" type="file" accept="image/*" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) setWaterPhoto(await readImage(file));
            }} />
          </label>
          <label className="text-sm">
            Électricité (kWh)
            <input className={`${fieldClass} mt-1`} value={power} onChange={(event) => setPower(event.target.value)} />
            <input className="mt-2 block text-sm" type="file" accept="image/*" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) setPowerPhoto(await readImage(file));
            }} />
          </label>
        </div>
      </fieldset>

      <label className="text-sm">
        Nombre de clés
        <input className={`${fieldClass} mt-1 max-w-[120px]`} type="number" min={0} value={keys} onChange={(event) => setKeys(Number(event.target.value))} />
      </label>
      <textarea className={`${fieldClass} min-h-24`} placeholder="Réserves générales" value={comments} onChange={(event) => setComments(event.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={fieldClass} placeholder="Signature du locataire — nom" value={tenant} onChange={(event) => setTenant(event.target.value)} />
        <input className={fieldClass} placeholder="Signature du propriétaire — nom" value={owner} onChange={(event) => setOwner(event.target.value)} />
      </div>
      <div className="flex flex-wrap gap-3">
        <button className={btnPrimary} onClick={() => save(false)}>Enregistrer le brouillon</button>
        <button className={btnPrimary} disabled={!tenant.trim() || !owner.trim()} onClick={() => save(true)}>
          Signer et horodater
        </button>
      </div>
    </div>
  );
}

function useScopeDispatch() {
  const scope = useScope();
  const { dispatch } = useAmeena();
  return {
    listings: scope.listings,
    dispatch: (inspection: Inspection) => dispatch({ type: "add-inspection", inspection }),
  };
}
