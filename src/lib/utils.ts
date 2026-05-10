import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(cents: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && cents >= 100_000_00) {
    return `R$ ${Math.round(cents / 100_000)}k`;
  }
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function getInitial(name?: string | null): string {
  return (name?.split(" ")[0]?.[0] || "?").toUpperCase();
}
