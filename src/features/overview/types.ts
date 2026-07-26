// src/features/overview/types.ts
import type { TimeWindow, TeamSlug } from "@/lib/zod-schemas";

export type { TimeWindow, TeamSlug };

export interface OrgKPIResult {
  activeContributors: number;
  totalCommits: number;
  prsOpened: number;
  prsMerged: number;
  issuesOpened: number;
  issuesClosed: number;
  // Deltas vs previous equivalent window
  commitsDelta: number;
}

export interface VelocityDataPoint {
  date: string; // ISO date string "YYYY-MM-DD"
  commits: number;
  pullRequests: number;
  reviews: number;
}

export interface TeamDistributionSlice {
  teamSlug: string;
  displayName: string;
  color: string;
  count: number;
  percentage: number;
}

export interface OrgOverviewPayload {
  kpis: OrgKPIResult;
  velocityTrend: VelocityDataPoint[];
  teamDistribution: TeamDistributionSlice[];
}

export interface IssueDataPoint {
  date: string;
  opened: number;
  closed: number;
}

export interface IssueAnalytics {
  totalOpened: number;
  totalClosed: number;
  openCurrently: number;
  trend: IssueDataPoint[];
}
