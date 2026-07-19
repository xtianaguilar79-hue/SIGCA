import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIGCA | AOMA Seccional San Juan",
    short_name: "SIGCA",
    description:
      "Sistema Integral de Gestión, Capacitación y Administración Sindical.",
    start_url: "/acceso",
    scope: "/",
    display: "standalone",
    background_color: "#f2f7f7",
    theme_color: "#003d4c",
    orientation: "portrait-primary",
    lang: "es-AR",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

