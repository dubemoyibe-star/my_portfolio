"use client";

import { useSyncExternalStore } from "react";

/** Longest path echoed back before it is trimmed. */
const MAX_LENGTH = 48;

/** The location never changes under this component: nothing to subscribe to. */
const subscribe = () => () => {};

function readPath(): string {
  const { pathname } = window.location;
  return pathname.length > MAX_LENGTH
    ? `${pathname.slice(0, MAX_LENGTH)}…`
    : pathname;
}

export type RequestedPathProps = {
  /** Rendered on the server pass and until hydration swaps the real path in. */
  fallback?: string;
};

/**
 * The path the visitor actually asked for, echoed into the 404's terminal
 * block so the error names the miss instead of describing it in the abstract.
 *
 * Read from `window.location`, not from `usePathname()`: Next prerenders this
 * page as `/_not-found` at build time, so the hook would bake that internal
 * route into the markup. `useSyncExternalStore` is what makes reading a
 * browser value safe here — it renders `getServerSnapshot` on the server and
 * again for hydration, so both passes agree, then swaps in the real path.
 *
 * The value is attacker-controlled — it is whatever was in the URL bar — but
 * it lands here as a text child, so React escapes it. The length cap is for
 * layout, not safety: a long path would otherwise stretch the block.
 */
export function RequestedPath({ fallback = "/…" }: RequestedPathProps) {
  const path = useSyncExternalStore(subscribe, readPath, () => fallback);

  return <>{path}</>;
}
