import { cn } from "@/lib/utils";

type ContainerProps = {
  /**
   * `page` is the default content column (72rem).
   * `wide` is for sections that need more room (84rem).
   * `prose` caps long-form copy at a readable measure (42rem).
   */
  width?: "page" | "wide" | "prose";
  /** Render as a different element - `section`, `header`, `footer`, ... */
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
};

const widths = {
  page: "max-w-page",
  wide: "max-w-page-wide",
  prose: "max-w-prose-page",
} as const;

/**
 * Horizontal layout primitive: centers content and owns the page gutters.
 *
 * Every section should sit inside one of these rather than setting its own
 * padding, so the left edge of the site stays on a single vertical line.
 */
export function Container({
  width = "page",
  as: Component = "div",
  className,
  children,
}: ContainerProps) {
  return (
    <Component
      className={cn("mx-auto w-full px-5 lg:px-8", widths[width], className)}
    >
      {children}
    </Component>
  );
}
