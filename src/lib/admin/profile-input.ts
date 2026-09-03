import type { ImageAsset, Profile } from "@/types";

import {
  ErrorBag,
  isEmail,
  isHttpUrl,
  isImageSrc,
  isIsoDay,
  type FieldErrors,
} from "./validation";

/**
 * The wire shape of the profile editor, and the rules it is held to.
 *
 * Same contract as `./project-input` and `./experience-input`: every scalar is
 * a string so parsing happens once, in the action, and this module imports
 * nothing server-only so the form and the server action run the identical
 * validators. Booleans are the exception — a toggle has no empty state to
 * disagree about.
 *
 * ## Why the portraits are nested and the resume fields are not
 *
 * `avatar` and `avatarCompact` are `ImageAsset`s on the type and flatten to
 * five prefixed columns each in the schema. Keeping them nested here means the
 * uploader writes one object, alt text is validated per portrait rather than
 * per column, and clearing a portrait is `emptyAvatar()` rather than five
 * assignments that can be done four-fifths of the way.
 *
 * `resume` stays flat — `resumeTitle`, `resumeSummary` — because those fields
 * have nothing in common except a prefix. Nothing clears "the resume" the way
 * removing a portrait clears one, so grouping them would buy a level of
 * nesting and nothing else.
 *
 * ## What is not editable here
 *
 * Nothing. Every column on `Profile` and every column on `ContactLink` has a
 * field on this form, including the CV-only one (`resumePhone` never renders
 * on a public page) and the one the public site does not read yet
 * (`bio.long`). A field that exists in the schema and not in the editor is a
 * value only a database client can change, which is the situation the admin
 * panel exists to end.
 */

/* ==========================================================================
   Contact links
   ========================================================================== */

/**
 * One row of the links editor. Mirrors `ContactLink`; `position` is absent
 * because it is the array index — see the note in the profile action.
 */
export type ContactLinkInput = {
  label: string;
  href: string;
  /** simple-icons slug, resolved by `@/components/ui/icon`. Empty for none. */
  icon: string;
  /** Display form: `@handle`, an email address, a bare domain. Empty for none. */
  handle: string;
  primary: boolean;
};

export function emptyContactLink(): ContactLinkInput {
  return { label: "", href: "", icon: "", handle: "", primary: false };
}

/* ==========================================================================
   Portraits
   ========================================================================== */

/** One portrait. Mirrors `ImageAsset`; an empty `src` means "no portrait". */
export type AvatarInput = {
  src: string;
  alt: string;
  caption: string;
  /** Intrinsic dimensions, as the uploader reported them. */
  width?: number;
  height?: number;
};

export function emptyAvatar(): AvatarInput {
  return { src: "", alt: "", caption: "" };
}

function toAvatarInput(image: ImageAsset | undefined): AvatarInput {
  if (!image) return emptyAvatar();
  return {
    src: image.src,
    alt: image.alt,
    caption: image.caption ?? "",
    width: image.width,
    height: image.height,
  };
}

/* ==========================================================================
   The record
   ========================================================================== */

export type ProfileInput = {
  name: string;
  tagline: string;
  bioShort: string;
  /** Markdown. */
  bioLong: string;
  email: string;
  location: string;
  availableForWork: boolean;

  avatar: AvatarInput;
  avatarCompact: AvatarInput;

  links: ContactLinkInput[];

  resumeTitle: string;
  resumeSummary: string;
  /** Download filename, without extension. */
  resumeFileName: string;
  resumeLocation: string;
  /** CV-only. Never rendered on a public page. */
  resumePhone: string;
  /** `YYYY-MM-DD`. */
  resumeUpdatedAt: string;
};

/**
 * A blank profile.
 *
 * Unlike every other section this is not a "create" form — there is one
 * profile row and the seed writes it. This exists for the single case where
 * the row is missing: an unseeded database, where the alternative is an admin
 * page that crashes on the screen you would use to fix it. See the note in
 * the profile page.
 */
export function emptyProfile(): ProfileInput {
  return {
    name: "",
    tagline: "",
    bioShort: "",
    bioLong: "",
    email: "",
    location: "",
    availableForWork: false,
    avatar: emptyAvatar(),
    avatarCompact: emptyAvatar(),
    links: [],
    resumeTitle: "",
    resumeSummary: "",
    resumeFileName: "",
    resumeLocation: "",
    resumePhone: "",
    resumeUpdatedAt: "",
  };
}

/** An existing profile, as the form wants it. */
export function toProfileInput(profile: Profile): ProfileInput {
  return {
    name: profile.name,
    tagline: profile.tagline,
    bioShort: profile.bio.short,
    bioLong: profile.bio.long,
    email: profile.email,
    location: profile.location ?? "",
    availableForWork: profile.availableForWork ?? false,
    avatar: toAvatarInput(profile.avatar),
    avatarCompact: toAvatarInput(profile.avatarCompact),
    links: profile.links.map((link) => ({
      label: link.label,
      href: link.href,
      icon: link.icon ?? "",
      handle: link.handle ?? "",
      primary: link.primary ?? false,
    })),
    resumeTitle: profile.resume.title,
    resumeSummary: profile.resume.summary,
    resumeFileName: profile.resume.fileName,
    resumeLocation: profile.resume.location ?? "",
    resumePhone: profile.resume.phone ?? "",
    resumeUpdatedAt: profile.resume.updatedAt,
  };
}

