// src/features/teams/queries.ts
import prisma from "@/lib/prisma";
import { windowToStartDate, type TimeWindow, type TeamSlug } from "@/lib/zod-schemas";

export async function getTeams() {
  return prisma.team.findMany({
    orderBy: { displayName: "asc" },
  });
}

export async function getTeamKPIs(teamSlug: string, window: TimeWindow) {
  const since = windowToStartDate(window);

  const team = await prisma.team.findUnique({
    where: { slug: teamSlug },
    include: {
      repositories: {
        include: {
          contributions: {
            where: { committedAt: { gte: since } },
          },
        },
      },
    },
  });

  if (!team) return { totalContributors: 0, activeRepositories: 0, commits: 0 };

  const allContributions = team.repositories.flatMap((r) => r.contributions);
  
  const activeRepositories = team.repositories.filter((r) => r.contributions.length > 0).length;
  
  const commits = allContributions.filter((c) => c.type === "COMMIT").length;
  
  const uniqueContributors = new Set(allContributions.map((c) => c.contributorId)).size;

  return {
    totalContributors: uniqueContributors,
    activeRepositories,
    commits,
  };
}

export async function getTeamActivityTrend(teamSlug: string, window: TimeWindow) {
  const since = windowToStartDate(window);

  const contributions = await prisma.contribution.findMany({
    where: {
      repository: { team: { slug: teamSlug } },
      committedAt: { gte: since },
      type: "COMMIT",
    },
    orderBy: { committedAt: "asc" },
  });

  // Group by day
  const daily = new Map<string, number>();
  
  // Initialize all days in window with 0
  const now = new Date();
  for (let d = new Date(since); d <= now; d.setDate(d.getDate() + 1)) {
    daily.set(d.toISOString().slice(0, 10), 0);
  }

  for (const c of contributions) {
    const day = c.committedAt.toISOString().slice(0, 10);
    if (daily.has(day)) {
      daily.set(day, daily.get(day)! + 1);
    }
  }

  return Array.from(daily.entries()).map(([date, value]) => ({ date, value }));
}

export async function getTeamTopContributors(teamSlug: string, window: TimeWindow) {
  const since = windowToStartDate(window);

  const contributors = await prisma.contributor.findMany({
    where: {
      contributions: {
        some: {
          repository: { team: { slug: teamSlug } },
          committedAt: { gte: since },
        },
      },
    },
    include: {
      contributions: {
        where: {
          repository: { team: { slug: teamSlug } },
          committedAt: { gte: since },
        },
      },
    },
  });

  const ranked = contributors.map((c) => {
    return {
      id: c.id,
      githubLogin: c.githubLogin,
      name: c.name,
      avatarUrl: c.avatarUrl,
      commits: c.contributions.filter((x) => x.type === "COMMIT").length,
      totalCount: c.contributions.length,
    };
  });

  ranked.sort((a, b) => b.totalCount - a.totalCount);
  return ranked.slice(0, 10); // Top 10
}

export async function getTeamSynergy(teamSlug: string, window: TimeWindow) {
  const since = windowToStartDate(window);

  // 1. Get all contributors in this team
  const teamMembers = await prisma.teamMember.findMany({
    where: { team: { slug: teamSlug } },
    select: { contributorId: true }
  });
  
  const contributorIds = teamMembers.map(tm => tm.contributorId);

  // 2. Fetch all contributions made by these members
  const contributions = await prisma.contribution.findMany({
    where: {
      contributorId: { in: contributorIds },
      committedAt: { gte: since }
    },
    include: {
      repository: {
        include: {
          team: true
        }
      }
    }
  });

  // 3. Group by target team
  let internalCount = 0;
  let externalCount = 0;
  const externalTeamsMap = new Map<string, { slug: string, name: string, count: number, color: string }>();

  for (const c of contributions) {
    const targetTeam = c.repository.team;
    
    if (!targetTeam) {
      externalCount++;
      continue;
    }

    if (targetTeam.slug === teamSlug) {
      internalCount++;
    } else {
      externalCount++;
      const existing = externalTeamsMap.get(targetTeam.slug);
      if (existing) {
        existing.count++;
      } else {
        externalTeamsMap.set(targetTeam.slug, {
          slug: targetTeam.slug,
          name: targetTeam.displayName,
          color: targetTeam.color ?? "#6366f1",
          count: 1
        });
      }
    }
  }

  const topExternalTeams = Array.from(externalTeamsMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const totalCount = internalCount + externalCount;
  const internalPercentage = totalCount > 0 ? Math.round((internalCount / totalCount) * 100) : 0;
  
  return {
    internalCount,
    externalCount,
    totalCount,
    internalPercentage,
    topExternalTeams
  };
}
