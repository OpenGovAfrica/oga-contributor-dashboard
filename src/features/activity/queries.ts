// src/features/activity/queries.ts
import prisma from "@/lib/prisma";
import { windowToStartDate, type TimeWindow, type TeamSlug } from "@/lib/zod-schemas";
import type { 
  IssueFunnelData, 
  PRIntervalBucket, 
  ActivityFunnelPayload, 
  IssueAgingBucket, 
  LabelDistributionSlice,
  HotCampaign,
} from "./types";

const ORG_GITHUB_LOGIN = "OpenGovAfrica";

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

export async function getIssueFunnelData(
  window: TimeWindow,
  teamSlug?: TeamSlug | "all",
): Promise<IssueFunnelData> {
  const orgId = await getOrgId();
  const since = windowToStartDate(window);
  const teamFilter = teamSlug && teamSlug !== "all" ? { team: { slug: teamSlug } } : {};

  const issues = await prisma.issue.findMany({
    where: {
      repository: { organizationId: orgId, ...teamFilter },
      OR: [
        { openedAt: { gte: since } },
        { closedAt: { gte: since } },
      ],
    },
    select: { openedAt: true, closedAt: true, state: true },
  });

  const opened = issues.filter((i) => i.openedAt >= since).length;
  const closed = issues.filter((i) => i.closedAt && i.closedAt >= since).length;
  const closeRatio = opened > 0 ? closed / opened : 0;

  // Average cycle time for closed issues
  const cycleTimes = issues
    .filter((i) => i.closedAt !== null)
    .map((i) => Math.floor((i.closedAt!.getTime() - i.openedAt.getTime()) / (1000 * 60 * 60 * 24)));
  
  const avgCycleTimeDays = cycleTimes.length > 0
    ? Math.round(cycleTimes.reduce((s, n) => s + n, 0) / cycleTimes.length)
    : 0;

  // Weekly trend & Backlog growth
  const byDate = new Map<string, { opened: number; closed: number }>();
  for (const issue of issues) {
    if (issue.openedAt >= since) {
      const key = issue.openedAt.toISOString().slice(0, 10);
      const existing = byDate.get(key) ?? { opened: 0, closed: 0 };
      existing.opened++;
      byDate.set(key, existing);
    }
    if (issue.closedAt && issue.closedAt >= since) {
      const key = issue.closedAt.toISOString().slice(0, 10);
      const existing = byDate.get(key) ?? { opened: 0, closed: 0 };
      existing.closed++;
      byDate.set(key, existing);
    }
  }

  let runningBacklog = 0;
  const trend = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => {
      runningBacklog += (counts.opened - counts.closed);
      return {
        date,
        opened: counts.opened,
        closed: counts.closed,
        backlogSize: runningBacklog,
      };
    });

  return { opened, closed, closeRatio, avgCycleTimeDays, trend };
}

export async function getPRMergeIntervals(
  window: TimeWindow,
  teamSlug?: TeamSlug | "all",
): Promise<PRIntervalBucket[]> {
  const orgId = await getOrgId();
  const since = windowToStartDate(window);
  const teamFilter = teamSlug && teamSlug !== "all" ? { team: { slug: teamSlug } } : {};

  const prs = await prisma.contribution.findMany({
    where: {
      repository: { organizationId: orgId, ...teamFilter },
      type: "PULL_REQUEST",
      mergedAt: { not: null },
      committedAt: { gte: since },
    },
    select: { committedAt: true, mergedAt: true },
  });

  const buckets = [
    { label: "< 1 day", min: 0, max: 1 },
    { label: "1–3 days", min: 1, max: 3 },
    { label: "3–7 days", min: 3, max: 7 },
    { label: "1–2 weeks", min: 7, max: 14 },
    { label: "> 2 weeks", min: 14, max: Infinity },
  ];

  const counts = new Array(buckets.length).fill(0);
  for (const pr of prs) {
    const days = (pr.mergedAt!.getTime() - pr.committedAt.getTime()) / (1000 * 60 * 60 * 24);
    const idx = buckets.findIndex((b) => days >= b.min && days < b.max);
    if (idx !== -1) counts[idx]++;
  }

  const total = counts.reduce((s, n) => s + n, 0);
  return buckets.map((b, i) => ({
    label: b.label,
    count: counts[i],
    percentage: total > 0 ? Math.round((counts[i] / total) * 100) : 0,
  }));
}

