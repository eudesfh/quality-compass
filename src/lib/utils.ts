import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string (YYYY-MM-DD) or ISO string to pt-BR (dd/mm/yyyy)
 * without timezone shift. Use for date-only fields stored as DATE in Postgres.
 */
export function formatDateBR(value?: string | null): string {
  if (!value) return '';
  // Handle date-only "YYYY-MM-DD" — parse as local to avoid UTC shift
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (dateOnly) {
    const [y, m, d] = value.split('-').map(Number);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }
  // Full timestamp — use Date as usual
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}
