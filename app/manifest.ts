import type { MetadataRoute } from "next";

/**
 * PWA manifest. Used by Android/Chrome's "Install" prompt and as the
 * source of truth for theme color / display mode. iOS Safari mostly
 * uses the meta tags in app/layout.tsx, but the manifest doesn't hurt.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CAPM Prep",
    short_name: "CAPM Prep",
    description:
      "Practice questions, mock exams, and progress tracking for the CAPM certification.",
    start_url: "/today",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#0f172a",
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
