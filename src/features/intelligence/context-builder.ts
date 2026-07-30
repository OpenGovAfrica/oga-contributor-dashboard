// src/features/intelligence/context-builder.ts
import prisma from "@/lib/prisma";
import { windowToStartDate, type TimeWindow } from "@/lib/zod-schemas";
import { computeRepoStatus } from "@/features/repositories/transforms";

export interface OrgIntelligenceContext {
  generatedAt: string;
  window: string;
  kpis: {
    activeContributors: number;
    totalCommits: number;
    prsOpened: number;
    prsMerged: number;
    issuesOpened: number;
    issuesClosed: number;
    openBacklog: number;
    mergeRate: number;
    resolutionRate: number;
  };
  repositories: Array<{
    name: string;
    team: string | null;
    commits30d: number;
    commits7d: number;
    status: string;
    lastActivityAt: string | null;
    openIssues: number;
    agingIssuesCount: number;
  }>;
  topContributors: Array<{
    login: string;
    name: string | null;
    commits: number;
    prs: number;
    reviews: number;
    total: number;
    lastActiveAt: string;
    teams: string[];
    trend: 'active' | 'dropping' | 'new';
  }>;
  teams: Array<{
    slug: string;
    name: string;
    contributions: number;
    contributors: number;
  }>;
  recentPRs: Array<{
    title: string;
    author: string;
    state: string;
    repo: string;
    createdAt: string;
  }>;
  agingIssues: Array<{
    title: string;
    repo: string;
    openDays: number;
  }>;
  signals: {
    stalledRepos: string[];
    droppingContributors: string[];
    lowMergeRate: boolean;
    highBacklog: boolean;
    risingIssueBacklog: boolean;
  };
}

async function getOrgId(): Promise<string | undefined> {
  const org = await prisma.organization.findFirst();
  return org?.id;
}

