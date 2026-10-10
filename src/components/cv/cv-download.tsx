"use client";

import { DownloadIcon } from "@/components/ui/download-icon";

export type CvDownloadProps = {
  /** Suggested filename for the browser's PDF save dialog. */
  fileName: string;
};

export function CvDownload({ fileName }: CvDownloadProps) {
  const print = () => {
    const originalTitle = document.title;
    const restoreTitle = () => {
      document.title = originalTitle;
    };

    document.title = fileName;
    window.addEventListener("afterprint", restoreTitle, { once: true });
    window.print();
  };

  return (
    <button
      type="button"
      onClick={print}
      className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-accent px-4 text-small font-medium text-background transition-shadow hover:shadow-glow-accent"
    >
      <DownloadIcon />
      Print / Save PDF
    </button>
  );
}
