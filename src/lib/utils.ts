import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name?: string | null): string => {
  if (!name) return 'U'; // Default to 'U' if name is null or undefined
  
  const trimmedName = name.trim();
  if (trimmedName.length === 0) return 'U'; // Default to 'U' if name is empty or only whitespace

  const names = trimmedName.split(' ').filter(n => n.length > 0); // Split by space and remove empty parts

  if (names.length === 0) return 'U'; // Should ideally be caught by trimmedName.length check, but as a safeguard

  if (names.length === 1) {
    // Single name part
    if (names[0].length === 1) return names[0].toUpperCase(); // e.g., "A" -> "A"
    return names[0].substring(0, 2).toUpperCase(); // e.g., "Alice" -> "AL"
  }
  
  // Multiple name parts, e.g., "Bob Smith" -> "BS"
  return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
};
