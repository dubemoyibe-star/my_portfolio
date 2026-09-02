"use client";

import { useCallback, useId, useRef, useState } from "react";

import { buttonGhost, buttonIcon } from "@/components/admin/chrome";
import { Field, TextInput } from "@/components/admin/fields";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  type UploadKind,
} from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

/**
 * Cloudinary upload, from the browser's side.
 *
 * The flow is two requests, and the split is the whole security argument:
 *
 *  1. POST `/api/admin/upload-signature` — an authenticated route on this site
 *     that hands back a short-lived, folder-scoped signature. No Cloudinary
 *     credential is in this bundle; the API secret exists only on the server.
 *  2. POST the file straight to Cloudinary with that signature attached. The
 *     bytes never pass through a serverless function, so a 6 MB screenshot is
 *     not an upload that fails at a request-body limit.
 *
 * Only `secure_url`, `width` and `height` are kept from the response — see the
 * note in `@/lib/cloudinary` on why the rest is dropped.
 *
 * ## Why XHR and not fetch
 *
 * `fetch` cannot report upload progress. An image upload is the one thing in
 * this admin that is slow enough for a spinner to be a worse answer than a bar,
 * and `XMLHttpRequest.upload.onprogress` is still the only way to get one.
 */

/** What an upload yields, and what the forms store. */
export type UploadedImage = {
  src: string;
  width?: number;
  height?: number;
};

type UploadGrant = {
  url: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

/* ==========================================================================
   The upload itself
   ========================================================================== */

function describeSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Reject what Cloudinary would reject anyway, but immediately and by name.
 *
 * This is guidance, not a boundary — the server-side grant is what actually
 * constrains an upload. Its value is that "that file is 24 MB" arrives before
 * a 24 MB transfer rather than after one.
 */
function localRejection(file: File): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name} is not an image this accepts (PNG, JPEG, WebP, AVIF, GIF or SVG).`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${file.name} is ${describeSize(file.size)}. The limit is ${describeSize(MAX_UPLOAD_BYTES)}.`;
  }
  return null;
}

async function requestGrant(kind: UploadKind): Promise<UploadGrant> {
  const response = await fetch("/api/admin/upload-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Could not authorize the upload.");
  }

  return (await response.json()) as UploadGrant;
}

function postToCloudinary(
  file: File,
  grant: UploadGrant,
  onProgress: (percent: number) => void,
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", grant.apiKey);
    form.append("timestamp", String(grant.timestamp));
    form.append("folder", grant.folder);
    form.append("signature", grant.signature);

    const request = new XMLHttpRequest();
    request.open("POST", grant.url);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onerror = () =>
      reject(new Error("Could not reach Cloudinary. Check your connection."));

    request.onload = () => {
      let payload: {
        secure_url?: string;
        width?: number;
        height?: number;
        error?: { message?: string };
      };
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        reject(new Error("Cloudinary returned a response that made no sense."));
        return;
      }

      if (request.status < 200 || request.status >= 300 || !payload.secure_url) {
        reject(
          new Error(
            payload.error?.message ?? `Cloudinary rejected the upload (${request.status}).`,
          ),
        );
        return;
      }

      resolve({
        src: payload.secure_url,
        width: payload.width,
        height: payload.height,
      });
    };

    request.send(form);
  });
}

/* ==========================================================================
   Drop zone
   ========================================================================== */

type UploadDropzoneProps = {
  kind: UploadKind;
  /**
   * Called once per batch, with everything that uploaded successfully, in the
   * order the files were given.
   *
   * Once per batch rather than once per file, and that is load-bearing: a
   * per-file callback fires several times inside one `await` loop, and every
   * one of those calls closes over the same render's state. The second append
   * would overwrite the first, and a drop of four images would land as one.
   * Handing back the whole batch means the caller does a single append from a
   * value it can see.
   *
   * A batch that fails partway still reports what got through before the
   * failure — those files are on Cloudinary either way, and dropping them
   * would mean re-uploading bytes that already arrived.
   */
  onUploaded: (images: UploadedImage[]) => void;
  multiple?: boolean;
  /** Server-side check, passed down so the zone can explain itself instead of
      failing on click. */
  configured?: boolean;
  label?: string;
  className?: string;
};

