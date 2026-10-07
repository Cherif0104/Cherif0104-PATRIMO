import { createClient } from "@supabase/supabase-js";
import type { Listing, MarketBooking, Profile, Quote, Settings } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && key ? createClient(url, key) : null;

export async function loadPublishedListings(): Promise<Listing[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("id, owner_id, status, data")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row.data as Listing),
    databaseId: row.id,
    ownerUserId: row.owner_id,
    publicationStatus: row.status,
  }));
}

export async function loadPlatformSettings(): Promise<Settings | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("platform_settings")
    .select("payload")
    .eq("id", "marketplace")
    .maybeSingle();
  if (error) throw error;
  return (data?.payload as Settings | undefined) ?? null;
}

export async function savePlatformSettings(userId: string, settings: Settings) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { error } = await supabase.from("platform_settings").upsert({
    id: "marketplace",
    payload: settings,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  });
  if (error) throw error;
}

export async function submitListing(userId: string, listing: Listing) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const row = {
    slug: listing.id,
    owner_id: userId,
    status: "pending_review",
    mode: listing.mode,
    title: listing.title,
    city: listing.city,
    country: listing.country,
    neighborhood: listing.neighborhood,
    price: listing.price,
    currency: listing.currency,
    lat: listing.lat,
    lng: listing.lng,
    data: { ...listing, ownerUserId: userId, publicationStatus: "pending_review" },
  };
  const { data, error } = await supabase
    .from("marketplace_listings")
    .insert(row)
    .select("id, status")
    .single();
  if (error) throw error;
  return data as { id: string; status: Listing["publicationStatus"] };
}

export async function loadListingsForReview(): Promise<Listing[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("id, owner_id, status, data")
    .in("status", ["pending_review", "suspended"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row.data as Listing),
    databaseId: row.id,
    ownerUserId: row.owner_id,
    publicationStatus: row.status,
  }));
}

export async function reviewListing(id: string, status: "published" | "suspended") {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { error } = await supabase
    .from("marketplace_listings")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function uploadListingPhoto(userId: string, file: File) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("listing-media").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from("listing-media").getPublicUrl(path).data.publicUrl;
}

export async function createMarketBooking(input: {
  listing: Listing;
  userId: string;
  guestName: string;
  guestPhone?: string;
  from: string;
  to: string;
  quote: Quote;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("booking_requests")
    .insert({
      listing_id: input.listing.databaseId ?? null,
      listing_key: input.listing.id,
      listing_title: input.listing.title,
      guest_id: input.userId,
      guest_name: input.guestName,
      guest_phone: input.guestPhone || null,
      mode: input.listing.mode,
      start_date: input.from,
      end_date: input.to,
      status: "requested",
      subtotal: input.quote.subtotal,
      commission: input.quote.commission,
      total: input.quote.guestPays,
      currency: input.quote.currency,
      quote_snapshot: input.quote,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as MarketBooking;
}

export async function loadMyBookings(): Promise<MarketBooking[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MarketBooking[];
}

export async function updateMarketBookingStatus(
  id: string,
  status: "preapproved" | "declined" | "cancelled",
) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("booking_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as MarketBooking;
}

export async function confirmMarketBooking(id: string) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase.rpc("confirm_booking_request", {
    p_booking_id: id,
  });
  if (error) {
    if (error.code === "23P01") {
      throw new Error("Ces dates viennent d’être réservées. Actualisez avant de confirmer.");
    }
    throw error;
  }
  return data as MarketBooking;
}

export async function updateProfile(profile: Pick<Profile, "id" | "full_name" | "phone" | "account_type">) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: profile.full_name,
      phone: profile.phone,
      account_type: profile.account_type,
    })
    .eq("id", profile.id);
  if (error) throw error;
}
