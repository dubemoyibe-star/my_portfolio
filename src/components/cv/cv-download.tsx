"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { DownloadIcon } from "@/components/ui/download-icon";

export type CvDownloadProps = {
  /** Element id of the CV document to capture. */
  targetId: string;
  /** Download filename, without extension. */
  fileName: string;
};

type Status = "idle" | "rendering" | "ready" | "error";

/* A4 in millimetres, with a margin that matches the @page rule. */
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 12;
const SCALE = 2;

type Block = { top: number; bottom: number; keepWithNext: boolean };
type Cut = { start: number; end: number };

/**
 * Chooses page boundaries that fall between blocks rather than through them.
 *
 * The naive approach — one tall capture sliced every N pixels — has no idea
 * what it is cutting, so a break lands mid-sentence and an entry is left
 * truncated at the foot of one page and resumed on the next. This instead
 * measures where each entry actually starts and ends, fills each page with as
 * many whole blocks as fit, and breaks in the gap after the last one.
 *
 * Two rules beyond that:
 *
 * - A block taller than a whole page has to be cut; nothing else is possible.
 *   It is the only case that ever splits.
 * - A page never ends on a `keepWithNext` block, so a section heading cannot be
 *   stranded alone at the bottom with its first entry overleaf.
 */
function paginate(blocks: Block[], usable: number, total: number): Cut[] {
  const pages: Cut[] = [];

  /* No markers found — fall back to fixed slices rather than render nothing. */
  if (blocks.length === 0) {
    for (let y = 0; y < total; y += usable) {
      pages.push({ start: y, end: Math.min(y + usable, total) });
    }
    return pages;
  }

  let cursor = 0;
  let i = 0;

  while (i < blocks.length) {
    const limit = cursor + usable;

    let last = -1;
    for (let k = i; k < blocks.length; k++) {
      if (blocks[k].bottom <= limit) last = k;
      else break;
    }

    /* Not even one block fits: this block is taller than a page. */
    if (last === -1) {
      pages.push({ start: cursor, end: limit });
      cursor = limit;
      if (blocks[i].bottom <= cursor) i += 1;
      continue;
    }

    /* Walk back off any heading that would otherwise close the page. */
    while (last > i && blocks[last].keepWithNext) last -= 1;

    /* The next page resumes exactly where this one ended, never at the next
       block's top: anything between two blocks — the margin, or content with
       no marker on it, such as the skills table — would otherwise fall into
       the gap and vanish from the export entirely. */
    pages.push({ start: cursor, end: blocks[last].bottom });
    cursor = blocks[last].bottom;
    i = last + 1;
  }

  /* Absorb anything trailing the final block into the last page, or give it a
     page of its own if it will not fit. */
  const lastPage = pages[pages.length - 1];
  if (lastPage && total > lastPage.end + 1) {
    if (total - lastPage.start <= usable) lastPage.end = total;
    else pages.push({ start: lastPage.end, end: total });
  }

  return pages;
}

/**
 * Renders the CV to page images, previews them, and writes an A4 PDF.
 *
 * `jspdf` and `html2canvas-pro` are imported inside the handler, not at module
 * scope: together they are the heaviest thing on the site by a wide margin, and
 * nobody should pay for them just to read the CV on screen. They load on click.
 *
 * `html2canvas-pro` rather than `html2canvas`: Tailwind v4 emits `oklch()` and
 * `color-mix()`, which the original throws an unsupported-colour error on.
 *
 * The capture runs against a clone carrying the paper palette, so the export is
 * ink on white rather than a screenshot of a dark website — and the page behind
 * the modal never flickers. Block positions are measured on the live DOM, which
 * is safe because the clone only changes colour, and colour moves nothing.
 */
