import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Se Loger au Sénégal — Voyager au Sénégal",
    short_name: "Se Loger au Sénégal",
    description: "Logements, expériences, services et transferts au Sénégal.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FF385C",
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
