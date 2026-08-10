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

/** Matriz de prazos por nível de risco (dias corridos). */
export function riskDeadlineDays(level: number): number {
  if (!level || level < 1) return 90;
  if (level >= 6) return 30;   // Alto risco
  if (level >= 3) return 60;   // Médio risco
  return 90;                   // Baixo risco
}

/** Soma dias corridos a uma data (YYYY-MM-DD ou ISO) e retorna YYYY-MM-DD. */
export function addDaysISO(base: string | Date, days: number): string {
  const d = typeof base === 'string'
    ? (/^\d{4}-\d{2}-\d{2}$/.test(base)
        ? new Date(Number(base.slice(0, 4)), Number(base.slice(5, 7)) - 1, Number(base.slice(8, 10)))
        : new Date(base))
    : new Date(base);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Calcula o prazo do risco a partir da data de abertura e do nível. */
export function computeRiskDeadline(openedAt: string | Date, level: number): string {
  return addDaysISO(openedAt, riskDeadlineDays(level));
}
