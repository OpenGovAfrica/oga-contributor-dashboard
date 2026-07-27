// src/features/overview/queries.ts
import prisma from "@/lib/prisma";
import { windowToStartDate, type TimeWindow, type TeamSlug } from "@/lib/zod-schemas";
import type {
  OrgKPIResult,
  VelocityDataPoint,
  TeamDistributionSlice,
  IssueDataPoint,
  IssueAnalytics,
} from "./types";

export interface RecentPR {
  id: string;
  title: string;
  githubUrl: string;
  state: "OPEN" | "MERGED" | "CLOSED";
  authorLogin: string;
  authorAvatar: string | null;
  createdAt: string;
}

// hardcoded org for v1 - will move to jwt session claims in v2

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

export async function getOrgKPIs(
  window: TimeWindow,
): Promise<OrgKPIResult> {
  const orgId = await getOrgId();
  const since = windowToStartDate(window);

  // calculate previous period to get delta comparisons
  const prevStart = new Date(since);
  prevStart.setDate(prevStart.getDate() - (new Date().getDate() - since.getDate()));

  const [
    activeContributors,
    totalCommits,
    prevCommits,
    prsOpened,
    prsMerged,
    issuesOpened,
    issuesClosed,
  ] = await Promise.all([
    prisma.contributor.count({
      where: {
        organizationId: orgId,
        OR: [
          { contributions: { some: { committedAt: { gte: since } } } },
          { issuesOpened: { some: { openedAt: { gte: since } } } },
          { issuesClosed: { some: { closedAt: { gte: since } } } }
        ]
      }
    }),
    prisma.contribution.count({
      where: { repository: { organizationId: orgId }, type: "COMMIT", committedAt: { gte: since } }
    }),
    prisma.contribution.count({
      where: { repository: { organizationId: orgId }, type: "COMMIT", committedAt: { gte: prevStart, lt: since } }
    }),
    prisma.contribution.count({
      where: { repository: { organizationId: orgId }, type: "PULL_REQUEST", committedAt: { gte: since } }
    }),
    prisma.contribution.count({
      where: { repository: { organizationId: orgId }, type: "PULL_REQUEST", mergedAt: { gte: since } }
    }),
    prisma.issue.count({
      where: { repository: { organizationId: orgId }, openedAt: { gte: since } }
    }),
    prisma.issue.count({
      where: { repository: { organizationId: orgId }, closedAt: { gte: since } }
    }),
  ]);

  return {
    activeContributors,
    totalCommits,
    prsOpened,
    prsMerged,
    issuesOpened,
    issuesClosed,
    commitsDelta: prevCommits > 0
      ? Math.round(((totalCommits - prevCommits) / prevCommits) * 100)
      : 0,
  };
}

export async function getRecentPullRequests(window: TimeWindow, limit: number = 5): Promise<RecentPR[]> {
  const orgId = await getOrgId();
  const since = windowToStartDate(window);

  const prs = await prisma.contribution.findMany({
    where: {
      repository: { organizationId: orgId },
      type: "PULL_REQUEST",
      committedAt: { gte: since }
    },
    include: {
      contributor: { select: { githubLogin: true, avatarUrl: true } }
    },
    orderBy: { committedAt: "desc" },
    take: limit,
  });

  return prs.map(pr => ({
    id: pr.id,
    title: pr.title || "Untitled PR",
    githubUrl: pr.githubUrl || "#",
    state: pr.mergedAt ? "MERGED" : "OPEN",
    authorLogin: pr.contributor.githubLogin,
    authorAvatar: pr.contributor.avatarUrl,
    createdAt: pr.committedAt.toISOString(),
  }));
}

