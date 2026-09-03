import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/chrome";
import { formatStamp } from "@/lib/admin/format";
import { emptyProfile, toProfileInput } from "@/lib/admin/profile-input";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { getProfile } from "@/lib/data";
import { prisma } from "@/lib/prisma";

import { ProfileForm } from "./profile-form";

/**
 * Profile: the one record the whole site is about.
 *
 * No list, no table, no `/new` route. `Profile` is a single row pinned to
 * `id = "profile"` — the schema makes a second one impossible to insert by
 * accident — so a list view would be a page whose only job is to be clicked
 * through to the only thing on it. The editor is the page.
 *
 * ## Read through the data layer
 *
 * `getProfile()` rather than mapping the row here, so the form is populated by
 * exactly the translation the public site renders from. If the two ever
 * disagree about what a column means, the bug shows up in this form rather
 * than silently on the site.
 *
 * ## Why the row's existence is checked separately
 *
 * `getProfile()` throws on a missing row — deliberately: every page renders
 * the profile, and a placeholder would ship a site with someone else's name on
 * it. That is right for the public site and wrong for this screen, which is
 * where an operator would go to fix precisely that. So the count is asked
 * first, and an empty table yields a blank form whose first save creates the
 * row through the upsert in `./actions`.
 */

export const metadata: Metadata = {
  title: "Profile",
};

export default async function AdminProfilePage() {
  /* `updatedAt` is not on the `Profile` type — it is row lifecycle, which the
     public site has no use for — so it is read from the row alongside the
     existence check rather than through the data layer. */
  const row = await prisma.profile.findUnique({
    where: { id: "profile" },
    select: { updatedAt: true },
  });

  const initial = row ? toProfileInput(await getProfile()) : emptyProfile();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Profile"
        description="Name, tagline, both bios, the portrait, contact links and the CV header copy. Every section of the site reads this row — the hero, the header wordmark, the CV, the sitemap and llms.txt."
        actions={
          <>
            <Link
              href="/cv"
              target="_blank"
              rel="noreferrer"
              className="label text-muted transition-colors hover:text-foreground"
            >
              CV ↗
            </Link>
            <Link
              href="/#top"
              target="_blank"
              rel="noreferrer"
              className="label text-muted transition-colors hover:text-foreground"
            >
              View on site ↗
            </Link>
          </>
        }
      />

      {row ? (
        <p className="-mt-2 text-small text-muted">
          <span className="font-mono">profile</span>
          {" · updated "}
          <span title={row.updatedAt.toISOString()}>
            {formatStamp(row.updatedAt)}
          </span>
        </p>
      ) : null}

      <ProfileForm
        initial={initial}
        exists={row !== null}
        cloudinaryConfigured={isCloudinaryConfigured()}
      />
    </div>
  );
}
