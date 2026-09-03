import {
  EDUCATION_STATUSES,
  type Certification,
  type Education,
  type EducationStatus,
} from "@/types";

import {
  ErrorBag,
  isHttpUrl,
  isImageSrc,
  isIsoMonth,
  type FieldErrors,
} from "./validation";

/**
 * The wire shapes of the three things the Education screen edits, and the
 * rules each is held to.
 *
 * Three records, one screen: the degree entry, the supporting note that sits
 * under it, and the certificates. They are separate tables with separate
 * actions — `education`, `site_settings` and `certifications` — but they are
 * one thing to read on the public site, so they are one thing to edit here.
 *
 * Same contract as `./project-input` and `./experience-input`: every field is
 * a string so parsing happens once, in the action, and the module imports
 * nothing server-only so the forms and the server actions run the identical
 * validators.
 */

/* ==========================================================================
   Education entry
   ========================================================================== */

export type EducationInput = {
  institution: string;
  fieldOfStudy: string;
  /** An `EducationStatus`. */
  status: string;
  /** `YYYY-MM`. */
  startDate: string;
  /** `YYYY-MM`, or empty while still enrolled. */
  endDate: string;
};

/** A blank entry, for the create form. */
export function emptyEducation(): EducationInput {
  return {
    institution: "",
    fieldOfStudy: "",
    /* An entry is normally added while it is happening. A completed one is
       added retrospectively, which is the rarer case. */
    status: "in-progress",
    startDate: "",
    endDate: "",
  };
}

export function toEducationInput(entry: Education): EducationInput {
  return {
    institution: entry.institution,
    fieldOfStudy: entry.fieldOfStudy,
    status: entry.status,
    startDate: entry.dates.start,
    endDate: entry.dates.end ?? "",
  };
}

/**
 * The completed-with-no-end-date rule is enforced here rather than only in
 * `validateContent()`.
 *
 * That function already flags it on the dashboard, which is where an entry
 * that drifted into the state gets noticed. This stops it being reachable in
 * the first place: "completed" and an open date range is a contradiction, and
 * the public site resolves it by rendering "Present" next to a completed
 * badge, which reads as a bug in the site rather than as a gap in the data.
 */
export function validateEducation(input: EducationInput): FieldErrors {
  const bag = new ErrorBag();

  bag.required("institution", input.institution, "Institution");
  bag.required("fieldOfStudy", input.fieldOfStudy, "Field of study");

  bag.addIf(
    !(EDUCATION_STATUSES as readonly string[]).includes(input.status),
    "status",
    "Pick a status.",
  );

  const start = bag.required("startDate", input.startDate, "Start date");
  bag.addIf(
    start.length > 0 && !isIsoMonth(start),
    "startDate",
    "Use YYYY-MM, for example 2025-09.",
  );

  const end = input.endDate.trim();
  if (end.length > 0) {
    if (!isIsoMonth(end)) {
      bag.add("endDate", "Use YYYY-MM, or leave it empty while still enrolled.");
    } else if (isIsoMonth(start) && end < start) {
      /* String comparison is correct for `YYYY-MM` — see `ISODate` in
         `@/types`. */
      bag.add("endDate", "The end date is before the start date.");
    }
  } else if (input.status === "completed") {
    bag.add(
      "endDate",
      "A completed entry needs an end date — otherwise the site renders it as “Present”.",
    );
  }

  return bag.all;
}

/* ==========================================================================
   Certification
   ========================================================================== */

export type CertificationInput = {
  title: string;
  platform: string;
  description: string;
  /** A Cloudinary URL or a path under `/public`. Empty for none. */
  imageUrl: string;
  credentialUrl: string;
  /** `YYYY-MM`. */
  dateEarned: string;
};

export function emptyCertification(): CertificationInput {
  return {
    title: "",
    /* Every certificate so far. Wrong for the next issuer, and a field that is
       already filled in is easier to correct than one that is empty. */
    platform: "Scrimba",
    description: "",
    imageUrl: "",
    credentialUrl: "",
    dateEarned: "",
  };
}

