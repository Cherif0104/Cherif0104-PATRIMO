import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ameena — Voyager au Sénégal",
    short_name: "Ameena",
    description: "Logements, expériences, services et transferts au Sénégal.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#D4AF37",
    orientation: "portrait-primary",
    lang: "fr",
    categories: ["travel", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
