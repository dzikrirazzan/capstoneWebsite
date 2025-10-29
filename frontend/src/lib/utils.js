import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatNumber(num, decimals = 1) {
  const normalized = typeof num === "number" ? num : Number(num ?? 0);
  return normalized.toFixed(decimals);
}
