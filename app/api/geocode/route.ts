import { NextRequest, NextResponse } from "next/server";
import { serverLog } from "@/lib/server-log";

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    street?: string;
    district?: string;
    locality?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
};

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 3 || query.length > 160) {
    return NextResponse.json({ results: [] });
  }

  const mapQuery = query
    .replace(/\b(appartement|appart|villa|maison|studio|duplex|rooftop|hôtel|hotel|terrain|logement)\b/gi, " ")
    .replace(/\b(à vendre|à louer|meublé|meublee?|non meublé|premium|luxe)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const endpoint = new URL("https://photon.komoot.io/api/");
  endpoint.searchParams.set("q", `${mapQuery || query}, Sénégal`);
  endpoint.searchParams.set("lang", "fr");
  endpoint.searchParams.set("limit", "6");
  endpoint.searchParams.set("bbox", "-17.75,12.25,-11.25,16.75");

  try {
    const response = await fetch(endpoint, {
      headers: { "User-Agent": "SeLogerAuSenegal/1.0 (address-search)" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("geocoder_unavailable");
    const payload = (await response.json()) as { features?: PhotonFeature[] };
    const seen = new Set<string>();
    const results = (payload.features ?? [])
      .filter((feature) => feature.geometry?.coordinates?.length === 2)
      .filter((feature) => !feature.properties?.countrycode || feature.properties.countrycode.toUpperCase() === "SN")
      .map((feature) => {
        const properties = feature.properties ?? {};
        const coordinates = feature.geometry!.coordinates!;
        const city = properties.city || properties.locality || properties.state || "Sénégal";
        const neighborhood = properties.district || properties.locality || properties.street || city;
        const label = [
          properties.name || properties.street,
          neighborhood !== properties.name ? neighborhood : null,
          city !== neighborhood ? city : null,
          properties.country || "Sénégal",
        ].filter(Boolean).join(", ");
        return {
          label,
          city,
          neighborhood,
          country: properties.country || "Sénégal",
          countryCode: properties.countrycode?.toUpperCase() || "SN",
          lat: coordinates[1],
          lng: coordinates[0],
          source: "OpenStreetMap",
        };
      })
      .filter((result) => {
        const key = `${result.label.toLowerCase()}-${result.lat.toFixed(4)}-${result.lng.toFixed(4)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch (cause) {
    serverLog.warn("geocode.unavailable", {
      durationMs: Date.now() - startedAt,
      error: cause instanceof Error ? cause.message : "unknown",
    });
    return NextResponse.json({ results: [], error: "Service d’adresse indisponible." }, { status: 503 });
  }
}