export async function buildOrgContext(window: TimeWindow = "30d"): Promise<OrgIntelligenceContext> {
  const orgId = await getOrgId();
  const since = windowToStartDate(window);
  const since7d = windowToStartDate("7d");

  const [contributors, repos, teams, recentPRsRaw, openBacklog, issuesClosed, prsOpenedCount, prsMergedCount, issuesOpenedCount] = await Promise.all([
    prisma.contributor.findMany({
      where: { organizationId: orgId },
      include: {
        contributions: {
          where: { committedAt: { gte: since } },
          select: { type: true, committedAt: true },
        },
        teamMemberships: {
          include: { team: { select: { slug: true, displayName: true } } },
        },
      },
    }),
    prisma.repository.findMany({
      where: { organizationId: orgId },
      include: {
        team: { select: { slug: true, displayName: true } },
        contributions: {
          select: { committedAt: true, type: true },
          orderBy: { committedAt: "desc" },
        },
        issues: {
          where: { state: "OPEN" },
          select: { id: true, openedAt: true, title: true },
        },
      },
    }),
    prisma.team.findMany({
      where: { organizationId: orgId },
      include: {
        repositories: {
          include: {
            contributions: {
              where: { committedAt: { gte: since } },
              select: { id: true, contributorId: true },
            },
          },
        },
      },
    }),
    prisma.contribution.findMany({
      where: {
        repository: { organizationId: orgId },
        type: "PULL_REQUEST",
        committedAt: { gte: since },
      },
      include: {
        contributor: { select: { githubLogin: true } },
        repository: { select: { name: true } },
      },
      orderBy: { committedAt: "desc" },
      take: 15,
    }),
    prisma.issue.count({ where: { repository: { organizationId: orgId }, state: "OPEN" } }),
    prisma.issue.count({ where: { repository: { organizationId: orgId }, closedAt: { gte: since } } }),
    prisma.contribution.count({ where: { repository: { organizationId: orgId }, type: "PULL_REQUEST", committedAt: { gte: since } } }),
    prisma.contribution.count({ where: { repository: { organizationId: orgId }, type: "PULL_REQUEST", mergedAt: { gte: since } } }),
    prisma.issue.count({ where: { repository: { organizationId: orgId }, openedAt: { gte: since } } }),
  ]);

  // kpis
  const allContributions = contributors.flatMap((c) => c.contributions);
  const totalCommits = allContributions.filter((c) => c.type === "COMMIT").length;
  const activeContributors = contributors.filter((c) => c.contributions.length > 0).length;
  const mergeRate = prsOpenedCount > 0 ? Math.round((prsMergedCount / prsOpenedCount) * 100) : 0;
  const resolutionRate = issuesOpenedCount > 0 ? Math.round((issuesClosed / issuesOpenedCount) * 100) : 0;

  // repos — sorted by 30d activity descending
  const repoData = repos
    .map((repo) => {
      const commitsAll = repo.contributions.filter((c) => c.type === "COMMIT");
      const commits30d = commitsAll.filter((c) => c.committedAt >= since).length;
      const commits7d = commitsAll.filter((c) => c.committedAt >= since7d).length;
      const latestActivity = repo.contributions[0]?.committedAt ?? null;
      const status = computeRepoStatus(latestActivity);
      const agingIssuesCount = repo.issues.filter((i) => {
        const days = Math.floor((Date.now() - new Date(i.openedAt).getTime()) / 86400000);
        return days > 14;
      }).length;
      return {
        name: repo.name,
        team: repo.team?.displayName ?? null,
        commits30d,
        commits7d,
        status,
        lastActivityAt: latestActivity?.toISOString().split("T")[0] ?? null,
        openIssues: repo.issues.length,
        agingIssuesCount,
      };
    })
    .sort((a, b) => b.commits30d - a.commits30d);

  // contributors — drop anyone with zero activity in the window, cap at 20
  const topContributors = contributors
    .filter((c) => c.contributions.length > 0)
    .map((c) => {
      const recentActivity = c.contributions.filter((x) => x.committedAt >= since7d).length;
      const olderActivity = c.contributions.filter((x) => x.committedAt < since7d).length;
      let trend: "active" | "dropping" | "new" = "active";
      if (olderActivity > 3 && recentActivity === 0) trend = "dropping";
      if (olderActivity === 0 && recentActivity > 0) trend = "new";
      return {
        login: c.githubLogin,
        name: c.name ?? null,
        commits: c.contributions.filter((x) => x.type === "COMMIT").length,
        prs: c.contributions.filter((x) => x.type === "PULL_REQUEST").length,
        reviews: c.contributions.filter((x) => x.type === "REVIEW").length,
        total: c.contributions.length,
        lastActiveAt: c.lastActiveAt.toISOString().split("T")[0],
        teams: c.teamMemberships.map((m) => m.team.displayName),
        trend,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  // team rollups
  const teamData = teams
    .map((t) => {
      const allTeamContribs = t.repositories.flatMap((r) => r.contributions);
      const uniqueContributors = new Set(allTeamContribs.map((c) => c.contributorId)).size;
      return {
        slug: t.slug,
        name: t.displayName,
        contributions: allTeamContribs.length,
        contributors: uniqueContributors,
      };
    })
    .sort((a, b) => b.contributions - a.contributions);

  // issues open >7d, oldest first
  const agingIssues = repos
    .flatMap((repo) =>
      repo.issues
        .filter((i) => {
          const days = Math.floor((Date.now() - new Date(i.openedAt).getTime()) / 86400000);
          return days > 7;
        })
        .map((i) => ({
          title: i.title ?? "Untitled",
          repo: repo.name,
          openDays: Math.floor((Date.now() - new Date(i.openedAt).getTime()) / 86400000),
        }))
    )
    .sort((a, b) => b.openDays - a.openDays)
    .slice(0, 15);

  // signal detection
  const stalledRepos = repoData
    .filter((r) => r.commits30d > 5 && r.commits7d === 0)
    .map((r) => r.name);

  const droppingContributors = topContributors
    .filter((c) => c.trend === "dropping")
    .map((c) => `@${c.login}`);

  return {
    generatedAt: new Date().toISOString(),
    window,
    kpis: {
      activeContributors,
      totalCommits,
      prsOpened: prsOpenedCount,
      prsMerged: prsMergedCount,
      issuesOpened: issuesOpenedCount,
      issuesClosed,
      openBacklog,
      mergeRate,
      resolutionRate,
    },
    repositories: repoData,
    topContributors,
    teams: teamData,
    recentPRs: recentPRsRaw.map((pr) => ({
      title: pr.title ?? "Untitled",
      author: pr.contributor.githubLogin,
      state: pr.mergedAt ? "MERGED" : "OPEN",
      repo: pr.repository.name,
      createdAt: pr.committedAt.toISOString().split("T")[0],
    })),
    agingIssues,
    signals: {
      stalledRepos,
      droppingContributors,
      lowMergeRate: mergeRate < 50 && prsOpenedCount > 3,
      highBacklog: openBacklog > 30,
      risingIssueBacklog: openBacklog > issuesClosed * 2,
    },
  };
}

export function formatContextForAI(ctx: OrgIntelligenceContext): string {
  const { kpis, repositories, topContributors, teams, recentPRs, agingIssues, signals } = ctx;
  
  const activeRepos = repositories.filter((r) => r.status === "Active");
  const slowingRepos = repositories.filter((r) => r.status === "Slowing");
  const stalledRepos = repositories.filter((r) => r.status === "Stalled");

  return `
=== OPENGOV AFRICA — LIVE ORG SNAPSHOT ===
Generated: ${new Date(ctx.generatedAt).toUTCString()}
Analysis Window: Last ${ctx.window.replace("d", " days")}

━━━ CORE METRICS ━━━
Active Contributors: ${kpis.activeContributors}
Total Commits: ${kpis.totalCommits}
Pull Requests Opened: ${kpis.prsOpened} | Merged: ${kpis.prsMerged} (${kpis.mergeRate}% merge rate)
Issues Opened: ${kpis.issuesOpened} | Closed: ${kpis.issuesClosed} (${kpis.resolutionRate}% resolution rate)
Current Open Backlog: ${kpis.openBacklog} issues

━━━ REPOSITORY HEALTH ━━━
Active (${activeRepos.length}): ${activeRepos.map((r) => r.name).join(", ") || "None"}
Slowing (${slowingRepos.length}): ${slowingRepos.map((r) => r.name).join(", ") || "None"}
Stalled (${stalledRepos.length}): ${stalledRepos.map((r) => r.name).join(", ") || "None"}

Top Active Repositories (by commits):
${repositories
  .slice(0, 15)
  .map(
    (r) =>
      `  • ${r.name} | Team: ${r.team ?? "Unassigned"} | Commits(30d): ${r.commits30d} | Commits(7d): ${r.commits7d} | Status: ${r.status} | Open Issues: ${r.openIssues}${r.agingIssuesCount > 0 ? ` (${r.agingIssuesCount} aging >14d)` : ""} | Last Active: ${r.lastActivityAt ?? "never"}`
  )
  .join("\n")}

━━━ TOP CONTRIBUTORS ━━━
${topContributors
  .slice(0, 15)
  .map(
    (c, i) =>
      `  ${i + 1}. @${c.login}${c.name ? ` (${c.name})` : ""} | Commits: ${c.commits} | PRs: ${c.prs} | Reviews: ${c.reviews} | Total Actions: ${c.total} | Teams: ${c.teams.join(", ") || "None"} | Last Active: ${c.lastActiveAt} | Trend: ${c.trend.toUpperCase()}`
  )
  .join("\n")}

━━━ TEAM BREAKDOWN ━━━
${teams.map((t) => `  • ${t.name} (${t.slug}) | Contributions: ${t.contributions} | Unique Contributors: ${t.contributors}`).join("\n")}

━━━ RECENT PULL REQUESTS (last 15) ━━━
${recentPRs.map((pr) => `  • [${pr.state}] "${pr.title}" by @${pr.author} in ${pr.repo} on ${pr.createdAt}`).join("\n")}

━━━ AGING OPEN ISSUES (open longest first) ━━━
${agingIssues.length > 0 ? agingIssues.map((i) => `  • "${i.title}" in ${i.repo} — open for ${i.openDays} days`).join("\n") : "  No significantly aging issues detected."}

━━━ ANOMALY SIGNALS ━━━
Repos stalling (active 30d ago, dead last 7d): ${signals.stalledRepos.length > 0 ? signals.stalledRepos.join(", ") : "None detected"}
Contributors dropping off (was active, now quiet): ${signals.droppingContributors.length > 0 ? signals.droppingContributors.join(", ") : "None detected"}
Low PR Merge Rate: ${signals.lowMergeRate ? `⚠️ YES — ${kpis.mergeRate}% (below 50%)` : "No"}
High Issue Backlog: ${signals.highBacklog ? `⚠️ YES — ${kpis.openBacklog} open issues` : "No"}
Rising Backlog (issues piling up): ${signals.risingIssueBacklog ? "⚠️ YES — issues closing slower than they open" : "No"}
=== END SNAPSHOT ===
`.trim();
}