export function toCertificationInput(entry: Certification): CertificationInput {
  return {
    title: entry.title,
    platform: entry.platform,
    description: entry.description ?? "",
    imageUrl: entry.imageUrl ?? "",
    credentialUrl: entry.credentialUrl,
    dateEarned: entry.dateEarned,
  };
}

/**
 * `credentialUrl` is required; `imageUrl` and `description` are not.
 *
 * That split is the type's, not a preference: `Certification.credentialUrl` is
 * non-optional because a certificate nobody can verify is a claim, while both
 * of the others carry comments saying the card closes up gracefully without
 * them — a certificate can land before its scan and its summary do.
 */
export function validateCertification(
  input: CertificationInput,
): FieldErrors {
  const bag = new ErrorBag();

  bag.required("title", input.title, "Title");
  bag.required("platform", input.platform, "Platform");

  const credentialUrl = bag.required(
    "credentialUrl",
    input.credentialUrl,
    "Credential URL",
  );
  bag.addIf(
    credentialUrl.length > 0 && !isHttpUrl(credentialUrl),
    "credentialUrl",
    "Must start with http:// or https:// — this is the verification link.",
  );

  const imageUrl = input.imageUrl.trim();
  bag.addIf(
    imageUrl.length > 0 && !isImageSrc(imageUrl),
    "imageUrl",
    "Must be an uploaded URL or a path under /public.",
  );

  const earned = bag.required("dateEarned", input.dateEarned, "Date earned");
  bag.addIf(
    earned.length > 0 && !isIsoMonth(earned),
    "dateEarned",
    "Use YYYY-MM, for example 2026-09.",
  );

  return bag.all;
}

/* ==========================================================================
   Site settings
   ========================================================================== */

/**
 * The two fields on the Education section that belong to no entity.
 *
 * They were module-level exports in `src/data/education.ts` with no home in
 * the type model — see the note on `SiteSettings` in the schema. The note is
 * rendered under the entries on both the site and the CV; the URL is the
 * "All certificates" link beside the certification grid.
 */
export type EducationSettingsInput = {
  educationNote: string;
  certificatesUrl: string;
};

export function validateEducationSettings(
  input: EducationSettingsInput,
): FieldErrors {
  const bag = new ErrorBag();

  bag.required("educationNote", input.educationNote, "Education note");

  const url = bag.required(
    "certificatesUrl",
    input.certificatesUrl,
    "Certificates URL",
  );
  bag.addIf(
    url.length > 0 && !isHttpUrl(url),
    "certificatesUrl",
    "Must start with http:// or https://.",
  );

  return bag.all;
}

/* ==========================================================================
   Labels
   ========================================================================== */

export const EDUCATION_STATUS_LABELS: Record<EducationStatus, string> = {
  "in-progress": "In progress",
  completed: "Completed",
};

export const EDUCATION_STATUS_OPTIONS = EDUCATION_STATUSES.map((status) => ({
  value: status,
  label: EDUCATION_STATUS_LABELS[status],
}));

export function educationStatusLabel(status: string): string {
  return EDUCATION_STATUS_LABELS[status as EducationStatus] ?? status;
}

/**
 * Human names for the fields, so a form-level banner can name the field rather
 * than only report that something is wrong.
 */
const FIELD_LABELS: Record<string, string> = {
  institution: "Institution",
  fieldOfStudy: "Field of study",
  status: "Status",
  startDate: "Start date",
  endDate: "End date",
  title: "Title",
  platform: "Platform",
  description: "Description",
  imageUrl: "Certificate image",
  credentialUrl: "Credential URL",
  dateEarned: "Date earned",
  educationNote: "Education note",
  certificatesUrl: "Certificates URL",
};

export function describeField(path: string): string {
  return FIELD_LABELS[path] ?? path;
}
