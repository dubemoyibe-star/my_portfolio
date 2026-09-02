import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-session";
import {
  createUploadGrant,
  isCloudinaryConfigured,
  isUploadKind,
} from "@/lib/cloudinary";

/**
 * Mint a one-shot, folder-scoped Cloudinary upload signature.
 *
 * The browser calls this immediately before posting a file to Cloudinary. See
 * `@/lib/cloudinary` for why the file itself does not come through here.
 *
 * `middleware.ts` already gates `/api/admin/*`, and `requireAdmin()` checks
 * again — the same belt-and-braces the admin pages use, for the same reason:
 * this route hands out a credential, and it must not be the matcher string in
 * another file that decides who gets one.
 *
 * `kind` is a key into a fixed map rather than a folder path. A caller cannot
 * name the folder, so no signature this route issues can write outside the
 * three folders the app actually uses.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await requireAdmin();

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Cloudinary is not configured on the server. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      },
      { status: 501 },
    );
  }

  let kind: unknown;
  try {
    kind = ((await request.json()) as { kind?: unknown })?.kind;
  } catch {
    /* Falls through to the same rejection as an unknown kind — there is one
       correct shape and every other body is the same mistake. */
  }

  if (!isUploadKind(kind)) {
    return NextResponse.json(
      { error: "Unknown upload kind." },
      { status: 400 },
    );
  }

  return NextResponse.json(createUploadGrant(kind));
}
