import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Se Loger au Sénégal",
    short_name: "Se Loger au Sénégal",
    description: "Logements, gestion immobilière et professionnels de l’habitat au Sénégal.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFDF7",
    theme_color: "#FF4845",
    lang: "fr",
    categories: ["business", "lifestyle", "travel"],
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
