import { createBrowserClient } from "@supabase/ssr";
import type {
  AvailabilityBlock,
  Conversation,
  ConversationMessage,
  HostPublicProfile,
  Listing,
  MarketBooking,
  OfferRequest,
  PaymentOrder,
  Payout,
  Profile,
  Quote,
  Refund,
  Settings,
  VerificationDocument,
  VerificationRequest,
} from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && key ? createBrowserClient(url, key) : null;

export async function loadFavorites(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("favorites")
    .select("listing_key")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.listing_key as string);
}

export async function setFavorite(userId: string, listingKey: string, saved: boolean) {
  if (!supabase) return;
  const query = saved
    ? supabase.from("favorites").upsert({ user_id: userId, listing_key: listingKey })
    : supabase.from("favorites").delete().eq("user_id", userId).eq("listing_key", listingKey);
  const { error } = await query;
  if (error) throw error;
}

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

export async function loadOwnedListings(userId: string): Promise<Listing[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("id, owner_id, status, data")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row.data as Listing),
    databaseId: row.id,
    ownerUserId: row.owner_id,
    publicationStatus: row.status,
  }));
}

export async function updateOwnedListing(listing: Listing) {
  if (!supabase || !listing.databaseId) throw new Error("Annonce persistante introuvable.");
  const { data, error } = await supabase
    .from("marketplace_listings")
    .update({
      mode: listing.mode,
      title: listing.title.trim(),
      city: listing.city.trim(),
      country: listing.country.trim(),
      neighborhood: listing.neighborhood.trim(),
      price: listing.price,
      currency: listing.currency,
      lat: listing.lat,
      lng: listing.lng,
      data: listing,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listing.databaseId)
    .select("id, owner_id, status, data")
    .single();
  if (error) throw error;
  return {
    ...(data.data as Listing),
    databaseId: data.id,
    ownerUserId: data.owner_id,
    publicationStatus: data.status,
  } as Listing;
}

export async function setOwnedListingStatus(listing: Listing, status: "archived" | "pending_review") {
  if (!supabase || !listing.databaseId) throw new Error("Annonce persistante introuvable.");
  const { data, error } = await supabase.rpc("set_owner_listing_status", {
    p_listing_id: listing.databaseId,
    p_status: status,
  });
  if (error) throw error;
  const row = data as {
    id: string;
    owner_id: string;
    status: Listing["publicationStatus"];
    data: Listing;
  };
  return {
    ...row.data,
    databaseId: row.id,
    ownerUserId: row.owner_id,
    publicationStatus: row.status,
  } as Listing;
}

export async function loadAvailabilityBlocks(listingId: string): Promise<AvailabilityBlock[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("availability_blocks")
    .select("*")
    .eq("listing_id", listingId)
    .in("source", ["owner", "maintenance", "external"])
    .order("start_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AvailabilityBlock[];
}

export async function createAvailabilityBlock(input: {
  listingId: string;
  userId: string;
  startDate: string;
  endDate: string;
  source: "owner" | "maintenance" | "external";
  note?: string;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("availability_blocks")
    .insert({
      listing_id: input.listingId,
      created_by: input.userId,
      start_date: input.startDate,
      end_date: input.endDate,
      source: input.source,
      note: input.note?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as AvailabilityBlock;
}

export async function deleteAvailabilityBlock(id: string) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { error } = await supabase
    .from("availability_blocks")
    .delete()
    .eq("id", id)
    .in("source", ["owner", "maintenance", "external"]);
  if (error) throw error;
}

export async function loadHostPublicProfile(ownerId: string): Promise<HostPublicProfile | null> {
  if (!supabase || !ownerId) return null;
  const { data, error } = await supabase
    .from("host_public_profiles")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return (data as HostPublicProfile | null) ?? null;
}

export async function saveHostPublicProfile(input: {
  ownerId: string;
  displayName: string;
  businessName?: string;
  bio?: string;
  whatsappE164?: string;
  whatsappEnabled: boolean;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("host_public_profiles")
    .upsert({
      owner_id: input.ownerId,
      display_name: input.displayName.trim(),
      business_name: input.businessName?.trim() || null,
      bio: input.bio?.trim() || null,
      whatsapp_e164: input.whatsappEnabled ? input.whatsappE164?.trim() || null : null,
      whatsapp_enabled: input.whatsappEnabled,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as HostPublicProfile;
}

export async function loadMyVerificationRequest(): Promise<VerificationRequest | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("verification_requests")
    .select("*")
    .in("status", ["pending", "reviewing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as VerificationRequest | null) ?? null;
}

export async function loadVerificationRequests(): Promise<VerificationRequest[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("verification_requests")
    .select("*")
    .in("status", ["pending", "reviewing"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as VerificationRequest[];
}

export async function reviewVerificationRequest(id: string, approved: boolean) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { error } = await supabase.rpc("review_verification_request", {
    p_request_id: id,
    p_approved: approved,
  });
  if (error) throw error;
}

export async function submitVerificationRequest(input: {
  userId: string;
  accountType: "proprietaire" | "agence";
  businessName?: string;
  note?: string;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("verification_requests")
    .insert({
      requester_id: input.userId,
      account_type: input.accountType,
      business_name: input.businessName?.trim() || null,
      note: input.note?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as VerificationRequest;
}

export async function uploadVerificationDocument(input: {
  userId: string;
  requestId: string;
  kind: VerificationDocument["document_kind"];
  file: File;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const extension = input.file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${input.userId}/${input.requestId}/${crypto.randomUUID()}.${extension}`;
  const upload = await supabase.storage.from("verification-documents").upload(path, input.file, {
    cacheControl: "3600",
    contentType: input.file.type,
    upsert: false,
  });
  if (upload.error) throw upload.error;

  const { data, error } = await supabase
    .from("verification_documents")
    .insert({
      request_id: input.requestId,
      owner_id: input.userId,
      document_kind: input.kind,
      storage_path: path,
    })
    .select("*")
    .single();
  if (error) {
    await supabase.storage.from("verification-documents").remove([path]);
    throw error;
  }
  return data as VerificationDocument;
}

export async function loadVerificationDocuments(requestId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("verification_documents")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as VerificationDocument[];
}

export async function getVerificationDocumentUrl(path: string) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase.storage
    .from("verification-documents")
    .createSignedUrl(path, 600);
  if (error) throw error;
  return data.signedUrl;
}

export async function createOfferRequest(input: {
  userId: string;
  kind: "experience" | "service";
  offerKey: string;
  offerTitle: string;
  customerName: string;
  customerPhone?: string;
  preferredDate: string;
  people: number;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("offer_requests")
    .insert({
      customer_id: input.userId,
      offer_kind: input.kind,
      offer_key: input.offerKey,
      offer_title: input.offerTitle,
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone?.trim() || null,
      preferred_date: input.preferredDate,
      people: input.people,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function loadMyOfferRequests(): Promise<OfferRequest[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("offer_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OfferRequest[];
}

export async function loadOfferRequests(): Promise<OfferRequest[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("offer_requests")
    .select("*")
    .in("status", ["requested", "contacted", "confirmed"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OfferRequest[];
}

export async function updateOfferRequestStatus(
  id: string,
  status: "contacted" | "confirmed" | "declined" | "completed",
) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { error } = await supabase
    .from("offer_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
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

export async function getOrCreateConversation(listing: Listing, userId: string) {
  if (!supabase || !listing.databaseId || !listing.ownerUserId) {
    throw new Error("Cette annonce de démonstration ne peut pas encore recevoir de messages.");
  }
  if (listing.ownerUserId === userId) throw new Error("Vous êtes le propriétaire de cette annonce.");

  const existing = await supabase
    .from("conversations")
    .select("*")
    .eq("listing_id", listing.databaseId)
    .eq("guest_id", userId)
    .eq("host_id", listing.ownerUserId)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data as Conversation;

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      listing_id: listing.databaseId,
      guest_id: userId,
      host_id: listing.ownerUserId,
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") {
      const retry = await supabase
        .from("conversations")
        .select("*")
        .eq("listing_id", listing.databaseId)
        .eq("guest_id", userId)
        .eq("host_id", listing.ownerUserId)
        .single();
      if (retry.error) throw retry.error;
      return retry.data as Conversation;
    }
    throw error;
  }
  return data as Conversation;
}

export async function loadConversations(): Promise<Conversation[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("conversations")
    .select("*, listing:marketplace_listings(title, city, neighborhood, data)")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as Conversation[];
  const profileIds = [...new Set(rows.flatMap((row) => [row.guest_id, row.host_id]))];
  if (!profileIds.length) return rows;
  const profiles = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", profileIds);
  if (profiles.error) throw profiles.error;
  const publicHosts = await supabase
    .from("host_public_profiles")
    .select("owner_id, display_name")
    .in("owner_id", [...new Set(rows.map((row) => row.host_id))]);
  if (publicHosts.error) throw publicHosts.error;
  const byId = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]));
  const hostById = new Map((publicHosts.data ?? []).map((profile) => [profile.owner_id, profile.display_name]));
  return rows.map((row) => ({
    ...row,
    guest: byId.get(row.guest_id) ?? null,
    host: byId.get(row.host_id) ?? (
      hostById.get(row.host_id)
        ? { id: row.host_id, full_name: hostById.get(row.host_id)!, avatar_url: null }
        : null
    ),
  })) as Conversation[];
}

export async function loadMessages(conversationId: string): Promise<ConversationMessage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ConversationMessage[];
}

export async function sendMessage(conversationId: string, userId: string, body: string) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: userId, body: body.trim() })
    .select("*")
    .single();
  if (error) throw error;
  return data as ConversationMessage;
}

export async function markMessagesRead(conversationId: string, userId: string) {
  if (!supabase) return;
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
  if (error) throw error;
}

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: ConversationMessage) => void,
) {
  if (!supabase) return () => undefined;
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => onMessage(payload.new as ConversationMessage),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function loadBlockedListingIds(
  listingIds: string[],
  from: string,
  to: string,
): Promise<string[]> {
  if (!supabase || !listingIds.length || !from || !to) return [];
  const { data, error } = await supabase
    .from("availability_blocks")
    .select("listing_id")
    .in("listing_id", listingIds)
    .lt("start_date", to)
    .gt("end_date", from)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
  if (error) throw error;
  return [...new Set((data ?? []).map((row) => row.listing_id as string))];
}

export async function isListingAvailable(listingId: string, from: string, to: string) {
  const blocked = await loadBlockedListingIds([listingId], from, to);
  return blocked.length === 0;
}

export async function updateMarketBookingStatus(
  id: string,
  status: "declined" | "cancelled",
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

export async function preapproveMarketBooking(id: string) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase.rpc("preapprove_booking_request", {
    p_booking_id: id,
  });
  if (error) {
    if (error.code === "23P01") {
      throw new Error("Ces dates viennent d’être préapprouvées pour une autre demande.");
    }
    throw error;
  }
  return data as MarketBooking;
}

export async function loadPaymentOrders(): Promise<PaymentOrder[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("payment_orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PaymentOrder[];
}

export async function loadPayouts(): Promise<Payout[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("payouts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Payout[];
}

export async function loadRefunds(): Promise<Refund[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("refunds")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Refund[];
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
