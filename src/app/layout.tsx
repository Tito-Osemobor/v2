import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/newsreader";
import "@/app/globals.css";
import { siteContent } from "@/content/site";
import { ThemeProvider } from "@/features/site-controls/theme-provider";
import { MotionProvider } from "@/shared/motion/motion-provider";

const isReady = siteContent.status === "ready";

export const metadata: Metadata = {
  metadataBase: new URL(siteContent.seo.canonicalUrl),
  title: siteContent.seo.title,
  description: siteContent.seo.description,
  creator: siteContent.identity.name,
  publisher: siteContent.identity.name,
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon.ico", sizes: "16x16 32x32 48x48" },
      {
        url: "/icons/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/icons/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  robots: {
    index: isReady,
    follow: isReady,
    googleBot: { index: isReady, follow: isReady },
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#111317" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const personJsonLd = isReady
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        name: siteContent.identity.name,
        url: siteContent.seo.canonicalUrl,
        jobTitle: siteContent.identity.role,
        homeLocation: { "@type": "Place", name: siteContent.identity.location },
        sameAs: siteContent.socials.map((social) => social.url),
      }
    : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteContent.seo.canonicalUrl} />
        <meta property="og:title" content={siteContent.seo.title} />
        <meta property="og:description" content={siteContent.seo.description} />
        <meta property="og:site_name" content={siteContent.identity.name} />
        <meta property="og:locale" content="en_CA" />
        <meta
          property="og:image"
          content={`${siteContent.seo.canonicalUrl}${siteContent.seo.socialImage.path}`}
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content={siteContent.seo.socialImage.alt}
        />
      </head>
      <body>
        <ThemeProvider>
          <MotionProvider>{children}</MotionProvider>
        </ThemeProvider>
        {personJsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
          />
        ) : null}
        <Analytics />
      </body>
    </html>
  );
}
