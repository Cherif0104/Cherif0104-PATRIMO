"use client";

import { useEffect, useState } from "react";
import type { Offer, OfferKind } from "./catalog";
import { loadPublishedOffers } from "./supabase";

export function usePublishedOffers(kind?: OfferKind) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPublishedOffers(kind)
      .then(setOffers)
      .catch(() => setError("Le catalogue ne peut pas être chargé."))
      .finally(() => setLoading(false));
  }, [kind]);

  return { offers, loading, error };
}
