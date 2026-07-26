// src/features/repositories/types.ts

export type RepoStatus = "Active" | "Slowing" | "Stalled";

export interface RepoHealthRow {
  id: string;
  name: string;
  nameWithOwner: string;
  description: string | null;
  teamSlug: string | null;
  teamDisplayName: string | null;
  teamColor: string | null;
  primaryLanguage: string | null;
  stargazerCount: number;
  forkCount: number;
  openIssuesCount: number;
  totalContributors: number;
  commits30d: number;
  lastActivityAt: string | null; // ISO string
  status: RepoStatus;
  // Mini sparkline — contributions per week for last 8 weeks
  sparkline: number[];
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
