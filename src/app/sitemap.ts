import type { MetadataRoute } from "next";
import { siteContent } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (siteContent.status !== "ready") return [];
  return [
    {
      url: "https://titoosemobor.com",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
