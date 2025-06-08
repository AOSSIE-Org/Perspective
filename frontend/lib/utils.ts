import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges class names, resolving Tailwind CSS class conflicts.
 *
 * Accepts any number of class values, conditionally concatenates them, and merges Tailwind CSS classes to ensure the final string has no conflicting or duplicate classes.
 *
 * @param inputs - Class values to combine and merge.
 * @returns A single string of merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
