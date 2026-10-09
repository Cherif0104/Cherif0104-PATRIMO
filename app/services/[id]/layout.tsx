import type { Metadata } from "next";
import { getPublishedOfferBySlug } from "@/lib/catalog-server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const offer = await getPublishedOfferBySlug(id, "service");
  if (!offer) return { title: "Service indisponible", robots: { index: false, follow: false } };
  return {
    title: offer.title,
    description: offer.description.slice(0, 160),
    alternates: { canonical: `/services/${id}` },
    openGraph: { title: offer.title, description: offer.description.slice(0, 160), images: offer.images.slice(0, 1) },
  };
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
