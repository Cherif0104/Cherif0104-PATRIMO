import { createBrowserClient } from "@supabase/ssr";
import type {
  AvailabilityBlock,
  Conversation,
  ConversationMessage,
  CrmContact,
  CrmInteraction,
  CrmOpportunity,
  HostPublicProfile,
  Listing,
  MarketBooking,
  MarketplacePartner,
  OfferRequest,
  Organization,
  OrganizationInvitation,
  OrganizationMember,
  PaymentOrder,
  PartnerApplication,
  PartnerProduct,
  PartnerReview,
  PortfolioHolding,
  Payout,
  Profile,
  PropertyContract,
  PropertyExpense,
  PropertyIncident,
  PropertyInspection,
  PropertyStakeholder,
  Quote,
  Refund,
  RoomCheck,
  MeterReading,
  Settings,
  UserNotification,
  VerificationDocument,
  VerificationRequest,
} from "./types";
import type { Offer, OfferKind } from "./catalog";

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
    .select("id, owner_id, organization_id, status, availability_status, last_availability_confirmed_at, last_availability_prompt_at, data")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row.data as Listing),
    databaseId: row.id,
    ownerUserId: row.owner_id,
    organizationId: row.organization_id ?? undefined,
    publicationStatus: row.status,
    availabilityStatus: row.availability_status,
    lastAvailabilityConfirmedAt: row.last_availability_confirmed_at ?? undefined,
    lastAvailabilityPromptAt: row.last_availability_prompt_at ?? undefined,
  }));
}

export async function loadOwnedListings(userId: string): Promise<Listing[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("id, owner_id, organization_id, status, availability_status, last_availability_confirmed_at, last_availability_prompt_at, data")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row.data as Listing),
    databaseId: row.id,
    ownerUserId: row.owner_id,
    organizationId: row.organization_id ?? undefined,
    manageable: row.owner_id === userId || Boolean(row.organization_id),
    publicationStatus: row.status,
    availabilityStatus: row.availability_status,
    lastAvailabilityConfirmedAt: row.last_availability_confirmed_at ?? undefined,
    lastAvailabilityPromptAt: row.last_availability_prompt_at ?? undefined,
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
    .select("id, owner_id, organization_id, status, data")
    .single();
  if (error) throw error;
  return {
    ...(data.data as Listing),
    databaseId: data.id,
    ownerUserId: data.owner_id,
    organizationId: (data as { organization_id?: string | null }).organization_id ?? undefined,
    manageable: true,
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
    organization_id: string | null;
    status: Listing["publicationStatus"];
    data: Listing;
  };
  return {
    ...row.data,
    databaseId: row.id,
    ownerUserId: row.owner_id,
    organizationId: row.organization_id ?? undefined,
    manageable: true,
    publicationStatus: row.status,
  } as Listing;
}

