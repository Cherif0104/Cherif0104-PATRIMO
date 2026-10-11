import type { Metadata } from "next";
import { getPublishedListingBySlug } from "@/lib/catalog-server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getPublishedListingBySlug(id);
  if (!listing) return { title: "Logement indisponible", robots: { index: false, follow: false } };
  return {
    title: listing.title,
    description: listing.description.slice(0, 160),
    alternates: { canonical: `/logements/${id}` },
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 160),
      images: listing.images.slice(0, 1),
    },
  };
}

export default async function ListingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getPublishedListingBySlug(id);
  const jsonLd = listing
    ? {
        "@context": "https://schema.org",
        "@type": listing.purpose === "vente" ? "RealEstateListing" : "Accommodation",
        name: listing.title,
        description: listing.description,
        image: listing.images,
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://cherif0104-patrimo.vercel.app"}/logements/${id}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: listing.city,
          addressRegion: listing.neighborhood,
          addressCountry: listing.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: listing.lat,
          longitude: listing.lng,
        },
        offers: {
          "@type": "Offer",
          price: listing.price,
          priceCurrency: listing.currency,
          availability: "https://schema.org/InStock",
        },
      }
    : null;
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c"),
          }}
        />
      )}
      {children}
    </>
  );
}
