import type { MetadataRoute } from "next";
import { siteContent } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  const ready = siteContent.status === "ready";
  return {
    rules: ready
      ? { userAgent: "*", allow: "/" }
      : { userAgent: "*", disallow: "/" },
    sitemap: ready ? "https://titoosemobor.com/sitemap.xml" : undefined,
  };
}
