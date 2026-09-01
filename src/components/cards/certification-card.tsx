import Image from "next/image";

import { LinkButton } from "@/components/ui/link-button";
import { formatMonth } from "@/lib/format";
import type { Certification } from "@/types";

export type CertificationCardProps = {
  certification: Certification;
};

export function CertificationCard({ certification }: CertificationCardProps) {
  const { title, platform, description, imageUrl, credentialUrl, dateEarned } =
    certification;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      {/* 11/6 (1.833:1) matches the certificate scans to within half a percent,
          so object-cover has essentially nothing to trim. Same rule as project
          covers: a missing image degrades to type, never to a broken frame. */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${title} certificate from ${platform}`}
          width={1100}
          height={600}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="aspect-[11/6] w-full border-b border-border object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex aspect-[11/6] items-center justify-center border-b border-border bg-surface-raised px-6"
        >
          <span className="label text-center text-muted">{platform}</span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="label flex items-center gap-2 text-muted">
            <span aria-hidden="true" className="h-px w-4 bg-accent" />
            {platform}
          </p>
          <span className="label text-muted">{formatMonth(dateEarned)}</span>
        </div>

        <h3 className="mt-3 text-pretty text-h5">{title}</h3>

        {description ? (
          <p className="mt-3 text-pretty text-small text-muted">
            {description}
          </p>
        ) : null}

        <div className="mt-auto pt-5">
          <LinkButton href={credentialUrl}>View certificate</LinkButton>
        </div>
      </div>
    </article>
  );
}
