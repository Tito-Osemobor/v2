import type { MetadataRoute } from "next";
import { siteContent } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteContent.identity.name,
    short_name: siteContent.identity.initials,
    description: siteContent.seo.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f4",
    theme_color: "#2457e6",
    icons: [
      {
        src: "/icons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
