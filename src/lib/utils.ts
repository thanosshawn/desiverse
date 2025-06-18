import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name?: string | null): string => {
  if (!name) return 'U'; // Default to 'U' for User if no name
  const names = name.trim().split(' ');
  if (names.length === 1 && names[0].length === 1) return names[0].toUpperCase(); // Single letter name
  if (names.length === 1 && names[0].length > 1) return names[0].substring(0, 2).toUpperCase(); // Two letters from single name
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase(); // First letter of first and last name
  }
  return name.substring(0, 2).toUpperCase(); // Fallback for other cases
};