export function UploadDropzone({
  kind,
  onUploaded,
  multiple = false,
  configured = true,
  label = "Drop an image here, or",
  className,
}: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [busyWith, setBusyWith] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  /* Drag events fire on every child the pointer crosses, so a plain
     enter/leave pair flickers the highlight as the cursor moves over the text
     inside the zone. Counting them means the state only flips at the real
     boundary. */
  const dragDepth = useRef(0);

  const uploadAll = useCallback(
    async (files: File[]) => {
      setError(null);
      const uploaded: UploadedImage[] = [];

      try {
        for (const file of files) {
          const rejection = localRejection(file);
          if (rejection) {
            setError(rejection);
            /* Stop rather than skip: a batch that silently drops two of five
               files leaves the operator to notice the gap themselves. */
            break;
          }

          setBusyWith(file.name);
          setPercent(0);
          try {
            const grant = await requestGrant(kind);
            uploaded.push(await postToCloudinary(file, grant, setPercent));
          } catch (cause) {
            setError(
              cause instanceof Error ? cause.message : "The upload failed.",
            );
            break;
          }
        }
      } finally {
        setBusyWith(null);
        if (uploaded.length > 0) onUploaded(uploaded);
      }
    },
    [kind, onUploaded],
  );

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    void uploadAll(multiple ? Array.from(list) : [list[0]]);
  }

  const busy = busyWith !== null;

  if (!configured) {
    return (
      <div className="rounded-md border border-dashed border-warning/40 bg-warning-subtle px-4 py-5 text-small text-warning">
        <p className="font-medium">Cloudinary is not configured.</p>
        <p className="mt-1 text-warning/80">
          Set <code>CLOUDINARY_CLOUD_NAME</code>, <code>CLOUDINARY_API_KEY</code>{" "}
          and <code>CLOUDINARY_API_SECRET</code> in <code>.env.local</code>, then
          restart the dev server. Existing image URLs still work.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => {
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          if (!busy) handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-6 text-center transition-colors",
          dragging
            ? "border-accent bg-accent-subtle"
            : "border-border-strong bg-background/60",
          busy && "opacity-70",
        )}
      >
        {busy ? (
          <>
            <p className="text-small text-foreground">
              Uploading{" "}
              <span className="font-mono text-muted">{busyWith}</span>
            </p>
            {/* A real determinate bar. `aria-valuenow` carries the same number
                for anyone who cannot see it move. */}
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label="Upload progress"
              className="h-1 w-48 overflow-hidden rounded-full bg-border-strong"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-150"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="label text-muted">{percent}%</p>
          </>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-5 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 16V4m0 0L8 8m4-4l4 4" />
              <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
            </svg>

            <p className="text-small text-muted">
              {label}{" "}
              <label
                htmlFor={inputId}
                className="cursor-pointer text-link underline-offset-2 hover:underline"
              >
                choose {multiple ? "files" : "a file"}
              </label>
            </p>
            <p className="label text-muted/70">
              PNG, JPEG, WebP, AVIF, GIF or SVG — up to{" "}
              {describeSize(MAX_UPLOAD_BYTES)}
            </p>
          </>
        )}

        <input
          id={inputId}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          multiple={multiple}
          disabled={busy}
          onChange={(event) => {
            handleFiles(event.target.files);
            /* Cleared so re-selecting the same file fires `change` again —
               otherwise a failed upload cannot be retried with the same pick. */
            event.target.value = "";
          }}
          className="sr-only"
        />
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-small text-warning">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ==========================================================================
   Project images
   ========================================================================== */

/** One row of the images editor. Mirrors `ImageAsset` plus its stored order. */
export type ImageDraft = {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
};

type ImageListFieldProps = {
  kind: UploadKind;
  images: ImageDraft[];
  onChange: (next: ImageDraft[]) => void;
  configured?: boolean;
  /** Keyed `images.<index>.<field>`, matching the server's error paths. */
  errors?: Record<string, string>;
  /**
   * Prefix for the generated control ids.
   *
   * Supplied by the parent form rather than generated here so that the id of
   * a row's alt field is derivable from its error path — `images.2.alt`
   * becomes `project-images-2-alt`. That is what lets the form move focus to
   * the first failing field without the two files agreeing on anything more
   * than a naming rule.
   */
  idPrefix?: string;
};

/**
 * The multi-image editor: upload, describe, reorder, remove.
 *
 * ## Order is content
 *
 * The first image is the card cover on the public site — that is a rule in the
 * schema, not a rendering accident — so the list says so out loud and the move
 * controls are a first-class part of the row rather than something hidden
 * behind a drag affordance. Up/down buttons over drag-and-drop: they work from
 * the keyboard without a single line of extra code, they are unambiguous about
 * where an item landed, and there are rarely more than four images to sort.
 *
 * ## Alt text is required
 *
 * Not a style preference — `ImageAsset.alt` is a required field on the type,
 * with a comment explaining that an image without alt text is a bug. The form
 * enforces the same thing at the point the image is added, which is the only
 * moment anyone actually remembers what the picture shows.
 */
export function ImageListField({
  kind,
  images,
  onChange,
  configured = true,
  errors = {},
  idPrefix,
}: ImageListFieldProps) {
  const generatedPrefix = useId();
  const fieldPrefix = idPrefix ?? generatedPrefix;

  function update(index: number, patch: Partial<ImageDraft>) {
    onChange(images.map((image, i) => (i === index ? { ...image, ...patch } : image)));
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <UploadDropzone
        kind={kind}
        multiple
        configured={configured}
        label="Drop images here, or"
        onUploaded={(uploaded) =>
          onChange([
            ...images,
            ...uploaded.map((image) => ({
              src: image.src,
              width: image.width,
              height: image.height,
              /* Alt is deliberately blank rather than seeded from the filename.
                 "screenshot-2026-04-11.png" as alt text is worse than none: it
                 passes every automated check and tells a screen-reader user
                 nothing. The empty required field is the prompt. */
              alt: "",
              caption: "",
            })),
          ])
        }
      />

      {images.length === 0 ? (
        <p className="text-small text-muted">
          No images yet. The first one added becomes the card cover on the
          public site.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {images.map((image, index) => (
            <li
              key={`${image.src}-${index}`}
              className="rounded-md border border-border bg-background/50 p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex shrink-0 gap-3">
                  {/* A plain `<img>`, not `next/image`: this is a 96px admin
                      thumbnail of an image the operator uploaded seconds ago,
                      and routing it through the optimizer would spend a
                      transform on a preview nobody but them will ever see. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.src}
                    alt=""
                    className="size-24 shrink-0 rounded border border-border object-cover"
                  />

                  <div className="flex flex-col gap-1">
                    <span className="label text-muted">
                      {index === 0 ? (
                        <span className="text-accent">Cover</span>
                      ) : (
                        `#${index + 1}`
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move image ${index + 1} up`}
                      className={buttonIcon}
                    >
                      <ChevronIcon direction="up" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === images.length - 1}
                      aria-label={`Move image ${index + 1} down`}
                      className={buttonIcon}
                    >
                      <ChevronIcon direction="down" />
                    </button>
                  </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <Field
                    label="Alt text"
                    required
                    htmlFor={`${fieldPrefix}-images-${index}-alt`}
                    error={errors[`images.${index}.alt`]}
                    hint="What the image shows, for anyone who cannot see it."
                  >
                    <TextInput
                      id={`${fieldPrefix}-images-${index}-alt`}
                      value={image.alt}
                      error={errors[`images.${index}.alt`]}
                      hint="What the image shows, for anyone who cannot see it."
                      onChange={(event) => update(index, { alt: event.target.value })}
                      placeholder="Stenion landing page: a dark hero reading…"
                    />
                  </Field>

                  <Field
                    label="Caption"
                    htmlFor={`${fieldPrefix}-images-${index}-caption`}
                    hint="Optional. Shown under the image where one is rendered."
                  >
                    <TextInput
                      id={`${fieldPrefix}-images-${index}-caption`}
                      value={image.caption}
                      hint="Optional. Shown under the image where one is rendered."
                      onChange={(event) =>
                        update(index, { caption: event.target.value })
                      }
                    />
                  </Field>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="label truncate text-muted/80">
                      {image.width && image.height
                        ? `${image.width}×${image.height}`
                        : "dimensions unknown"}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className={cn(
                        buttonGhost,
                        "h-8 hover:border-warning/50 hover:text-warning",
                      )}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-4", direction === "down" && "rotate-180")}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}
