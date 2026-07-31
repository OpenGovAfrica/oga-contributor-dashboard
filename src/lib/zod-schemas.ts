// src/lib/zod-schemas.ts
import { z } from "zod";

// team configurations
export const TEAM_SLUGS = [
  "wg-dev",
  "wg-data",
  "wg-marketing",
  "wg-operations",
  "wg-strategy",
  "wg-community",
] as const;

export type TeamSlug = (typeof TEAM_SLUGS)[number];
export type TeamSlugOrAll = TeamSlug | "all";

// time window constraints and helpers
export const TIME_WINDOWS = ["7d", "30d", "90d"] as const;
export type TimeWindow = (typeof TIME_WINDOWS)[number];

export function windowToDays(window: TimeWindow): number {
  const map: Record<TimeWindow, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };
  return map[window];
}

export function windowToStartDate(window: TimeWindow): Date {
  const days = windowToDays(window);
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

// base pagination and filter schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const TeamFilterSchema = z.object({
  team: z
    .enum(["all", ...TEAM_SLUGS])
    .default("all"),
});

export const TimeWindowSchema = z.object({
  window: z.enum(TIME_WINDOWS).default("30d"),
});


// repository specific query schemas
export const REPO_SORT_KEYS = [
  "lastActivity",
  "commits30d",
  "stars",
  "openIssues",
  "name",
] as const;
export type RepoSortKey = (typeof REPO_SORT_KEYS)[number];

export const RepoQuerySchema = PaginationSchema.merge(TeamFilterSchema)
  .merge(TimeWindowSchema)
  .extend({
    sortBy: z.enum(REPO_SORT_KEYS).default("lastActivity"),
  });

// contributor specific query schemas
export const CONTRIBUTOR_SORT_KEYS = [
  "volume",
  "frequency",
  "longevity",
] as const;
export type ContributorSortKey = (typeof CONTRIBUTOR_SORT_KEYS)[number];

export const ContributorQuerySchema = PaginationSchema.merge(TeamFilterSchema)
  .merge(TimeWindowSchema)
  .extend({
    sortBy: z.enum(CONTRIBUTOR_SORT_KEYS).default("volume"),
    mode: z.enum(["civic", "code"]).default("civic"),
  });

// high level page schemas
export const OverviewQuerySchema = TeamFilterSchema.merge(TimeWindowSchema);
export const ActivityQuerySchema = TeamFilterSchema.merge(TimeWindowSchema);
