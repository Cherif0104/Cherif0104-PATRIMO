import type { MetadataRoute } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server-client";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cherif0104-patrimo.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/explorer", "/experiences", "/services", "/agences", "/confiance", "/conditions", "/confidentialite"];
  const supabase = await createServerSupabaseClient();
  if (!supabase) return staticRoutes.map((route) => ({ url: `${baseUrl}${route}`, changeFrequency: "weekly" }));

  const [{ data: listings }, { data: offers }] = await Promise.all([
    supabase.from("marketplace_listings").select("slug, updated_at").eq("status", "published"),
    supabase.from("marketplace_offers").select("slug, kind, updated_at").eq("status", "published"),
  ]);

  return [
    ...staticRoutes.map((route) => ({ url: `${baseUrl}${route}`, changeFrequency: "weekly" as const })),
    ...(listings ?? []).map((listing) => ({
      url: `${baseUrl}/logements/${listing.slug}`,
      lastModified: listing.updated_at,
      changeFrequency: "daily" as const,
    })),
    ...(offers ?? []).map((offer) => ({
      url: `${baseUrl}/${offer.kind === "experience" ? "experiences" : "services"}/${offer.slug}`,
      lastModified: offer.updated_at,
      changeFrequency: "weekly" as const,
    })),
  ];
}