export async function getVelocityTrend(
  window: TimeWindow,
  teamSlug?: TeamSlug | "all",
): Promise<VelocityDataPoint[]> {
  const orgId = await getOrgId();
  const since = windowToStartDate(window);

  const teamFilter =
    teamSlug && teamSlug !== "all" ? { team: { slug: teamSlug } } : {};

  const contributions = await prisma.contribution.findMany({
    where: {
      repository: { organizationId: orgId, ...teamFilter },
      committedAt: { gte: since },
    },
    select: { committedAt: true, type: true },
    orderBy: { committedAt: "asc" },
  });

  // group raw contributions by day for the chart
  const byDate = new Map<string, VelocityDataPoint>();
  for (const c of contributions) {
    const key = c.committedAt.toISOString().slice(0, 10);
    const existing = byDate.get(key) ?? { date: key, commits: 0, pullRequests: 0, reviews: 0 };
    if (c.type === "COMMIT") existing.commits++;
    else if (c.type === "PULL_REQUEST") existing.pullRequests++;
    else if (c.type === "REVIEW") existing.reviews++;
    byDate.set(key, existing);
  }

  return Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export async function getTeamDistribution(
  window: TimeWindow,
): Promise<TeamDistributionSlice[]> {
  const orgId = await getOrgId();
  const since = windowToStartDate(window);

  const teams = await prisma.team.findMany({
    where: { organizationId: orgId },
    select: {
      slug: true,
      displayName: true,
      color: true,
      repositories: {
        select: {
          contributions: {
            where: { committedAt: { gte: since } },
            select: { id: true },
          },
        },
      },
    },
  });

  const slices = teams.map((t) => {
    const count = t.repositories.reduce(
      (sum, r) => sum + r.contributions.length,
      0,
    );
    return { teamSlug: t.slug, displayName: t.displayName, color: t.color ?? "#6366f1", count };
  });

  const total = slices.reduce((s, t) => s + t.count, 0);
  return slices.map((s) => ({
    ...s,
    percentage: total > 0 ? Math.round((s.count / total) * 100) : 0,
  }));
}

export async function getIssueAnalytics(
  window: TimeWindow,
  teamSlug?: TeamSlug | "all",
): Promise<IssueAnalytics> {
  const orgId = await getOrgId();
  const since = windowToStartDate(window);

  const teamFilter =
    teamSlug && teamSlug !== "all" ? { team: { slug: teamSlug } } : {};

  // get all issues active within this window
  const issues = await prisma.issue.findMany({
    where: {
      repository: { organizationId: orgId, ...teamFilter },
      OR: [
        { openedAt: { gte: since } },
        { closedAt: { gte: since } },
      ],
    },
    select: { openedAt: true, closedAt: true },
  });

  const byDate = new Map<string, IssueDataPoint>();
  let totalOpened = 0;
  let totalClosed = 0;

  for (const issue of issues) {
    // handle newly opened issues
    if (issue.openedAt >= since) {
      totalOpened++;
      const key = issue.openedAt.toISOString().slice(0, 10);
      const existing = byDate.get(key) ?? { date: key, opened: 0, closed: 0 };
      existing.opened++;
      byDate.set(key, existing);
    }
    // handle newly closed issues
    if (issue.closedAt && issue.closedAt >= since) {
      totalClosed++;
      const key = issue.closedAt.toISOString().slice(0, 10);
      const existing = byDate.get(key) ?? { date: key, opened: 0, closed: 0 };
      existing.closed++;
      byDate.set(key, existing);
    }
  }

  const openCurrently = await prisma.issue.count({
    where: {
      repository: { organizationId: orgId, ...teamFilter },
      state: "OPEN",
    },
  });

  const trend = Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return {
    totalOpened,
    totalClosed,
    openCurrently,
    trend,
  };
}

export async function getHighestStreakContributors() {
  const topContributors = await prisma.contributor.findMany({
    orderBy: { currentStreak: 'desc' },
    where: { currentStreak: { gt: 0 } },
    take: 10,
    select: { id: true, githubLogin: true, avatarUrl: true, currentStreak: true, name: true }
  });

  if (topContributors.length === 0) return null;
  
  const maxStreak = topContributors[0].currentStreak;
  const tiedContributors = topContributors.filter(c => c.currentStreak === maxStreak);
  
  return { maxStreak, tiedContributors };
}
