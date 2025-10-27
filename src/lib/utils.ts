import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;

const extractIsoDateParts = (dateString?: string | null) => {
  if (!dateString) return null;
  const match = ISO_DATE_REGEX.exec(dateString);
  if (!match) return null;

  const [, year, month, day] = match;
  return { year, month, day };
};

/**
 * Normaliza uma data ISO ("YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm:ssZ")
 * mantendo apenas a porção de data.
 */
export const normalizeIsoDate = (dateString?: string | null): string => {
  const parts = extractIsoDateParts(dateString);
  if (!parts) return "";
  return `${parts.year}-${parts.month}-${parts.day}`;
};

/**
 * Cria um objeto Date sem deslocamentos de fuso horário a partir de uma string ISO.
 */
export const parseIsoDate = (dateString?: string | null): Date | null => {
  const parts = extractIsoDateParts(dateString);
  if (!parts) return null;
  return new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
};

/**
 * Formata uma data no formato YYYY-MM-DD para DD/MM/YYYY
 * sem problemas de fuso horário.
 */
export function formatDateBR(dateString?: string | null): string {
  const parts = extractIsoDateParts(dateString);
  if (!parts) return dateString ?? "";
  return `${parts.day}/${parts.month}/${parts.year}`;
}
