"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";

type ShareNetwork = {
  name: string;
  icon: string;
  href: string;
  copyFirst?: boolean;
};

export function ArticleShareLinks({
  shareText,
  networks,
}: {
  shareText: string;
  networks: ShareNetwork[];
}) {
  const [status, setStatus] = useState("");
  const [copiedNetwork, setCopiedNetwork] = useState<string | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
  }, []);

  function showCopied(networkName: string) {
    setCopiedNetwork(networkName);
    setStatus("Copied");
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => setCopiedNetwork(null), 1800);
  }

  function share(network: ShareNetwork) {
    window.open(network.href, "_blank", "noopener,noreferrer");

    if (!network.copyFirst) return;

    void navigator.clipboard
      .writeText(shareText)
      .then(() => showCopied(network.name))
      .catch(() => {
        setCopiedNetwork(network.name);
        setStatus("Copy failed");
        if (fadeTimer.current) clearTimeout(fadeTimer.current);
        fadeTimer.current = setTimeout(() => setCopiedNetwork(null), 1800);
      });
  }

  return (
    <div>
      <nav aria-label="Share this article" className="flex flex-wrap items-center gap-2">
        <span className="label mr-1 text-muted">Share</span>
        {networks.map((network) => (
          <span key={network.name} className="relative inline-flex">
            <button
              type="button"
              onClick={() => share(network)}
              aria-label={`Share on ${network.name}`}
              title={`Share on ${network.name}`}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-md border border-border text-foreground transition-colors hover:border-border-strong hover:text-link focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
              <Icon name={network.icon} className="size-4" />
            </button>
            {network.copyFirst ? (
              <span
                role="status"
                className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background shadow transition-opacity duration-300 ${
                  copiedNetwork === network.name ? "opacity-100" : "opacity-0"
                }`}
              >
                {copiedNetwork === network.name ? status : "Copied"}
              </span>
            ) : null}
          </span>
        ))}
      </nav>
    </div>
  );
}