export async function confirmListingAvailability(
  listing: Listing,
  outcome: "available" | "rented" | "sold",
) {
  if (!supabase || !listing.databaseId) throw new Error("Annonce persistante introuvable.");
  const { data, error } = await supabase.rpc("confirm_listing_availability", {
    p_listing_id: listing.databaseId,
    p_outcome: outcome,
  });
  if (error) throw error;
  const row = data as {
    id: string;
    owner_id: string;
    organization_id: string | null;
    status: Listing["publicationStatus"];
    availability_status: Listing["availabilityStatus"];
    last_availability_confirmed_at: string | null;
    last_availability_prompt_at: string | null;
    data: Listing;
  };
  return {
    ...row.data,
    databaseId: row.id,
    ownerUserId: row.owner_id,
    organizationId: row.organization_id ?? undefined,
    manageable: true,
    publicationStatus: row.status,
    availabilityStatus: row.availability_status,
    lastAvailabilityConfirmedAt: row.last_availability_confirmed_at ?? undefined,
    lastAvailabilityPromptAt: row.last_availability_prompt_at ?? undefined,
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

type PropertyMedia = {
  entity_id: string;
  media_kind: "photo" | "room" | "water_meter" | "power_meter";
  sort_order: number;
  storage_path: string;
};

async function loadPropertyMedia(entityType: "incident" | "inspection", entityIds: string[]) {
  const media = new Map<string, Array<PropertyMedia & { url: string }>>();
  if (!supabase || entityIds.length === 0) return media;
  const { data, error } = await supabase
    .from("property_media")
    .select("entity_id, media_kind, sort_order, storage_path")
    .eq("entity_type", entityType)
    .in("entity_id", entityIds)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  await Promise.all((data ?? []).map(async (row) => {
    const { data: signed, error: signedError } = await supabase!.storage
      .from("property-media")
      .createSignedUrl(row.storage_path, 600);
    if (signedError) throw signedError;
    const list = media.get(row.entity_id) ?? [];
    list.push({ ...(row as PropertyMedia), url: signed.signedUrl });
    media.set(row.entity_id, list);
  }));
  return media;
}

async function uploadPropertyMedia(input: {
  userId: string;
  listingId: string;
  entityType: "incident" | "inspection";
  entityId: string;
  mediaKind: PropertyMedia["media_kind"];
  sortOrder: number;
  file: File;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(input.file.type) || input.file.size > 10 * 1024 * 1024) {
    throw new Error("Fichier image invalide ou supérieur à 10 Mo.");
  }
  const extension = input.file.type === "image/png" ? "png" : input.file.type === "image/webp" ? "webp" : "jpg";
  const path = `${input.userId}/${input.entityType}/${input.entityId}/${crypto.randomUUID()}.${extension}`;
  const upload = await supabase.storage.from("property-media").upload(path, input.file, {
    cacheControl: "3600",
    contentType: input.file.type,
    upsert: false,
  });
  if (upload.error) throw upload.error;
  const { error } = await supabase.from("property_media").insert({
    listing_id: input.listingId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    media_kind: input.mediaKind,
    storage_path: path,
    sort_order: input.sortOrder,
    uploaded_by: input.userId,
  });
  if (error) {
    await supabase.storage.from("property-media").remove([path]);
    throw error;
  }
}

export async function loadPropertyIncidents(): Promise<PropertyIncident[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("property_incidents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const media = await loadPropertyMedia("incident", (data ?? []).map((row) => row.id));
  return (data ?? []).map((row) => ({
    ...row,
    photos: (media.get(row.id) ?? []).map((item) => item.url),
  })) as PropertyIncident[];
}

export async function createPropertyIncident(input: {
  listingId: string;
  userId: string;
  title: string;
  category: PropertyIncident["category"];
  description: string;
  reporter: string;
  files: File[];
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("property_incidents")
    .insert({
      listing_id: input.listingId,
      title: input.title.trim(),
      category: input.category,
      description: input.description.trim(),
      reporter: input.reporter.trim(),
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  await Promise.all(input.files.slice(0, 4).map((file, index) => uploadPropertyMedia({
    userId: input.userId,
    listingId: input.listingId,
    entityType: "incident",
    entityId: data.id,
    mediaKind: "photo",
    sortOrder: index,
    file,
  })));
  return data.id as string;
}

export async function updatePropertyIncidentStatus(id: string, status: PropertyIncident["status"]) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { error } = await supabase
    .from("property_incidents")
    .update({
      status,
      resolved_at: status === "resolu" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function loadPropertyExpenses(): Promise<PropertyExpense[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("property_expenses")
    .select("*")
    .order("expense_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PropertyExpense[];
}

export async function createPropertyExpense(input: {
  listingId: string;
  userId: string;
  label: string;
  category: PropertyExpense["category"];
  amount: number;
  currency: PropertyExpense["currency"];
  date: string;
  chargeToTenant: boolean;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("property_expenses")
    .insert({
      listing_id: input.listingId,
      label: input.label.trim(),
      category: input.category,
      amount: input.amount,
      currency: input.currency,
      expense_date: input.date,
      charge_to_tenant: input.chargeToTenant,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PropertyExpense;
}

export async function loadPropertyContracts(): Promise<PropertyContract[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("property_contracts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PropertyContract[];
}

export async function startAgencyOnboarding(email: string, businessName: string) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase.schema("private").rpc("start_agency_onboarding", {
    p_email: email.trim(),
    p_business_name: businessName.trim(),
  });
  if (error) throw error;
  return data as string;
}

export async function createPropertyContract(input: {
  listingId: string;
  userId: string;
  title: string;
  kind: PropertyContract["contract_kind"];
  startDate?: string;
  endDate?: string;
  amount?: number;
  currency: PropertyContract["currency"];
  tenantId?: string;
  ownerId?: string;
  organizationId?: string;
  bookingId?: string;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("property_contracts")
    .insert({
      listing_id: input.listingId,
      booking_id: input.bookingId || null,
      tenant_id: input.tenantId || null,
      owner_id: input.ownerId || null,
      organization_id: input.organizationId || null,
      title: input.title.trim(),
      contract_kind: input.kind,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      monthly_amount: input.amount || null,
      currency: input.currency,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PropertyContract;
}

export async function updatePropertyContractStatus(id: string, status: PropertyContract["status"]) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("property_contracts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as PropertyContract;
}

export async function loadPropertyStakeholders(): Promise<PropertyStakeholder[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("property_stakeholders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PropertyStakeholder[];
}

export async function addPropertyStakeholderByEmail(input: {
  listingId: string;
  email: string;
  role: PropertyStakeholder["role"];
  sharePercent?: number;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase.schema("private").rpc("add_property_stakeholder_by_email", {
    p_listing_id: input.listingId,
    p_email: input.email.trim(),
    p_role: input.role,
    p_share_percent: input.sharePercent ?? null,
  });
  if (error) throw error;
  return data as PropertyStakeholder;
}

export async function loadMyPortfolio(): Promise<PortfolioHolding[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("property_stakeholders")
    .select("*, marketplace_listings!inner(id, owner_id, organization_id, status, data)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const relation = row.marketplace_listings as unknown as {
      id: string;
      owner_id: string;
      organization_id: string | null;
      status: Listing["publicationStatus"];
      data: Listing;
    };
    return {
      stakeholder: {
        id: row.id,
        listing_id: row.listing_id,
        user_id: row.user_id,
        role: row.role,
        share_percent: row.share_percent,
        created_by: row.created_by,
        created_at: row.created_at,
      } as PropertyStakeholder,
      listing: {
        ...relation.data,
        databaseId: relation.id,
        ownerUserId: relation.owner_id,
        organizationId: relation.organization_id ?? undefined,
        publicationStatus: relation.status,
        manageable: false,
      } as Listing,
    };
  });
}

export async function loadPropertyInspections(): Promise<PropertyInspection[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("property_inspections")
    .select("*")
    .order("inspection_date", { ascending: false });
  if (error) throw error;
  const media = await loadPropertyMedia("inspection", (data ?? []).map((row) => row.id));
  return (data ?? []).map((row) => {
    const files = media.get(row.id) ?? [];
    const rooms = (row.rooms as RoomCheck[]).map((room, roomIndex) => ({
      ...room,
      photos: files
        .filter((item) => item.media_kind === "room" && Math.floor(item.sort_order / 100) === roomIndex)
        .map((item) => item.url),
    }));
    const meters = (row.meters as MeterReading[]).map((meter) => ({
      ...meter,
      photo: files.find((item) =>
        item.media_kind === (meter.kind === "eau" ? "water_meter" : "power_meter"))?.url,
    }));
    return { ...row, rooms, meters } as PropertyInspection;
  });
}

export async function createPropertyInspection(input: {
  listingId: string;
  userId: string;
  kind: PropertyInspection["kind"];
  date: string;
  author: string;
  rooms: RoomCheck[];
  meters: MeterReading[];
  keys: number;
  comments: string;
  tenantSignature?: string;
  ownerSignature?: string;
  sign: boolean;
  roomFiles: File[][];
  meterFiles: { eau?: File; electricite?: File };
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("property_inspections")
    .insert({
      listing_id: input.listingId,
      kind: input.kind,
      inspection_date: input.date,
      author: input.author.trim(),
      rooms: input.rooms.map((room) => ({ ...room, photos: [] })),
      meters: input.meters.map((meter) => ({ ...meter, photo: undefined })),
      keys_count: input.keys,
      comments: input.comments.trim(),
      tenant_signature: input.sign ? input.tenantSignature?.trim() || null : null,
      owner_signature: input.sign ? input.ownerSignature?.trim() || null : null,
      signed_at: input.sign ? new Date().toISOString() : null,
      created_by: input.userId,
    })
    .select("id")
    .single();
  if (error) throw error;
  const uploads = input.roomFiles.flatMap((files, roomIndex) =>
    files.slice(0, 4).map((file, fileIndex) => uploadPropertyMedia({
      userId: input.userId,
      listingId: input.listingId,
      entityType: "inspection" as const,
      entityId: data.id,
      mediaKind: "room" as const,
      sortOrder: roomIndex * 100 + fileIndex,
      file,
    })),
  );
  if (input.meterFiles.eau) uploads.push(uploadPropertyMedia({
    userId: input.userId,
    listingId: input.listingId,
    entityType: "inspection",
    entityId: data.id,
    mediaKind: "water_meter",
    sortOrder: 10000,
    file: input.meterFiles.eau,
  }));
  if (input.meterFiles.electricite) uploads.push(uploadPropertyMedia({
    userId: input.userId,
    listingId: input.listingId,
    entityType: "inspection",
    entityId: data.id,
    mediaKind: "power_meter",
    sortOrder: 10001,
    file: input.meterFiles.electricite,
  }));
  await Promise.all(uploads);
  return data.id as string;
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

function mapOffer(row: {
  id: string;
  slug: string;
  owner_id: string | null;
  status: Offer["publicationStatus"];
  data: unknown;
}) {
  return {
    ...(row.data as Offer),
    id: row.slug,
    databaseId: row.id,
    ownerUserId: row.owner_id ?? undefined,
    publicationStatus: row.status,
  } as Offer;
}

export async function loadPublishedOffers(kind?: OfferKind): Promise<Offer[]> {
  if (!supabase) return [];
  let query = supabase
    .from("marketplace_offers")
    .select("id, slug, owner_id, status, data")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapOffer);
}

export async function loadOffersForReview(): Promise<Offer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("marketplace_offers")
    .select("id, slug, owner_id, status, data")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapOffer);
}

export async function createAdminOffer(userId: string, offer: Offer) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("marketplace_offers")
    .insert({
      slug: offer.id,
      owner_id: userId,
      kind: offer.kind,
      status: "published",
      title: offer.title,
      city: offer.city,
      country: offer.country,
      neighborhood: offer.neighborhood,
      price: offer.price,
      currency: offer.currency,
      data: offer,
      published_at: new Date().toISOString(),
    })
    .select("id, slug, owner_id, status, data")
    .single();
  if (error) throw error;
  return mapOffer(data);
}

export async function reviewOffer(id: string, status: "published" | "suspended") {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { error } = await supabase
    .from("marketplace_offers")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
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

export async function loadOrganizations(): Promise<Organization[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Organization[];
}

export async function createOrganization(userId: string, name: string) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const slug = `${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await supabase
    .from("organizations")
    .insert({ name: name.trim(), slug, owner_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  const member = await supabase.from("organization_members").insert({
    organization_id: data.id,
    user_id: userId,
    role: "owner",
    functional_domains: ["catalogue", "crm", "reservations", "contracts", "finance", "maintenance", "administration"],
  });
  if (member.error) throw member.error;
  return data as Organization;
}

export async function loadOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as OrganizationMember[];
}

export async function loadMyOrganizationMemberships(): Promise<OrganizationMember[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OrganizationMember[];
}

export async function loadOrganizationInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("organization_invitations")
    .select("*")
    .eq("organization_id", organizationId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrganizationInvitation[];
}

export async function createOrganizationInvitation(input: {
  organizationId: string;
  userId: string;
  email: string;
  role: OrganizationInvitation["role"];
  functionalDomains: OrganizationInvitation["functional_domains"];
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: input.organizationId,
      invited_by: input.userId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      functional_domains: input.functionalDomains,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as OrganizationInvitation;
}

export async function acceptOrganizationInvitation(token: string) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase.rpc("accept_organization_invitation", { p_token: token });
  if (error) throw error;
  return data as string;
}

export async function loadCrmContacts(organizationId: string): Promise<CrmContact[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CrmContact[];
}

export async function createCrmContact(input: {
  organizationId: string;
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  kind?: CrmContact["contact_kind"];
  source?: CrmContact["source"];
  notes?: string;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("crm_contacts")
    .insert({
      organization_id: input.organizationId,
      full_name: input.fullName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      contact_kind: input.kind ?? "prospect",
      source: input.source ?? "manuel",
      notes: input.notes?.trim() || "",
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CrmContact;
}

export async function importCrmContacts(
  organizationId: string,
  userId: string,
  rows: Array<{ fullName: string; email?: string; phone?: string; kind?: string }>,
) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const payload = rows.map((row) => ({
    organization_id: organizationId,
    full_name: row.fullName.trim(),
    email: row.email?.trim() || null,
    phone: row.phone?.trim() || null,
    contact_kind: ["prospect", "client", "proprietaire", "investisseur", "partenaire"].includes(row.kind ?? "")
      ? row.kind
      : "prospect",
    source: "import",
    created_by: userId,
  }));
  const { data, error } = await supabase.from("crm_contacts").insert(payload).select("*");
  if (error) throw error;
  return (data ?? []) as CrmContact[];
}

export async function updateCrmContactQualification(
  id: string,
  qualification: CrmContact["qualification"],
  score: number,
) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("crm_contacts")
    .update({ qualification, score, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as CrmContact;
}

export async function loadCrmInteractions(organizationId: string): Promise<CrmInteraction[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("crm_interactions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CrmInteraction[];
}

export async function createCrmInteraction(input: {
  organizationId: string;
  contactId: string;
  userId: string;
  channel: CrmInteraction["channel"];
  direction: CrmInteraction["direction"];
  outcome: CrmInteraction["outcome"];
  summary: string;
  nextActionAt?: string;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("crm_interactions")
    .insert({
      organization_id: input.organizationId,
      contact_id: input.contactId,
      channel: input.channel,
      direction: input.direction,
      outcome: input.outcome,
      summary: input.summary.trim(),
      next_action_at: input.nextActionAt || null,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CrmInteraction;
}

export async function loadCrmOpportunities(organizationId: string): Promise<CrmOpportunity[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("crm_opportunities")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CrmOpportunity[];
}

export async function createCrmOpportunity(input: {
  organizationId: string;
  contactId: string;
  userId: string;
  title: string;
  value?: number;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("crm_opportunities")
    .insert({
      organization_id: input.organizationId,
      contact_id: input.contactId,
      title: input.title.trim(),
      value: input.value || null,
      created_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CrmOpportunity;
}

export async function updateCrmOpportunityStage(id: string, stage: CrmOpportunity["stage"]) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const probability: Record<CrmOpportunity["stage"], number> = {
    nouveau: 10,
    qualifie: 30,
    visite: 50,
    negociation: 75,
    gagne: 100,
    perdu: 0,
  };
  const { data, error } = await supabase
    .from("crm_opportunities")
    .update({ stage, probability: probability[stage], updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as CrmOpportunity;
}

export async function loadPublishedPartners(): Promise<MarketplacePartner[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("marketplace_partners")
    .select("*")
    .eq("status", "published")
    .order("verified", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MarketplacePartner[];
}

export async function loadPartnerProducts(partnerIds: string[]): Promise<PartnerProduct[]> {
  if (!supabase || partnerIds.length === 0) return [];
  const { data, error } = await supabase
    .from("partner_products")
    .select("*")
    .in("partner_id", partnerIds)
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PartnerProduct[];
}

export async function loadPartnerReviews(partnerId: string): Promise<PartnerReview[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("partner_reviews")
    .select("*")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PartnerReview[];
}

export async function savePartnerReview(input: {
  partnerId: string;
  authorId: string;
  rating: number;
  body: string;
}): Promise<PartnerReview> {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("partner_reviews")
    .upsert({
      partner_id: input.partnerId,
      author_id: input.authorId,
      rating: input.rating,
      body: input.body.trim(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "partner_id,author_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as PartnerReview;
}

export async function submitPartnerApplication(input: {
  userId: string;
  businessName: string;
  category: PartnerApplication["category"];
  city: string;
  phone: string;
  message: string;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("partner_applications")
    .insert({
      requester_id: input.userId,
      business_name: input.businessName.trim(),
      category: input.category,
      city: input.city.trim(),
      phone: input.phone.trim(),
      message: input.message.trim(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PartnerApplication;
}

export async function loadPartnerApplications(): Promise<PartnerApplication[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("partner_applications")
    .select("*")
    .in("status", ["pending", "contacted"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PartnerApplication[];
}

export async function createMarketplacePartner(
  input: Omit<MarketplacePartner, "id" | "created_at" | "updated_at">,
) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("marketplace_partners")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as MarketplacePartner;
}

export async function loadMarketplacePartnersForReview(): Promise<MarketplacePartner[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("marketplace_partners")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MarketplacePartner[];
}

export async function updateMarketplacePartnerStatus(
  id: string,
  status: MarketplacePartner["status"],
  verified: boolean,
) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("marketplace_partners")
    .update({ status, verified, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as MarketplacePartner;
}

export async function createPartnerProduct(input: {
  partnerId: string;
  name: string;
  description?: string;
  price?: number;
}) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("partner_products")
    .insert({
      partner_id: input.partnerId,
      name: input.name.trim(),
      description: input.description?.trim() || "",
      price: input.price ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PartnerProduct;
}

export async function reviewPartnerApplication(id: string, status: PartnerApplication["status"]) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { data, error } = await supabase
    .from("partner_applications")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as PartnerApplication;
}

export async function loadUserNotifications(): Promise<UserNotification[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("user_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as UserNotification[];
}

export async function markNotificationsRead(ids: string[]) {
  if (!supabase || ids.length === 0) return;
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}

export async function submitListing(userId: string, listing: Listing) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const row = {
    slug: listing.id,
    owner_id: userId,
    organization_id: listing.organizationId || null,
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
    .in("status", ["pending_review", "published", "suspended"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row.data as Listing),
    databaseId: row.id,
    ownerUserId: row.owner_id,
    publicationStatus: row.status,
  }));
}

export async function reviewListing(id: string, status: "published" | "suspended" | "archived") {
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

export async function updateProfile(profile: Pick<Profile, "id" | "full_name" | "phone" | "requested_account_type">) {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: profile.full_name,
      phone: profile.phone,
      requested_account_type: profile.requested_account_type,
    })
    .eq("id", profile.id);
  if (error) throw error;
}
