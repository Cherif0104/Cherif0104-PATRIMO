import "server-only";

import { createServerSupabaseClient } from "./supabase-server-client";
import type { Listing } from "./types";
import type { Offer } from "./catalog";

export async function getPublishedListingBySlug(slug: string): Promise<Listing | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("marketplace_listings")
    .select("id, owner_id, organization_id, status, data")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;
  return {
    ...(data.data as Listing),
    id: slug,
    databaseId: data.id,
    ownerUserId: data.owner_id,
    organizationId: data.organization_id ?? undefined,
    publicationStatus: data.status,
  };
}

export async function getPublishedOfferBySlug(slug: string, kind: Offer["kind"]): Promise<Offer | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("marketplace_offers")
    .select("id, slug, owner_id, status, data")
    .eq("slug", slug)
    .eq("kind", kind)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;
  return {
    ...(data.data as Offer),
    id: data.slug,
    databaseId: data.id,
    ownerUserId: data.owner_id ?? undefined,
    publicationStatus: data.status,
  };
}
