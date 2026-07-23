// src/lib/github-sync.ts
import { Octokit } from "octokit";
import prisma from "./prisma";

export async function runGitHubSync() {
  const token = process.env.GITHUB_PAT;
  if (!token) {
    throw new Error("Missing GITHUB_PAT environment variable. Cannot sync.");
  }

  // Fetch Settings from DB
  let systemState = await prisma.systemState.findUnique({ where: { id: 1 } });
  if (!systemState) {
    systemState = await prisma.systemState.create({ 
      data: { 
        id: 1,
        lastSyncAt: new Date(0) 
      } 
    });
  }

  const ORG_LOGIN = systemState.targetOrg;
  const SYNC_DAYS_LOOKBACK = systemState.syncLookbackDays;

  const octokit = new Octokit({ 
    auth: token,
    request: {
      fetch: (url: any, opts: any) => {
        return fetch(url, { ...opts, cache: "no-store" });
      }
    }
  });
  const startTime = Date.now();

  try {
    /* --- Organization Reconciliation --- */
    // Synchronize core organization identity before processing nested resources.
    const orgData = await octokit.rest.orgs.get({ org: ORG_LOGIN });
    const org = await prisma.organization.upsert({
      where: { githubLogin: ORG_LOGIN },
      update: {
        name: orgData.data.name || ORG_LOGIN,
        avatarUrl: orgData.data.avatar_url,
        description: orgData.data.description,
      },
      create: {
        githubLogin: ORG_LOGIN,
        name: orgData.data.name || ORG_LOGIN,
        avatarUrl: orgData.data.avatar_url,
        description: orgData.data.description,
      },
    });

    /* --- Working Group Matrix --- */
    // Pre-populate established OGA working groups to enable cross-team synergy analytics.
    const TEAMS = [
      { slug: "wg-dev", displayName: "Working Group: Engineering", color: "#6366f1" },
      { slug: "wg-data", displayName: "Working Group: Data", color: "#06b6d4" },
      { slug: "wg-marketing", displayName: "Working Group: Marketing", color: "#f59e0b" },
      { slug: "wg-operations", displayName: "Working Group: Operations", color: "#10b981" },
      { slug: "wg-strategy", displayName: "Working Group: Strategy", color: "#f43f5e" },
      { slug: "wg-community", displayName: "Working Group: Community", color: "#ec4899" },
    ];
    
    const dbTeams = await Promise.all(TEAMS.map(t => 
      prisma.team.upsert({
        where: { slug: t.slug },
        update: { displayName: t.displayName, color: t.color },
        create: { slug: t.slug, displayName: t.displayName, color: t.color, organizationId: org.id }
      })
    ));
    const teamMap = new Map(dbTeams.map(t => [t.slug, t.id]));

    function getTeamForRepo(repoName: string): string {
      const name = repoName.toLowerCase();
      // Data & Research
      if (name.includes("data") || name.includes("protest") || name.includes("funds") || name.includes("reps") || name.includes("senate")) return "wg-data";
      // Marketing & Design
      if (name.includes("marketing") || name.includes("design") || name.includes("website")) return "wg-marketing";
      // Operations & HR
      if (name.includes("ops") || name.includes("hr") || name.includes("fundraising") || name.includes("project") || name.includes("manager")) return "wg-operations";
      // Strategy & Partnerships
      if (name.includes("strategy") || name.includes("partner") || name.includes("gov") || name.includes("forum")) return "wg-strategy";
      // Community & Events
      if (name.includes("hacktoberfest") || name.includes("gsoc") || name.includes("summit") || name.includes("community")) return "wg-community";
      
      // Default to engineering for core repos (common-libraries, .github, dashboard, atlas, etc)
      return "wg-dev"; 
    }

    /* --- Repository Discovery --- */
    // Optimize synchronization bandwidth by prioritizing repositories with recent push activity.
    const reposData = await octokit.rest.repos.listForOrg({
      org: ORG_LOGIN,
      type: "public",
      sort: "pushed",
      direction: "desc",
      per_page: 100, // Fetch up to 100 repositories
    });

    let sinceDate = new Date();
    // Force full sync to backfill PRs
    sinceDate.setDate(sinceDate.getDate() - SYNC_DAYS_LOOKBACK);
    const sinceIso = sinceDate.toISOString();

    for (const repo of reposData.data) {
      // Upsert Repo
      const dbRepo = await prisma.repository.upsert({
        where: { githubRepoId: repo.id },
        update: {
          nameWithOwner: repo.full_name,
          name: repo.name,
          description: repo.description,
          primaryLanguage: repo.language,
          stargazerCount: repo.stargazers_count,
          forkCount: repo.forks_count,
          defaultBranch: repo.default_branch,
          updatedAt: new Date(repo.updated_at || Date.now()),
          syncedAt: new Date(),
          teamId: teamMap.get(getTeamForRepo(repo.name)),
        },
        create: {
          githubRepoId: repo.id,
          nameWithOwner: repo.full_name,
          name: repo.name,
          description: repo.description,
          primaryLanguage: repo.language,
          stargazerCount: repo.stargazers_count,
          forkCount: repo.forks_count,
          defaultBranch: repo.default_branch,
          createdAt: new Date(repo.created_at || Date.now()),
          updatedAt: new Date(repo.updated_at || Date.now()),
          organizationId: org.id,
          teamId: teamMap.get(getTeamForRepo(repo.name)),
        },
      });

      /* --- Issue & PR Ingestion --- */
      // GitHub's REST API conflates PRs and Issues in this endpoint. We parse the payload 
      // dynamically to separate civic engagement (Issues) from engineering velocity (PRs).
      const issuesData = await octokit.paginate(octokit.rest.issues.listForRepo, {
        owner: ORG_LOGIN,
        repo: repo.name,
        state: "all",
        since: sinceIso,
        per_page: 100,
      });

      for (const issue of issuesData) {
        // Ensure author identity exists before associating contributions
        const authorUser = issue.user;
        if (!authorUser) continue;
        
        const contributor = await prisma.contributor.upsert({
          where: { githubLogin: authorUser.login },
          update: { avatarUrl: authorUser.avatar_url, lastActiveAt: new Date() },
          create: {
            githubLogin: authorUser.login,
            avatarUrl: authorUser.avatar_url,
            organizationId: org.id,
          },
        });

        // Isolate pure issues to track operational bandwidth for non-engineering teams.
        if (!issue.pull_request) {
          await prisma.issue.upsert({
            where: {
              repositoryId_githubNumber: {
                repositoryId: dbRepo.id,
                githubNumber: issue.number,
              },
            },
            update: {
              title: issue.title,
              state: issue.state === "closed" ? "CLOSED" : "OPEN",
              labels: issue.labels.map(l => (typeof l === "string" ? l : l.name || "")).filter(Boolean),
              closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
              commentCount: issue.comments || 0,
            },
            create: {
              githubNumber: issue.number,
              title: issue.title,
              state: issue.state === "closed" ? "CLOSED" : "OPEN",
              githubUrl: issue.html_url,
              labels: issue.labels.map(l => (typeof l === "string" ? l : l.name || "")).filter(Boolean),
              openedAt: new Date(issue.created_at),
              closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
              commentCount: issue.comments || 0,
              repositoryId: dbRepo.id,
              openerId: contributor.id,
            },
          });

          // Track 'Issue Opened' as a distinct civic contribution metric
          const existingOpenedContrib = await prisma.contribution.findFirst({
            where: { repositoryId: dbRepo.id, type: "ISSUE_OPENED", githubUrl: issue.html_url }
          });
          if (!existingOpenedContrib) {
             await prisma.contribution.create({
                data: {
                  type: "ISSUE_OPENED",
                  title: `Opened issue #${issue.number}`,
                  githubUrl: issue.html_url,
                  committedAt: new Date(issue.created_at),
                  contributorId: contributor.id,
                  repositoryId: dbRepo.id,
                }
             });
          }
        } else {
          // Handle PR specific velocity metrics, extracting merged state directly from the issue payload
          const existingPrContrib = await prisma.contribution.findFirst({
            where: { repositoryId: dbRepo.id, type: "PULL_REQUEST", githubUrl: issue.html_url }
          });
          
          const mergedAt = (issue.pull_request && (issue.pull_request as any).merged_at) 
            ? new Date((issue.pull_request as any).merged_at) 
            : null;

          if (!existingPrContrib) {
             await prisma.contribution.create({
                data: {
                  type: "PULL_REQUEST",
                  title: issue.title,
                  githubUrl: issue.html_url,
                  committedAt: new Date(issue.created_at),
                  mergedAt,
                  contributorId: contributor.id,
                  repositoryId: dbRepo.id,
                }
             });
          } else if (mergedAt && !existingPrContrib.mergedAt) {
             await prisma.contribution.update({
                where: { id: existingPrContrib.id },
                data: { mergedAt, title: issue.title }
             });
          }
        }
        
        // Link contributor to the repo's team
        if (dbRepo.teamId) {
          await prisma.teamMember.upsert({
            where: {
              teamId_contributorId: {
                teamId: dbRepo.teamId,
                contributorId: contributor.id,
              }
            },
            update: {},
            create: {
              teamId: dbRepo.teamId,
              contributorId: contributor.id,
            }
          });
        }
      }

      /* --- Commit Velocity Ingestion --- */
      try {
        const commitsData = await octokit.paginate(octokit.rest.repos.listCommits, {
          owner: ORG_LOGIN,
          repo: repo.name,
          since: sinceIso,
          per_page: 100,
        });

        for (const commit of commitsData) {
          const authorUser = commit.author;
          if (!authorUser) continue; // Skip if no github user linked

          const contributor = await prisma.contributor.upsert({
            where: { githubLogin: authorUser.login },
            update: { avatarUrl: authorUser.avatar_url, lastActiveAt: new Date() },
            create: {
              githubLogin: authorUser.login,
              avatarUrl: authorUser.avatar_url,
              organizationId: org.id,
            },
          });

          // Create Contribution
          const committedAt = commit.commit.author?.date ? new Date(commit.commit.author.date) : new Date();
          
          // Idempotency check: Ensure commits are not double-counted across sync executions.
          // Note: In a heavily scaled v2, we should enforce a unique composite constraint on (repositoryId, sha) at the DB level.
          const existing = await prisma.contribution.findFirst({
            where: { repositoryId: dbRepo.id, sha: commit.sha },
          });

          if (!existing) {
            await prisma.contribution.create({
              data: {
                type: "COMMIT",
                title: commit.commit.message.split("\n")[0].substring(0, 100),
                githubUrl: commit.html_url,
                sha: commit.sha,
                committedAt,
                contributorId: contributor.id,
                repositoryId: dbRepo.id,
              },
            });
          }
          
          // Link contributor to the repo's team
          if (dbRepo.teamId) {
            await prisma.teamMember.upsert({
              where: {
                teamId_contributorId: {
                  teamId: dbRepo.teamId,
                  contributorId: contributor.id,
                }
              },
              update: {},
              create: {
                teamId: dbRepo.teamId,
                contributorId: contributor.id,
              }
            });
          }
        }
      } catch (err) {
        // Repo might be empty or missing branch, ignore
        console.error(`Error fetching commits for ${repo.name}:`, err);
      }

      /* --- Non-Code Civic Engagement --- */
      // Track issue discussions as a primary contribution vector for strategy and marketing teams.
      try {
        const commentsData = await octokit.rest.issues.listCommentsForRepo({
          owner: ORG_LOGIN,
          repo: repo.name,
          sort: "updated",
          direction: "desc",
          since: sinceIso,
          per_page: 50,
        });

        for (const comment of commentsData.data) {
          if (!comment.user || comment.user.type === "Bot") continue;
          
          const contributor = await prisma.contributor.upsert({
            where: { githubLogin: comment.user.login },
            update: { avatarUrl: comment.user.avatar_url, lastActiveAt: new Date() },
            create: {
              githubLogin: comment.user.login,
              avatarUrl: comment.user.avatar_url,
              organizationId: org.id,
            },
          });
          
          // Link contributor to the repo's team
          if (dbRepo.teamId) {
            await prisma.teamMember.upsert({
              where: {
                teamId_contributorId: { teamId: dbRepo.teamId, contributorId: contributor.id }
              },
              update: {},
              create: { teamId: dbRepo.teamId, contributorId: contributor.id }
            });
          }

          // comment.issue_url looks like: https://api.github.com/repos/OpenGovAfrica/marketing/issues/123
          const issueUrlParts = comment.issue_url.split("/");
          const issueNumber = parseInt(issueUrlParts[issueUrlParts.length - 1], 10);
          
          const existingCommentContrib = await prisma.contribution.findFirst({
            where: { repositoryId: dbRepo.id, type: "ISSUE_COMMENT", githubUrl: comment.html_url }
          });

          if (!existingCommentContrib) {
             await prisma.contribution.create({
                data: {
                  type: "ISSUE_COMMENT",
                  title: `Commented on issue #${issueNumber}`,
                  githubUrl: comment.html_url,
                  committedAt: new Date(comment.created_at),
                  contributorId: contributor.id,
                  repositoryId: dbRepo.id,
                }
             });
          }

          // Update issue's lastCommentAt to track momentum
          try {
            await prisma.issue.update({
              where: { repositoryId_githubNumber: { repositoryId: dbRepo.id, githubNumber: issueNumber } },
              data: {
                lastCommentAt: new Date(comment.created_at)
              }
            });
          } catch (e) {
            // Issue might not be synced if it was created before the lookback window, ignore silently
          }
        }
      } catch (err) {
        console.error(`Error fetching comments for ${repo.name}:`, err);
      }
    }

    /* --- Contributor Tenure Backfill --- */
    // Execute a batch update to accurately reflect the earliest known interaction per contributor.
    await prisma.$executeRaw`
      UPDATE "Contributor"
      SET "firstSeenAt" = subquery.min_date
      FROM (
        SELECT "contributorId", MIN("committedAt") as min_date
        FROM "Contribution"
        GROUP BY "contributorId"
      ) as subquery
      WHERE "Contributor"."id" = subquery."contributorId"
      AND "Contributor"."firstSeenAt" > subquery.min_date;
    `;

    /* --- Viral Streak Calculation --- */
    // Leverages a standard Gaps-and-Islands SQL architecture to compute continuous daily contribution streaks globally.
    await prisma.$executeRaw`
      WITH daily_activity AS (
        SELECT DISTINCT "contributorId", DATE("committedAt") AS activity_date
        FROM "Contribution"
      ),
      grouped_activity AS (
        SELECT 
          "contributorId", 
          activity_date, 
          activity_date - (DENSE_RANK() OVER (PARTITION BY "contributorId" ORDER BY activity_date))::int AS grp
        FROM daily_activity
      ),
      streak_lengths AS (
        SELECT 
          "contributorId",
          COUNT(*) AS streak_length,
          MAX(activity_date) AS end_date
        FROM grouped_activity
        GROUP BY "contributorId", grp
      ),
      max_streaks AS (
        SELECT "contributorId", MAX(streak_length)::int as longest_streak
        FROM streak_lengths
        GROUP BY "contributorId"
      ),
      current_streaks AS (
        SELECT "contributorId", streak_length::int as current_streak
        FROM streak_lengths
        WHERE end_date >= CURRENT_DATE - INTERVAL '1 day'
      )
      UPDATE "Contributor" c
      SET 
        "longestStreak" = COALESCE(ms.longest_streak, 0),
        "currentStreak" = COALESCE(cs.current_streak, 0)
      FROM max_streaks ms
      LEFT JOIN current_streaks cs ON cs."contributorId" = ms."contributorId"
      WHERE c.id = ms."contributorId";
    `;

    /* --- Telemetry & State Management --- */
    // Persist API rate limits and execution latencies to enable keep-alive polling on the client side.
    const rateLimit = await octokit.rest.rateLimit.get();
    const latency = Date.now() - startTime;

    const state = await prisma.systemState.upsert({
      where: { id: 1 },
      update: {
        lastSyncAt: new Date(),
        rateLimitUsed: rateLimit.data.rate.used,
        rateLimitTotal: rateLimit.data.rate.limit,
        lastSyncLatencyMs: latency,
      },
      create: {
        id: 1,
        lastSyncAt: new Date(),
        rateLimitUsed: rateLimit.data.rate.used,
        rateLimitTotal: rateLimit.data.rate.limit,
        lastSyncLatencyMs: latency,
      },
    });

    return { success: true, state };
  } catch (error: any) {
    console.error("GitHub Sync Error:", error);
    throw new Error(error.message);
  }
}
