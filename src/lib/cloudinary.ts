import { createHash } from "node:crypto";

/**
 * Cloudinary, signed — the server's half.
 *
 * ## Why signed rather than an unsigned preset
 *
 * An unsigned upload preset is a public token: it ships in the client bundle,
 * and anyone who views source can upload into the account until the preset is
 * rotated. The alternative here costs one extra round trip and closes that
 * entirely — the browser has to ask an authenticated route for a signature
 * before Cloudinary will accept anything, and the signature it gets back is
 * scoped to one folder and expires.
 *
 * ## Why the browser still talks to Cloudinary directly
 *
 * The obvious signed design is to POST the file to our own route and have the
 * server forward it. That puts every byte through a serverless function, which
 * caps uploads at the platform's request-body limit (4.5 MB on Vercel) and
 * bills the transfer twice. Instead the server signs a set of parameters and
 * the browser posts the file straight to Cloudinary with them attached. The
 * API secret never leaves this module, and the file never touches our server.
 *
 * ## What is signed
 *
 * `folder` and `timestamp`, and nothing else. `folder` is chosen from a fixed
 * list on the server — see the upload-signature route — so a caller cannot aim
 * an upload at an arbitrary path in the account. `timestamp` is what makes the
 * grant short-lived: Cloudinary rejects a signature whose timestamp is more
 * than an hour old, so a signature that leaks is worth an hour of one folder,
 * not the account.
 *
 * ## What comes back
 *
 * Only `secure_url`, `width` and `height` are kept. The rest of Cloudinary's
 * response — `public_id`, `etag`, `version`, the delivery metadata — is not
 * stored, because the schema wants an image source and its intrinsic
 * dimensions, and holding the rest would tie rows to one asset host that a
 * future migration would have to unpick.
 *
 * Deleting an asset needs its `public_id`, which is exactly the field that is
 * not stored. `publicIdFromUrl` recovers it from the delivery URL rather than
 * adding a column, because the URL already contains it verbatim and a second
 * copy is a second thing that can go stale. The parser refuses anything that is
 * not a delivery URL for *this* cloud, so a `/public` path or someone else's
 * asset can never be handed to `destroyAssets`.
 */

/** Fixed folder per section. Keeps the account tidy and the grant narrow. */
export const UPLOAD_FOLDERS = {
  projects: "portfolio/projects",
  certifications: "portfolio/certifications",
  profile: "portfolio/profile",
} as const;

export type UploadKind = keyof typeof UPLOAD_FOLDERS;

export function isUploadKind(value: unknown): value is UploadKind {
  return typeof value === "string" && value in UPLOAD_FOLDERS;
}

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

/**
 * Whether uploads are configured at all.
 *
 * Checked without throwing so the admin UI can say "add these three variables"
 * in place of the drop zone, rather than crashing a page that is otherwise
 * perfectly usable. Every other content field still works without Cloudinary.
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function cloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, " +
        "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET — see .env.example.",
    );
  }
  return { cloudName, apiKey, apiSecret };
}

/**
 * Cloudinary's signature scheme: every signed parameter as `key=value`, sorted
 * by key, joined with `&`, the API secret appended, the whole thing SHA-1'd.
 *
 * SHA-1 is not a choice made here — it is what the API verifies against.
 * It is a shared-secret signature over parameters that are not themselves
 * secret, so the collision weaknesses that rule SHA-1 out elsewhere do not
 * apply; forging one still requires the secret.
 */
function sign(params: Record<string, string>, apiSecret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(payload + apiSecret).digest("hex");
}

