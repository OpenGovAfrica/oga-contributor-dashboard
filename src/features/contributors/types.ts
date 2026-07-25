// src/features/contributors/types.ts
import type { PaginatedResult } from "@/features/repositories/types";

export type { PaginatedResult };

export interface SparklineDataPoint {
  week: string; // "YYYY-WW"
  count: number;
}

export interface ContributorLeaderboardEntry {
  id: string;
  githubLogin: string;
  name: string | null;
  avatarUrl: string | null;
  company: string | null;
  location: string | null;
  teams: Array<{
    slug: string;
    displayName: string;
    color: string | null;
  }>;
  // Contribution counts in the selected window (Code)
  commitCount: number;
  prCount: number;
  reviewCount: number;
  // Contribution counts in the selected window (Civic)
  issueOpenedCount: number;
  issueCommentCount: number;
  totalCount: number;
  // Longevity
  firstSeenAt: string; // ISO string
  lastActiveAt: string; // ISO string
  longevityDays: number;
  // Mini sparkline — activity per week for last 12 weeks
  sparkline: SparklineDataPoint[];
  currentStreak: number;
}
