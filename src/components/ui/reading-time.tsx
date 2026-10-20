import { estimateReadingTime } from "@/lib/blog";

export function ReadingTime({ content }: { content: string }) {
  const label = estimateReadingTime(content);

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap align-middle text-muted">
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        className="size-3.5 shrink-0"
      >
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M8 4.5v3.8l2.5 1.4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </span>
  );
}
