import { getImageProps } from "next/image";

import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types";

export type AvatarProps = {
  image: ImageAsset;
  /** Alternate crop for viewports below `lg`. Falls back to `image`. */
  compact?: ImageAsset;
  /** Sizing and shape. The object-fit is applied here. */
  className?: string;
};

/**
 * Portrait with per-breakpoint art direction.
 *
 * Two `<Image>` elements toggled with `lg:hidden` would be simpler, but a
 * browser still downloads an image it is not displaying — every phone would
 * pull the full desktop portrait it never shows. `<picture>` picks exactly one,
 * and `getImageProps` keeps Next's optimizer in the loop while doing it, which
 * `<Image>` alone cannot express.
 *
 * The breakpoint is written as `64rem` to match `--breakpoint-lg`; a media
 * query cannot read a CSS variable, so this is the one place that value is
 * necessarily duplicated.
 */
export function Avatar({ image, compact, className }: AvatarProps) {
  const narrow = compact ?? image;
  const shared = { alt: image.alt, quality: 100, priority: true };

  const {
    props: { srcSet: wideSrcSet },
  } = getImageProps({
    ...shared,
    src: image.src,
    width: image.width ?? 1280,
    height: image.height ?? 854,
  });

  const {
    props: { srcSet: narrowSrcSet, ...imgProps },
  } = getImageProps({
    ...shared,
    src: narrow.src,
    width: narrow.width ?? 200,
    height: narrow.height ?? 200,
  });

  return (
    <picture className="block">
      <source media="(min-width: 64rem)" srcSet={wideSrcSet} />
      <source srcSet={narrowSrcSet} />
      {/* A raw <img> is correct here, not a lint escape: inside <picture> the
          sources above decide what loads, and getImageProps has already routed
          both through Next's optimizer. */}
      <img
        {...imgProps}
        alt={image.alt}
        className={cn("object-cover", className)}
      />
    </picture>
  );
}
