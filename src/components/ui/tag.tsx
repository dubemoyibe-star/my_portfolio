import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export type TagProps = {
  /** Icon slug. Omit for free-form labels that have no registry entry. */
  icon?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Small labelled pill, used for tech on both project and contribution cards.
 *
 * Contribution tech is free-form text with no icon slug, so `icon` is optional
 * and the pill simply closes up around the label when it is absent.
 */
export function Tag({ icon, className, children }: TagProps) {
  return (
    <li
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-border bg-surface py-1 text-small text-foreground",
        icon ? "pl-2 pr-2.5" : "px-2.5",
        className,
      )}
    >
      {/* `fallback` keeps every pill the same shape: a label whose icon does
          not resolve gets the neutral glyph rather than closing up and sitting
          shorter than the pills beside it. */}
      {icon ? (
        <Icon name={icon} brand fallback className="size-3.5 shrink-0" />
      ) : null}
      {children}
    </li>
  );
}