/* ==========================================================================
   Validation
   ========================================================================== */

/**
 * A filename, not a path.
 *
 * `resume.fileName` is handed to the CV download as `${fileName}.pdf`, so a
 * slash or a `..` in it is a value that decides where a file lands rather than
 * what it is called. Letters, digits and single separators only, and no
 * extension — the download adds its own.
 */
const FILE_NAME = /^[a-zA-Z0-9]+(?:[-_.][a-zA-Z0-9]+)*$/;

/**
 * Every rule the profile is held to.
 *
 * The required set is the type's, not a preference: `name`, `tagline`, both
 * halves of `bio`, `email`, and `resume.title`, `summary`, `fileName` and
 * `updatedAt` are all non-optional on `Profile`, and the public site renders
 * each of them with no fallback. `location`, the portraits, the handles and
 * the icons are optional there and optional here.
 *
 * ## A portrait is its source plus its alt text, or it is nothing
 *
 * `ImageAsset.alt` is required on the type, with a comment saying an image
 * without alt text is a bug rather than a choice — the same rule the project
 * images editor enforces. So alt is required exactly when a source is present,
 * and a portrait with neither is simply absent.
 */
export function validateProfile(input: ProfileInput): FieldErrors {
  const bag = new ErrorBag();

  bag.required("name", input.name, "Name");
  bag.required("tagline", input.tagline, "Tagline");
  bag.required("bioShort", input.bioShort, "Short bio");
  bag.required("bioLong", input.bioLong, "Long bio");

  const email = bag.required("email", input.email, "Email");
  bag.addIf(
    email.length > 0 && !isEmail(email),
    "email",
    "That does not look like an email address.",
  );

  validateAvatar(bag, "avatar", input.avatar, "The portrait");
  validateAvatar(bag, "avatarCompact", input.avatarCompact, "The compact portrait");

  for (const [index, link] of input.links.entries()) {
    const label = link.label.trim();
    const href = link.href.trim();

    /* Validated as a pair. A label with no destination is a dead row in the
       hero; a URL with no label is an icon button whose accessible name is
       empty, which is the one thing that list must not render. */
    bag.addIf(label.length === 0, `links.${index}.label`, "Label is required.");
    bag.addIf(href.length === 0, `links.${index}.href`, "URL is required.");
    bag.addIf(
      href.length > 0 && !isHttpUrl(href),
      `links.${index}.href`,
      "Must start with http:// or https://.",
    );
  }

  bag.required("resumeTitle", input.resumeTitle, "CV title");
  bag.required("resumeSummary", input.resumeSummary, "CV summary");

  const fileName = bag.required(
    "resumeFileName",
    input.resumeFileName,
    "Download filename",
  );
  bag.addIf(
    fileName.length > 0 && !FILE_NAME.test(fileName),
    "resumeFileName",
    "Letters, digits, hyphens and underscores only, and no extension — the download adds .pdf itself.",
  );

  const updatedAt = bag.required(
    "resumeUpdatedAt",
    input.resumeUpdatedAt,
    "CV last reviewed",
  );
  bag.addIf(
    updatedAt.length > 0 && !isIsoDay(updatedAt),
    "resumeUpdatedAt",
    "Use YYYY-MM-DD, for example 2026-09-01.",
  );

  return bag.all;
}

function validateAvatar(
  bag: ErrorBag,
  field: "avatar" | "avatarCompact",
  avatar: AvatarInput,
  label: string,
): void {
  const src = avatar.src.trim();
  if (src.length === 0) return;

  bag.addIf(
    !isImageSrc(src),
    `${field}.src`,
    `${label} must be an uploaded URL or a path under /public.`,
  );
  bag.addIf(
    avatar.alt.trim().length === 0,
    `${field}.alt`,
    "Alt text is required — an image without it is a bug, not a choice.",
  );
}

/* ==========================================================================
   Field labels
   ========================================================================== */

/**
 * Human names for the fields, so the form-level banner can say which panel to
 * look in rather than only that something is wrong somewhere. Nested paths are
 * resolved by prefix, since their index is not known here.
 */
const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  tagline: "Tagline",
  bioShort: "Short bio",
  bioLong: "Long bio",
  email: "Email",
  location: "Location",
  resumeTitle: "CV title",
  resumeSummary: "CV summary",
  resumeFileName: "Download filename",
  resumeLocation: "CV location",
  resumePhone: "CV phone",
  resumeUpdatedAt: "CV last reviewed",
};

export function describeField(path: string): string {
  if (FIELD_LABELS[path]) return FIELD_LABELS[path];
  /* Checked before `avatar.`, which is a prefix of it. */
  if (path.startsWith("avatarCompact.")) return "Compact portrait";
  if (path.startsWith("avatar.")) return "Portrait";
  if (path.startsWith("links.")) return "Contact links";
  return path;
}
