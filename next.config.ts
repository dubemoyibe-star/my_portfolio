import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
