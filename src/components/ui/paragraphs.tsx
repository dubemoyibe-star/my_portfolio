import { cn } from "@/lib/utils";

export type ParagraphsProps = {
  /** Blank-line separated text, as stored on `description` fields. */
  text: string;
  className?: string;
};

/**
 * Renders blank-line separated copy as real paragraphs.
 *
 * The data layer stores prose with `\n\n` between paragraphs. Dropped into JSX
 * as-is that collapses to one run-on block, and `whitespace-pre-line` would
 * keep the breaks but give no paragraph spacing to style.
 */
export function Paragraphs({ text, className }: ParagraphsProps) {
  const paragraphs = text.split("\n\n").filter(Boolean);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-pretty">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
