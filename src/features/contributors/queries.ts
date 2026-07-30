// src/features/contributors/queries.ts
import prisma from "@/lib/prisma";
import { type ContributionType } from "@prisma/client";
import {
  windowToStartDate,
  type TimeWindow,
  type ContributorSortKey,
  type TeamSlug,
} from "@/lib/zod-schemas";
import type {
  ContributorLeaderboardEntry,
  PaginatedResult,
  SparklineDataPoint,
} from "./types";
import { daysBetween } from "@/lib/utils";



async function getOrgId(): Promise<string> {
  const org = await prisma.organization.findFirst();
  if (org) return org.id;
  
  const state = await prisma.systemState.findUnique({ where: { id: 1 } });
  const login = state?.targetOrg || "OpenGovAfrica";
  
  const newOrg = await prisma.organization.upsert({
    where: { githubLogin: login },
    update: {},
    create: { githubLogin: login, name: login },
  });
  return newOrg.id;
}

export async function getContributorLeaderboard(opts: {
  teamSlug?: TeamSlug | "all";
  sortBy: ContributorSortKey;
  page: number;
  limit: number;
  window: TimeWindow;
  mode: "civic" | "code";
}): Promise<PaginatedResult<ContributorLeaderboardEntry>> {
  const orgId = await getOrgId();
  const { page, limit, sortBy, teamSlug, window, mode } = opts;
  const since = windowToStartDate(window);

  const teamMemberFilter =
    teamSlug && teamSlug !== "all"
      ? { teamMemberships: { some: { team: { slug: teamSlug } } } }
      : {};

  const modeFilter = mode === "civic" 
    ? { in: ["ISSUE_OPENED", "ISSUE_COMMENT", "PULL_REQUEST"] as ContributionType[] }
    : { in: ["COMMIT", "PULL_REQUEST", "REVIEW"] as ContributionType[] };

  const contributors = await prisma.contributor.findMany({
    where: { organizationId: orgId, ...teamMemberFilter },
    include: {
      teamMemberships: {
        include: {
          team: { select: { slug: true, displayName: true, color: true } },
        },
      },
      contributions: {
        where: { committedAt: { gte: since }, type: modeFilter },
        select: { committedAt: true, type: true },
      },
    },
  });

  const entries: ContributorLeaderboardEntry[] = contributors
    .filter((c) => c.contributions.length > 0)
    .map((c) => {
      const commitCount = c.contributions.filter((x) => x.type === "COMMIT").length;
      const prCount = c.contributions.filter((x) => x.type === "PULL_REQUEST").length;
      const reviewCount = c.contributions.filter((x) => x.type === "REVIEW").length;
      
      const issueOpenedCount = c.contributions.filter((x) => x.type === "ISSUE_OPENED").length;
      const issueCommentCount = c.contributions.filter((x) => x.type === "ISSUE_COMMENT").length;

      const totalCount = c.contributions.length;

      const longevityDays = daysBetween(c.firstSeenAt, new Date());

      const sparkline = buildSparkline(c.contributions, 12);

      return {
        id: c.id,
        githubLogin: c.githubLogin,
        name: c.name,
        avatarUrl: c.avatarUrl,
        company: c.company,
        location: c.location,
        teams: c.teamMemberships.map((m) => ({
          slug: m.team.slug,
          displayName: m.team.displayName,
          color: m.team.color,
        })),
        commitCount,
        prCount,
        reviewCount,
        issueOpenedCount,
        issueCommentCount,
        totalCount,
        firstSeenAt: c.firstSeenAt.toISOString(),
        lastActiveAt: c.lastActiveAt.toISOString(),
        longevityDays,
        sparkline,
        currentStreak: c.currentStreak,
      };
    });

  const sorted = sortEntries(entries, sortBy);
  const total = sorted.length;
  const totalPages = Math.ceil(total / limit);
  const paginated = sorted.slice((page - 1) * limit, page * limit);

  return { data: paginated, meta: { total, page, limit, totalPages } };
}

function buildSparkline(
  contributions: Array<{ committedAt: Date }>,
  weeks: number,
): SparklineDataPoint[] {
  const result: SparklineDataPoint[] = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);

    const count = contributions.filter(
      (c) => c.committedAt >= weekStart && c.committedAt < weekEnd,
    ).length;

    const isoWeek = weekStart.toISOString().slice(0, 10);
    result.push({ week: isoWeek, count });
  }
  return result;
}

function sortEntries(
  entries: ContributorLeaderboardEntry[],
  sortBy: ContributorSortKey,
): ContributorLeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    switch (sortBy) {
      case "volume":
        return b.totalCount - a.totalCount;
      case "frequency": {
        const freqA = a.totalCount / Math.max(1, a.longevityDays / 7);
        const freqB = b.totalCount / Math.max(1, b.longevityDays / 7);
        return freqB - freqA;
      }
      case "longevity":
        return b.longevityDays - a.longevityDays;
      default:
        return 0;
    }
  });
}

export async function getContributorSparkline(
  contributorId: string,
  window: TimeWindow,
): Promise<SparklineDataPoint[]> {
  const since = windowToStartDate(window);
  const contributions = await prisma.contribution.findMany({
    where: { contributorId, committedAt: { gte: since } },
    select: { committedAt: true },
  });
  const weeks = Math.ceil(
    (Date.now() - since.getTime()) / (1000 * 60 * 60 * 24 * 7),
  );
  return buildSparkline(contributions, weeks);
}
