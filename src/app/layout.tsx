import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { Ambience } from "@/components/layout/ambience";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/data/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - ${siteConfig.role}`,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
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
