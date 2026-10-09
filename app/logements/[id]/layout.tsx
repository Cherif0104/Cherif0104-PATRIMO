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

export default function ListingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