export function CvDownload({ targetId, fileName }: CvDownloadProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [pages, setPages] = useState<string[]>([]);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  /** Millimetre height of each rendered page image, parallel to `pages`. */
  const heightsRef = useRef<number[]>([]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const openPreview = async () => {
    setOpen(true);
    setStatus("rendering");
    setPages([]);

    try {
      const target = document.getElementById(targetId);
      if (!target) throw new Error(`No element with id "${targetId}"`);

      /* Measured before capturing: same layout, and the clone no longer exists
         by the time html2canvas resolves. */
      const rootTop = target.getBoundingClientRect().top;
      const blocks: Block[] = Array.from(
        target.querySelectorAll<HTMLElement>("[data-cv-block]"),
      ).map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          top: (rect.top - rootTop) * SCALE,
          bottom: (rect.bottom - rootTop) * SCALE,
          keepWithNext: element.hasAttribute("data-cv-keep-with-next"),
        };
      });

      const { default: html2canvas } = await import("html2canvas-pro");

      const canvas = await html2canvas(target, {
        scale: SCALE,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (_document: Document, element: HTMLElement) => {
          element.classList.add("cv-paper");
        },
      });

      const imageWidth = PAGE_WIDTH - MARGIN * 2;
      const pixelsPerMm = canvas.width / imageWidth;
      const usable = (PAGE_HEIGHT - MARGIN * 2) * pixelsPerMm;

      const cuts = paginate(blocks, usable, canvas.height);
      const rendered: string[] = [];
      const heights: number[] = [];

      for (const cut of cuts) {
        const start = Math.max(0, Math.round(cut.start));
        const height = Math.round(cut.end) - start;
        if (height <= 0) continue;

        const page = document.createElement("canvas");
        page.width = canvas.width;
        page.height = height;

        const context = page.getContext("2d");
        if (!context) throw new Error("Could not get a 2D context");

        /* Paint the sheet first: a short final page must not come out
           transparent. */
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, page.width, page.height);
        context.drawImage(
          canvas,
          0,
          start,
          canvas.width,
          height,
          0,
          0,
          canvas.width,
          height,
        );

        rendered.push(page.toDataURL("image/png"));
        heights.push(height / pixelsPerMm);
      }

      heightsRef.current = heights;
      setPages(rendered);
      setStatus("ready");
    } catch (error) {
      console.error("[cv] preview failed", error);
      setStatus("error");
    }
  };

  const download = async () => {
    if (pages.length === 0) return;

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const imageWidth = PAGE_WIDTH - MARGIN * 2;

    pages.forEach((page, index) => {
      if (index > 0) pdf.addPage();
      pdf.addImage(
        page,
        "PNG",
        MARGIN,
        MARGIN,
        imageWidth,
        heightsRef.current[index],
      );
    });

    pdf.save(`${fileName}.pdf`);
    close();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPreview}
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-accent px-4 text-small font-medium text-background transition-shadow hover:shadow-glow-accent"
      >
        <DownloadIcon />
        Download PDF
      </button>

      {open
        ? createPortal(
            <>
              <div
                aria-hidden="true"
                onClick={close}
                className="fixed inset-0 z-90 bg-overlay"
              />

              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="PDF preview"
                tabIndex={-1}
                className="fixed inset-4 z-100 flex flex-col overflow-hidden rounded-lg border border-border bg-surface outline-none sm:inset-8 lg:inset-x-[max(2rem,calc(50vw-26rem))] lg:inset-y-10"
              >
                <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
                  <p className="label text-muted">
                    PDF preview
                    {status === "ready" && pages.length > 0
                      ? ` · ${pages.length} page${pages.length > 1 ? "s" : ""}`
                      : null}
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close preview"
                    className="flex size-9 cursor-pointer items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-border-strong hover:text-foreground"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
                  {status === "rendering" ? (
                    <p className="py-16 text-center text-small text-muted">
                      Rendering preview…
                    </p>
                  ) : null}

                  {status === "error" ? (
                    <p className="py-16 text-center text-small text-warning">
                      Could not render the preview. You can still use your
                      browser&rsquo;s print dialog to save a PDF.
                    </p>
                  ) : null}

                  {status === "ready" ? (
                    <div className="mx-auto flex max-w-2xl flex-col gap-6">
                      {/* Every page is shown, so the breaks are reviewable
                          before anything is written to disk. */}
                      {pages.map((page, index) => (
                        <figure
                          key={`page-${index}`}
                          className="flex flex-col gap-2"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element --
                              a canvas data URL, not an asset the optimizer can touch. */}
                          <img
                            src={page}
                            alt={`CV page ${index + 1} of ${pages.length}`}
                            className="w-full rounded border border-border shadow-lg"
                          />
                          <figcaption className="label text-center text-muted">
                            Page {index + 1} of {pages.length}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-5 py-4">
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex h-10 cursor-pointer items-center rounded-md border border-border px-4 text-small text-muted transition-colors hover:border-border-strong hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={download}
                    disabled={status !== "ready" || pages.length === 0}
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-accent px-4 text-small font-medium text-background transition-shadow hover:shadow-glow-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
                  >
                    <DownloadIcon />
                    Download {fileName}.pdf
                  </button>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
