// src/features/repositories/queries.ts
import prisma from "@/lib/prisma";
import { windowToStartDate, type TimeWindow, type RepoSortKey, type TeamSlug } from "@/lib/zod-schemas";
import type { RepoHealthRow, PaginatedResult } from "./types";
import { computeRepoStatus } from "./transforms";

const ORG_GITHUB_LOGIN = "OpenGovAfrica";

async function getOrgId(): Promise<string> {
  const org = await prisma.organization.findFirst();
  if (org) return org.id;
  
  const state = await prisma.systemState.findUnique({ where: { id: 1 } });
  const login = state?.targetOrg || "OpenGovAfrica";
  
  const newOrg = await prisma.organization.create({
    data: { githubLogin: login, name: login },
  });
  return newOrg.id;
}

export async function getRepoHealthMatrix(opts: {
  teamSlug?: TeamSlug | "all";
  page: number;
  limit: number;
  sortBy: RepoSortKey;
  window: TimeWindow;
}): Promise<PaginatedResult<RepoHealthRow>> {
  const orgId = await getOrgId();
  const { page, limit, sortBy, teamSlug, window } = opts;
  const since30d = windowToStartDate("30d");

  const teamFilter =
    teamSlug && teamSlug !== "all" ? { team: { slug: teamSlug } } : {};

  const repos = await prisma.repository.findMany({
    where: { organizationId: orgId, ...teamFilter },
    include: {
      team: { select: { slug: true, displayName: true, color: true } },
      contributions: {
        select: { committedAt: true, type: true },
        orderBy: { committedAt: "desc" },
      },
      issues: {
        select: { id: true, state: true, openedAt: true, closedAt: true, lastCommentAt: true },
      },
    },
  });

  // Build enriched rows
  const rows: RepoHealthRow[] = repos.map((repo) => {
    const commits30d = repo.contributions.filter(
      (c) => c.type === "COMMIT" && c.committedAt >= since30d,
    ).length;

    let latestActivity = repo.contributions[0]?.committedAt?.getTime() ?? 0;
    let openIssuesCount = 0;
    
    for (const issue of repo.issues) {
      if (issue.state === "OPEN") openIssuesCount++;
      latestActivity = Math.max(
        latestActivity,
        issue.openedAt.getTime(),
        issue.closedAt?.getTime() ?? 0,
        issue.lastCommentAt?.getTime() ?? 0
      );
    }
    
    const lastActivityAt = latestActivity > 0 ? new Date(latestActivity) : null;

    // Unique contributors
    const totalContributors = new Set(
      repo.contributions.map(() => "placeholder"), // Phase 2: contributor IDs
    ).size;

    // Sparkline: contributions per week for last 8 weeks
    const sparkline = computeSparkline(repo.contributions, 8);

    return {
      id: repo.id,
      name: repo.name,
      nameWithOwner: repo.nameWithOwner,
      description: repo.description,
      teamSlug: repo.team?.slug ?? null,
      teamDisplayName: repo.team?.displayName ?? null,
      teamColor: repo.team?.color ?? null,
      primaryLanguage: repo.primaryLanguage,
      stargazerCount: repo.stargazerCount,
      forkCount: repo.forkCount,
      openIssuesCount,
      totalContributors,
      commits30d,
      lastActivityAt: lastActivityAt?.toISOString() ?? null,
      status: computeRepoStatus(lastActivityAt),
      sparkline,
    };
  });

  // Sort
  const sorted = sortRows(rows, sortBy);

  // Paginate
  const total = sorted.length;
  const totalPages = Math.ceil(total / limit);
  const paginated = sorted.slice((page - 1) * limit, page * limit);

  return { data: paginated, meta: { total, page, limit, totalPages } };
}

function computeSparkline(
  contributions: Array<{ committedAt: Date }>,
  weeks: number,
): number[] {
  const result = new Array<number>(weeks).fill(0);
  const now = new Date();
  for (const c of contributions) {
    const daysAgo = Math.floor(
      (now.getTime() - c.committedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    const weekIndex = Math.floor(daysAgo / 7);
    if (weekIndex >= 0 && weekIndex < weeks) {
      result[weeks - 1 - weekIndex]++;
    }
  }
  return result;
}

function sortRows(rows: RepoHealthRow[], sortBy: RepoSortKey): RepoHealthRow[] {
  return [...rows].sort((a, b) => {
    switch (sortBy) {
      case "lastActivity":
        return (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? "");
      case "commits30d":
        return b.commits30d - a.commits30d;
      case "stars":
        return b.stargazerCount - a.stargazerCount;
      case "openIssues":
        return b.openIssuesCount - a.openIssuesCount;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
}
