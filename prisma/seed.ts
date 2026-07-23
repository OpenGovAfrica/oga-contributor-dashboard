// prisma/seed.ts
import { PrismaClient, ContributionType, IssueState, TeamRole } from "@prisma/client";
import { faker } from "@faker-js/faker";

import prisma from "../src/lib/prisma";

// ─── Constants ─────────────────────────────────────────────────────────────────

const TEAMS = [
  {
    slug: "wg-dev",
    displayName: "Working Group: Development",
    description: "Core software development and engineering infrastructure",
    color: "#6366f1",
    repoNames: [
      "oga-api-gateway",
      "oga-auth-service",
      "oga-data-pipeline",
      "oga-frontend-portal",
      "oga-cli",
      "oga-sdk-typescript",
    ],
  },
  {
    slug: "wg-data",
    displayName: "Working Group: Data",
    description: "Data engineering, analytics, and open data publishing",
    color: "#06b6d4",
    repoNames: [
      "oga-analytics-engine",
      "oga-etl-jobs",
      "oga-data-catalog",
      "oga-budget-tracker",
      "oga-procurement-db",
      "oga-reporting-api",
    ],
  },
  {
    slug: "wg-marketing",
    displayName: "Working Group: Marketing",
    description: "Public communications, campaigns, and brand assets",
    color: "#f59e0b",
    repoNames: [
      "oga-website",
      "oga-blog-cms",
      "oga-social-scheduler",
      "oga-design-system",
      "oga-press-kit",
      "oga-newsletter-engine",
    ],
  },
  {
    slug: "wg-operations",
    displayName: "Working Group: Operations",
    description: "Infrastructure, DevOps, and internal tooling",
    color: "#10b981",
    repoNames: [
      "oga-infra-terraform",
      "oga-k8s-manifests",
      "oga-ci-templates",
      "oga-monitoring-stack",
      "oga-secrets-manager",
      "oga-backup-scripts",
    ],
  },
  {
    slug: "wg-strategy",
    displayName: "Working Group: Strategy",
    description: "Governance, research, partnerships, and roadmap planning",
    color: "#f43f5e",
    repoNames: [
      "oga-governance-docs",
      "oga-policy-tracker",
      "oga-research-portal",
      "oga-partner-registry",
      "oga-roadmap",
      "oga-impact-reports",
    ],
  },
];

const LANGUAGES = [
  "TypeScript",
  "Python",
  "Go",
  "Rust",
  "JavaScript",
  "Shell",
  "MDX",
  "HCL",
  "YAML",
];

const ISSUE_LABELS = [
  "bug",
  "enhancement",
  "documentation",
  "question",
  "good first issue",
  "help wanted",
  "priority: high",
  "priority: low",
  "wontfix",
  "duplicate",
];

const LOCATIONS = [
  "Lagos, Nigeria",
  "Nairobi, Kenya",
  "Accra, Ghana",
  "Kampala, Uganda",
  "Dakar, Senegal",
  "Addis Ababa, Ethiopia",
  "Cairo, Egypt",
  "Cape Town, South Africa",
  "Abidjan, Côte d'Ivoire",
  "Kigali, Rwanda",
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = randomInt(min, Math.min(max, arr.length));
  return faker.helpers.arrayElements(arr, count);
}

/**
 * Returns a date between `start` and `end`, weighted toward recent dates
 * using an exponential distribution for natural commit patterns.
 */
function weightedRecentDate(start: Date, end: Date): Date {
  const range = end.getTime() - start.getTime();
  const r = Math.random();
  // Square root weighting — more recent dates are ~2x more likely
  const offset = Math.floor(Math.pow(r, 0.5) * range);
  return new Date(start.getTime() + offset);
}

