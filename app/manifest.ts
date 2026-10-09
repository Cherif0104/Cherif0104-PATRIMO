import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ameena — Voyager au Sénégal",
    short_name: "Ameena",
    description: "Logements, expériences, services et transferts au Sénégal.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#E21D5A",
    orientation: "portrait-primary",
    lang: "fr",
    categories: ["travel", "lifestyle"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