export type UploadGrant = {
  /** Where the browser posts the file. */
  url: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

/** Everything the browser needs to perform exactly one upload. */
export function createUploadGrant(kind: UploadKind): UploadGrant {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const folder = UPLOAD_FOLDERS[kind];
  const timestamp = Math.floor(Date.now() / 1000);

  return {
    url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    cloudName,
    apiKey,
    timestamp,
    folder,
    signature: sign({ folder, timestamp: String(timestamp) }, apiSecret),
  };
}

/* ==========================================================================
   Deleting
   ========================================================================== */

/**
 * A Cloudinary delivery URL, back to the `public_id` that names the asset.
 *
 * The shape is
 * `https://res.cloudinary.com/<cloud>/image/upload/[<transforms>/][v<n>/]<public_id>.<ext>`,
 * and every part before the id is optional except the cloud and the
 * `image/upload` pair.
 *
 * Returns `null` — meaning "not ours, leave it alone" — for anything that is
 * not a delivery URL for the configured cloud. That covers the `/public` paths
 * the seeded content still uses, a hand-typed URL pointing at some other host,
 * and an asset in a different Cloudinary account. This is the guard that makes
 * the delete path safe to call with whatever happens to be in an `src` column.
 *
 * ## The transformation heuristic
 *
 * Nothing this app uploads carries transformations, but a URL pasted in by hand
 * might. Segments before the id are dropped when they look like a version
 * (`v1788359921`) or like a transformation component (`c_fill,w_600`, `w_200`)
 * — a short lowercase prefix, an underscore, and no further slashes. A folder
 * genuinely named `w_200` would be misread; that is a trade accepted knowingly,
 * since the alternative is refusing every transformed URL outright.
 */
export function publicIdFromUrl(url: string): string | null {
  if (!isCloudinaryConfigured()) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    /* A `/public` path, or anything else that is not absolute. */
    return null;
  }

  if (parsed.hostname !== "res.cloudinary.com") return null;

  const segments = parsed.pathname.split("/").filter(Boolean);
  const [cloud, resourceType, deliveryType, ...rest] = segments;

  /* Only this account's images, delivered normally. Anything else — a fetched
     remote image, a video, another cloud — is not ours to destroy. */
  if (cloud !== process.env.CLOUDINARY_CLOUD_NAME) return null;
  if (resourceType !== "image" || deliveryType !== "upload") return null;

  const isVersion = (segment: string) => /^v\d+$/.test(segment);
  const isTransform = (segment: string) =>
    segment.split(",").every((part) => /^[a-z]{1,3}_[^/]+$/.test(part));

  let start = 0;
  while (
    start < rest.length - 1 &&
    (isVersion(rest[start]) || isTransform(rest[start]))
  ) {
    start += 1;
  }

  const idSegments = rest.slice(start);
  if (idSegments.length === 0) return null;

  /* The extension Cloudinary appended is the delivery format, not part of the
     id. Only the final one is stripped — a public id may legitimately contain
     a dot. */
  const publicId = idSegments.join("/").replace(/\.[a-z0-9]+$/i, "");
  return publicId.length > 0 ? publicId : null;
}

/** Outcome per asset, so a caller can log precisely what happened. */
export type DestroyOutcome = {
  publicId: string;
  /** `"ok"` and `"not found"` are Cloudinary's own words; both mean it is gone. */
  result: string;
  error?: string;
};

/**
 * Permanently remove assets from the media library.
 *
 * Uses the signed Upload API (`/image/destroy`) rather than the Admin API's
 * bulk `delete_resources`. Two reasons: it reuses the signing this module
 * already does, so there is one auth mechanism here instead of two (the Admin
 * API wants HTTP Basic with the same secret); and it is not counted against the
 * Admin API's hourly rate limit, which a bulk delete is. The cost is one
 * request per asset, and the requests go out in parallel — a project has a
 * handful of images, not a thousand.
 *
 * **Never throws.** A failure to tidy up storage must not turn a successful
 * content delete into an error the operator has to interpret: the row is
 * already gone, the site is already correct, and the worst case is one
 * unreferenced file left in the library. Failures are returned so the caller
 * can log them.
 */
export async function destroyAssets(
  publicIds: string[],
): Promise<DestroyOutcome[]> {
  if (publicIds.length === 0) return [];

  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;

  return Promise.all(
    publicIds.map(async (publicId): Promise<DestroyOutcome> => {
      const timestamp = Math.floor(Date.now() / 1000);
      const body = new FormData();
      body.append("public_id", publicId);
      body.append("timestamp", String(timestamp));
      body.append("api_key", apiKey);
      body.append(
        "signature",
        sign(
          { public_id: publicId, timestamp: String(timestamp) },
          apiSecret,
        ),
      );

      try {
        const response = await fetch(endpoint, { method: "POST", body });
        const payload = (await response.json().catch(() => null)) as {
          result?: string;
          error?: { message?: string };
        } | null;

        if (!response.ok) {
          return {
            publicId,
            result: "error",
            error:
              payload?.error?.message ?? `Cloudinary replied ${response.status}`,
          };
        }
        return { publicId, result: payload?.result ?? "unknown" };
      } catch (cause) {
        return {
          publicId,
          result: "error",
          error: cause instanceof Error ? cause.message : "request failed",
        };
      }
    }),
  );
}

/* ==========================================================================
   Client-side limits
   ========================================================================== */

/**
 * What the drop zone accepts. Enforced in the browser for a fast, specific
 * message; Cloudinary enforces its own limits regardless, so this is guidance
 * rather than a security boundary.
 */
export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
] as const;

/** 10 MB. Well past any sensible screenshot, well short of a raw photo dump. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