// ─── Main Seed Function ────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding OGA Dashboard database...\n");

  // ── 1. Organization ───────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { githubLogin: "OpenGovAfrica" },
    create: {
      githubLogin: "OpenGovAfrica",
      name: "Open Gov Africa",
      avatarUrl: "https://avatars.githubusercontent.com/u/opengovafrica",
      description:
        "Pan-African open-source platform for transparent governance, civic technology, and data-driven accountability.",
    },
    update: {
      name: "Open Gov Africa",
    },
  });
  console.log(`✅ Organization: ${org.name}`);

  // ── 2. Teams ──────────────────────────────────────────────────────────────
  const teamRecords = await Promise.all(
    TEAMS.map((t) =>
      prisma.team.upsert({
        where: { slug: t.slug },
        create: {
          slug: t.slug,
          displayName: t.displayName,
          description: t.description,
          color: t.color,
          organizationId: org.id,
        },
        update: { displayName: t.displayName, color: t.color },
      }),
    ),
  );
  console.log(`✅ Teams: ${teamRecords.map((t) => t.slug).join(", ")}`);

  // ── 3. Repositories ───────────────────────────────────────────────────────
  const allRepos: Array<{ id: string; teamId: string; repoAgeDays: number }> = [];
  let githubRepoIdCounter = 100_000;

  for (let ti = 0; ti < TEAMS.length; ti++) {
    const team = TEAMS[ti];
    const teamRecord = teamRecords[ti];

    for (const repoName of team.repoNames) {
      const repoAgeDays = randomInt(180, 1000); // 6 months to ~3 years
      const createdAt = new Date(Date.now() - repoAgeDays * 24 * 60 * 60 * 1000);

      // Determine if this repo will be "Active", "Slowing", or "Stalled"
      // ~60% Active, ~25% Slowing, ~15% Stalled — across all repos
      const rand = Math.random();
      let lastPushDaysAgo: number;
      if (rand < 0.6) {
        lastPushDaysAgo = randomInt(1, 30); // Active
      } else if (rand < 0.85) {
        lastPushDaysAgo = randomInt(31, 90); // Slowing
      } else {
        lastPushDaysAgo = randomInt(91, 300); // Stalled
      }
      const updatedAt = new Date(
        Date.now() - lastPushDaysAgo * 24 * 60 * 60 * 1000,
      );

      const repo = await prisma.repository.upsert({
        where: { githubRepoId: githubRepoIdCounter },
        create: {
          githubRepoId: githubRepoIdCounter++,
          nameWithOwner: `OpenGovAfrica/${repoName}`,
          name: repoName,
          description: faker.lorem.sentence({ min: 6, max: 14 }),
          isPrivate: Math.random() < 0.1,
          primaryLanguage: randomItem(LANGUAGES),
          stargazerCount: randomInt(0, 280),
          forkCount: randomInt(0, 60),
          defaultBranch: "main",
          createdAt,
          updatedAt,
          organizationId: org.id,
          teamId: teamRecord.id,
        },
        update: { updatedAt },
      });

      allRepos.push({ id: repo.id, teamId: teamRecord.id, repoAgeDays });
    }
  }
  console.log(`✅ Repositories: ${allRepos.length} repos across 5 teams`);

  // ── 4. Contributors ───────────────────────────────────────────────────────
  const contributorCount = 120;
  const contributorRecords: Awaited<ReturnType<typeof prisma.contributor.upsert>>[] = [];

  for (let i = 0; i < contributorCount; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const githubLogin = faker.internet
      .username({ firstName, lastName })
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");

    const firstSeenAt = faker.date.between({
      from: new Date("2023-01-01"),
      to: new Date("2024-12-01"),
    });
    const lastActiveAt = faker.date.between({
      from: firstSeenAt,
      to: new Date(),
    });

    const contributor = await prisma.contributor.upsert({
      where: { githubLogin: `${githubLogin}-${i}` },
      create: {
        githubLogin: `${githubLogin}-${i}`,
        name: `${firstName} ${lastName}`,
        avatarUrl: `https://avatars.githubusercontent.com/u/${randomInt(10000, 9999999)}?v=4`,
        company: Math.random() < 0.5 ? faker.company.name() : null,
        location: Math.random() < 0.7 ? randomItem(LOCATIONS) : null,
        bio: Math.random() < 0.4 ? faker.lorem.sentence({ min: 5, max: 12 }) : null,
        firstSeenAt,
        lastActiveAt,
        organizationId: org.id,
      },
      update: { lastActiveAt },
    });
    contributorRecords.push(contributor);
  }
  console.log(`✅ Contributors: ${contributorRecords.length}`);

  // ── 5. Team Memberships ───────────────────────────────────────────────────
  // Each contributor is assigned to 1–2 teams
  // One contributor per team gets the LEAD role
  const teamLeadIndices = teamRecords.map(() => -1);

  for (let ci = 0; ci < contributorRecords.length; ci++) {
    const contributor = contributorRecords[ci];
    const assignedTeams = randomSubset(teamRecords, 1, 2);

    for (const team of assignedTeams) {
      const teamIdx = teamRecords.findIndex((t) => t.id === team.id);
      const isLead =
        teamLeadIndices[teamIdx] === -1 && Math.random() < 0.15;
      if (isLead) teamLeadIndices[teamIdx] = ci;

      await prisma.teamMember.upsert({
        where: {
          teamId_contributorId: {
            teamId: team.id,
            contributorId: contributor.id,
          },
        },
        create: {
          teamId: team.id,
          contributorId: contributor.id,
          role: isLead ? TeamRole.LEAD : TeamRole.MEMBER,
          joinedAt: contributor.firstSeenAt,
        },
        update: {},
      });
    }
  }
  console.log(`✅ Team memberships assigned`);

  // ── 6. Contributions ──────────────────────────────────────────────────────
  // 20% of contributors are "core" — generate 60% of contributions
  const coreCount = Math.floor(contributorRecords.length * 0.2);
  const coreContributors = contributorRecords.slice(0, coreCount);
  const regularContributors = contributorRecords.slice(coreCount);

  let totalContributions = 0;
  // Concentrate mock data in the last 90 days so the dashboard looks hyper-active!
  const seedStart = new Date();
  seedStart.setDate(seedStart.getDate() - 90);
  const seedEnd = new Date();

  async function createContributionsForContributor(
    contributor: (typeof contributorRecords)[0],
    count: number,
    repoPool: typeof allRepos,
  ) {
    const batches = [];
    for (let k = 0; k < count; k++) {
      const repo = randomItem(repoPool);
      const committedAt = weightedRecentDate(
        new Date(Math.max(seedStart.getTime(), contributor.firstSeenAt.getTime())),
        seedEnd,
      );

      const typeRoll = Math.random();
      let type: ContributionType;
      let mergedAt: Date | null = null;
      let title: string | null = null;

      if (typeRoll < 0.6) {
        type = ContributionType.COMMIT;
        title = faker.helpers.arrayElement([
          `fix: ${faker.hacker.phrase()}`,
          `feat: add ${faker.hacker.noun()} ${faker.hacker.verb()}`,
          `chore: update ${faker.hacker.noun()}`,
          `docs: ${faker.lorem.words({ min: 3, max: 6 })}`,
          `refactor: clean up ${faker.hacker.noun()}`,
        ]);
      } else if (typeRoll < 0.9) {
        type = ContributionType.PULL_REQUEST;
        title = `[${faker.hacker.abbreviation()}] ${faker.hacker.phrase()}`;
        const cycleDays = randomInt(0, 30);
        mergedAt = new Date(
          committedAt.getTime() + cycleDays * 24 * 60 * 60 * 1000,
        );
        if (mergedAt > seedEnd) mergedAt = null; // Not yet merged
      } else {
        type = ContributionType.REVIEW;
        title = `Review: ${faker.hacker.phrase()}`;
      }

      batches.push(
        prisma.contribution.create({
          data: {
            type,
            title,
            sha: type === ContributionType.COMMIT ? faker.git.commitSha() : null,
            githubUrl: `https://github.com/OpenGovAfrica/${faker.helpers.arrayElement(
              TEAMS.flatMap((t) => t.repoNames),
            )}/commit/${faker.git.commitSha()}`,
            additions: randomInt(1, 400),
            deletions: randomInt(0, 200),
            changedFiles: randomInt(1, 20),
            mergedAt,
            committedAt,
            contributorId: contributor.id,
            repositoryId: repo.id,
          },
        }),
      );
    }
    await prisma.$transaction(batches);
    totalContributions += count;
  }

  // Core contributors: 20–40 contributions each
  for (const c of coreContributors) {
    await createContributionsForContributor(c, randomInt(20, 40), allRepos);
  }

  // Regular contributors: 2–10 contributions each
  for (const c of regularContributors) {
    await createContributionsForContributor(c, randomInt(2, 10), allRepos);
  }

  console.log(`✅ Contributions: ${totalContributions} total`);

  // ── 7. Issues ─────────────────────────────────────────────────────────────
  let totalIssues = 0;
  let issueCounter = 1;

  for (const repo of allRepos) {
    const issueCount = randomInt(12, 30);

    for (let i = 0; i < issueCount; i++) {
      const opener = randomItem(contributorRecords);
      const openedAt = faker.date.between({
        from: seedStart,
        to: seedEnd,
      });

      const isClosed = Math.random() < 0.65;
      let closedAt: Date | null = null;
      let closerId: string | null = null;

      if (isClosed) {
        const cycleDays = randomInt(0, 45);
        closedAt = new Date(
          openedAt.getTime() + cycleDays * 24 * 60 * 60 * 1000,
        );
        if (closedAt > new Date()) closedAt = new Date();
        closerId = randomItem(contributorRecords).id;
      }

      await prisma.issue.create({
        data: {
          githubNumber: issueCounter++,
          title: faker.helpers.arrayElement([
            `[Bug] ${faker.hacker.phrase()}`,
            `[Feature] Add support for ${faker.hacker.noun()}`,
            `[Docs] Document ${faker.hacker.noun()} usage`,
            `[Question] How to ${faker.hacker.verb()} ${faker.hacker.noun()}?`,
            `${faker.hacker.phrase()} fails on ${faker.hacker.noun()}`,
          ]),
          state: isClosed ? IssueState.CLOSED : IssueState.OPEN,
          githubUrl: `https://github.com/OpenGovAfrica/oga-repo/issues/${issueCounter}`,
          labels: randomSubset(ISSUE_LABELS, 0, 3),
          openedAt,
          closedAt,
          repositoryId: repo.id,
          openerId: opener.id,
          closerId,
        },
      });
    }
    totalIssues += issueCount;
  }

  console.log(`✅ Issues: ${totalIssues} total\n`);
  console.log("🎉 Seed complete!");
  console.log(`   Organization : 1`);
  console.log(`   Teams        : ${teamRecords.length}`);
  console.log(`   Repositories : ${allRepos.length}`);
  console.log(`   Contributors : ${contributorRecords.length}`);
  console.log(`   Contributions: ${totalContributions}`);
  console.log(`   Issues       : ${totalIssues}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