export async function getIssueAging(
  teamSlug?: TeamSlug | "all"
): Promise<IssueAgingBucket[]> {
  const orgId = await getOrgId();
  const teamFilter = teamSlug && teamSlug !== "all" ? { team: { slug: teamSlug } } : {};
  
  const openIssues = await prisma.issue.findMany({
    where: {
      repository: { organizationId: orgId, ...teamFilter },
      state: "OPEN"
    },
    select: { openedAt: true }
  });

  const buckets = [
    { label: "< 7 days", min: 0, max: 7 },
    { label: "7–14 days", min: 7, max: 14 },
    { label: "15–30 days", min: 14, max: 30 },
    { label: "30+ days", min: 30, max: Infinity }
  ];
  const counts = [0, 0, 0, 0];
  const now = new Date();
  
  for (const issue of openIssues) {
    const days = (now.getTime() - issue.openedAt.getTime()) / (1000 * 60 * 60 * 24);
    const idx = buckets.findIndex(b => days >= b.min && days < b.max);
    if (idx !== -1) counts[idx]++;
  }

  return buckets.map((b, i) => ({ label: b.label, count: counts[i] }));
}

export async function getIssueLabelDistribution(
  window: TimeWindow,
  teamSlug?: TeamSlug | "all"
): Promise<LabelDistributionSlice[]> {
  const orgId = await getOrgId();
  const since = windowToStartDate(window);
  const teamFilter = teamSlug && teamSlug !== "all" ? { team: { slug: teamSlug } } : {};

  const issues = await prisma.issue.findMany({
    where: {
      repository: { organizationId: orgId, ...teamFilter },
      OR: [
        { openedAt: { gte: since } },
        { closedAt: { gte: since } }
      ]
    },
    select: { labels: true }
  });

  const labelCounts = new Map<string, number>();
  for (const issue of issues) {
    for (const label of issue.labels) {
      labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
    }
  }

  const colors: Record<string, string> = {
    bug: "#ef4444",
    enhancement: "#3b82f6",
    documentation: "#8b5cf6",
    help_wanted: "#f59e0b",
    good_first_issue: "#10b981",
    design: "#ec4899",
    question: "#64748b"
  };

  const getHashColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;
  };

  return Array.from(labelCounts.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by count desc
    .slice(0, 6) // Top 6 labels
    .map(([name, count]) => ({
      name,
      count,
      color: colors[name.toLowerCase().replace(/ /g, "_")] || getHashColor(name)
    }));
}

export async function getHotCampaigns(
  window: TimeWindow,
  teamSlug?: TeamSlug | "all"
): Promise<HotCampaign[]> {
  const orgId = await getOrgId();
  const since = windowToStartDate(window);
  const teamFilter = teamSlug && teamSlug !== "all" ? { team: { slug: teamSlug } } : {};

  const issues = await prisma.issue.findMany({
    where: {
      repository: { organizationId: orgId, ...teamFilter },
      OR: [
        { lastCommentAt: { gte: since } },
        { openedAt: { gte: since } }
      ]
    },
    include: { repository: { select: { name: true } } },
    orderBy: [
      { commentCount: 'desc' },
      { lastCommentAt: 'desc' }
    ],
    take: 5
  });

  return issues.map(i => ({
    id: i.id,
    title: i.title,
    githubUrl: i.githubUrl,
    repositoryName: i.repository.name,
    commentCount: i.commentCount,
    lastCommentAt: i.lastCommentAt?.toISOString() || null,
    openedAt: i.openedAt.toISOString(),
    state: i.state
  }));
}

export async function getActivityFunnelPayload(
  window: TimeWindow,
  teamSlug?: TeamSlug | "all",
): Promise<ActivityFunnelPayload & { hotCampaigns: HotCampaign[] }> {
  const [funnel, prIntervals, issueAging, labelDistribution, hotCampaigns] = await Promise.all([
    getIssueFunnelData(window, teamSlug),
    getPRMergeIntervals(window, teamSlug),
    getIssueAging(teamSlug), // Aging doesn't depend on window, it's snapshot
    getIssueLabelDistribution(window, teamSlug),
    getHotCampaigns(window, teamSlug)
  ]);
  return { funnel, prIntervals, issueAging, labelDistribution, hotCampaigns };
}
