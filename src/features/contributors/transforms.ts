// src/features/contributors/transforms.ts
import { formatRelativeDate } from "@/lib/utils";

export function formatLastActive(isoDate: string): string {
  return formatRelativeDate(isoDate);
}

export function formatLongevity(days: number): string {
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}mo`;
}

export function getImpactTier(
  rank: number,
): "gold" | "silver" | "bronze" | "default" {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "default";
}
