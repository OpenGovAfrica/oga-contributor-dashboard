# OGA Contributor & Impact Dashboard

Live view of contributor activity, repository health, and cross-team collaboration across OpenGov Africa's 29+ open source repositories — built to answer a question the team kept running into: who's doing what, and is it working.

[Live demo](#) · [Tracking issue](https://github.com/OpenGovAfrica/oga-contributor-dashboard/issues/1) · [Report an issue](https://github.com/OpenGovAfrica/oga-contributor-dashboard/issues)

## Why this exists

OGA's work is spread across 29+ repositories and several working groups, with no single place to see contributor activity, repository health, or how issue-based work is progressing across teams. Early feedback from the team also surfaced a specific gap: git-based metrics like commits and PRs make non-engineering teams look inactive, even when they're doing real work through issues. This dashboard was built to fix both problems.

## Features

- **Overview** — org-wide KPIs (contributors, active repositories, PR merge velocity, issue resolution rate), with a toggle between code activity and issue analytics, team distribution, and sync status.
- **Repositories** — health matrix across all repos with automatic Healthy / Degraded / Stalled status, filterable by team and language.
- **Contributors & leaderboard** — cross-repository contributor profiles and a weighted leaderboard, so contributions aren't trapped in a single repo's view.
- **Teams** — working-group breakdowns with a filter that recalculates every page's metrics by team.
- **Issue & collaboration analytics** — issue funnel and backlog trend, an aging report for stale issues, a work-category breakdown by label, and PR cycle time. This is the page that makes non-code contribution visible.
- **Settings** — platform preferences and organization configuration.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js App Router, React Server Components |
| Database | PostgreSQL via Prisma 7 |
| Styling | Tailwind v4, semantic design tokens, light/dark via next-themes |
| Charts | Recharts |
| Validation | Zod |
| Language | TypeScript throughout |

## Architecture

```text
GitHub API
    │
    ▼
Sync layer → Postgres (Organization, Team, Repository, Contributor, Contribution, Issue)
    │
    ▼
Feature-sliced queries (src/features/*) — server-only data access, typed
    │
    ▼
App Router pages (RSC) → API routes for client-side refetching
    │
    ▼
Client charts (Recharts) and interactive filters
```

UI components never fetch their own data — pages call typed query functions in `src/features/*`, and components only render what they're given. See `codebase_map.md` for the full directory tree.

## Getting started

```bash
git clone https://github.com/OpenGovAfrica/oga-contributor-dashboard.git
cd oga-contributor-dashboard

npm install

# 1. Set up environment variables
cp .env.example .env      # Add your DATABASE_URL and a read-only GitHub token

# 2. Start the local PostgreSQL database via Docker
docker compose up -d

# 3. Generate Prisma client & sync database schema
npm run db:generate
npx prisma db push

# 4. Seed the database with realistic test data
npm run db:seed

# 5. Start the development server
npm run dev
```

## Roadmap

v1 scope and progress are tracked in [the v1 tracking issue](https://github.com/OpenGovAfrica/oga-contributor-dashboard/issues/1). Planned next: a GitHub App with webhooks for real-time sync, GitHub OAuth, contribution points/achievements, and embeddable contributor badges.

## Contributing

Issues and PRs are welcome — start with the [tracking issue](https://github.com/OpenGovAfrica/oga-contributor-dashboard/issues/1) for current priorities. See `CONTRIBUTING.md` before opening a PR.

## Maintainers

Created and maintained by [Rohit Sharma](https://github.com/caffeine-rohit). Built for and used in production by [OpenGov Africa](https://github.com/OpenGovAfrica).

## License

MIT
