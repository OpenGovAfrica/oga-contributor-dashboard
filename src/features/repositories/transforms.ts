// src/features/repositories/transforms.ts
import type { RepoStatus } from "./types";

/**
 * Classify a repository's health based on days since last commit.
 * Active  → last commit within 30 days
 * Slowing → last commit 31–90 days ago
 * Stalled → last commit older than 90 days or never
 */
export function computeRepoStatus(lastActivityAt: Date | null): RepoStatus {
  if (!lastActivityAt) return "Stalled";
  const daysSince = Math.floor(
    (Date.now() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysSince <= 30) return "Active";
  if (daysSince <= 90) return "Slowing";
  return "Stalled";
}
