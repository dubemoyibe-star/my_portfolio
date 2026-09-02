import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { Ambience } from "@/components/layout/ambience";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/data/site";
import { ogImages } from "@/lib/seo";

import "./globals.css";

/**
 * Site-wide defaults. Pages override the parts that are theirs — title,
 * description, canonical, share image — via `pageMetadata()` in `@/lib/seo`;
 * what stays here is what is true of every page.
 *
 * `metadataBase` is what lets every other URL in the tree stay root-relative:
 * Next resolves canonicals and OpenGraph images against it, so the domain is
 * written once, in `siteConfig.url`.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - ${siteConfig.role}`,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  /* Defaults, not the final word: both real pages restate these with their own
     copy. They exist so a page added later without its own metadata still
     shares as something intentional rather than as a bare link. */
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    locale: "en_US",
    title: `${siteConfig.name} - ${siteConfig.role}`,
    description: siteConfig.description,
    images: [ogImages.home],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} - ${siteConfig.role}`,
    description: siteConfig.description,
    images: [ogImages.home.url],
  },
};

export const viewport: Viewport = {
  // Matches --background so the browser chrome does not flash white.
  themeColor: "#0a0e12",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {/* Entrance animations start from opacity:0 in CSS. Without JS, GSAP
            never runs, so restore the visible state or the page reads blank. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-small"
        >
          Skip to content
        </a>

        <Ambience />

        <SiteHeader />

        {/* Single content wrapper. Pages own their own sections and spacing;
            this only guarantees the footer stays pinned to the bottom. */}
        <main id="main" className="relative z-10 flex-1">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
