import type { MetadataRoute } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server-client";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cherif0104-patrimo.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/explorer", "/services", "/telecharger", "/agences", "/confiance", "/conditions", "/confidentialite"];
  const supabase = await createServerSupabaseClient();
  if (!supabase) return staticRoutes.map((route) => ({ url: `${baseUrl}${route}`, changeFrequency: "weekly" }));

  const [{ data: listings }, { data: partners }] = await Promise.all([
    supabase
      .from("marketplace_listings")
      .select("slug, updated_at")
      .eq("status", "published"),
    supabase
      .from("marketplace_partners")
      .select("id, updated_at")
      .eq("status", "published"),
  ]);

  return [
    ...staticRoutes.map((route) => ({ url: `${baseUrl}${route}`, changeFrequency: "weekly" as const })),
    ...(listings ?? []).map((listing) => ({
      url: `${baseUrl}/logements/${listing.slug}`,
      lastModified: listing.updated_at,
      changeFrequency: "daily" as const,
    })),
    ...(partners ?? []).map((partner) => ({
      url: `${baseUrl}/services/${partner.id}`,
      lastModified: partner.updated_at,
      changeFrequency: "weekly" as const,
    })),
  ];
}
