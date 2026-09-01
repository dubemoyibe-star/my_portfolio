import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
