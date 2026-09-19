import type { NextConfig } from "next";

const CANONICAL_ORIGIN = "https://oyibe.dev";

const nextConfig: NextConfig = {
  /**
   * Permanent (308) redirects from alternate hostnames to the canonical domain,
   * path and query preserved.
   *
   * `oyibe.vercel.app` is deliberately not listed yet. When it is time to move
   * the indexed URLs over, add it to the host list below.
   *
   * Matched on the exact host, so preview deployments (which live on their own
   * `*.vercel.app` hostnames) and local development are untouched.
   */
  async redirects() {
    return ["www.oyibe.dev"].map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `${CANONICAL_ORIGIN}/:path*`,
      permanent: true,
    }));
  },

  images: {
    /**
     * Uploaded images live on Cloudinary; the seeded ones live in `/public`.
     * Both are rendered through `next/image` on the public site, and the
     * optimizer refuses any remote host that is not listed here — so an image
     * uploaded from the admin panel would come out as a broken frame without
     * this entry.
     *
     * Scoped to one hostname rather than left open: this allowlist is the only
     * thing stopping the site's own optimizer from being used as a free image
     * proxy for arbitrary URLs.
     */
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],

    /**
     * Next 16 only honours `quality` values listed here; anything else falls
     * back to the 75 default silently.
     *
     * 100 exists for the hero portrait: its source is a small, already-lossy
     * JPEG, and re-encoding it at 75 stacks a second generation of compression
     * on top of an image that is being upscaled anyway.
     */
    qualities: [75, 100],
  },
};

export default nextConfig;
