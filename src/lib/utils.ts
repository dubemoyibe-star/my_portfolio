import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with conflict resolution.
 *
 * Conditional classes collapse via clsx, then tailwind-merge resolves
 * collisions so a caller-supplied `className` reliably beats a component
 * default (`px-4` + `px-6` -> `px-6`, not both).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
