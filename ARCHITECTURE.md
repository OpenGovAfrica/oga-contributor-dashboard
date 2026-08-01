# System Architecture

This document provides a high-level overview of the technical architecture driving the OpenGovAfrica Intelligence Dashboard.

## High-Level Data Flow

1. **The Sync Engine:** A Node.js background process utilizing `Octokit` polls the GitHub REST API for targeted repositories within the OpenGovAfrica organization.
2. **Ingestion & Normalization:** Raw GitHub event payloads (Commits, Issues, PRs) are mapped into our normalized Prisma schema and securely stored in PostgreSQL. Race conditions are handled via UPSERT operations based on unique GitHub node IDs.
3. **The Data Layer (Prisma):** The Postgres database acts as the single source of truth for the dashboard. Client views *never* hit the GitHub API directly. This completely shields the org from GitHub Rate Limits.
4. **The View Layer (Next.js App Router):** React Server Components (RSCs) execute heavy aggregation queries (`GROUP BY`, filtering) directly against the Postgres database on the server, streaming fully-rendered, lightweight HTML shells to the client.

## Core Technology Stack

- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Database Engine:** PostgreSQL
- **UI & Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + custom Glassmorphism CSS variables
- **State Validation:** [Zod](https://zod.dev/)
- **Charting:** [Recharts](https://recharts.org/)
- **Testing:** [Vitest](https://vitest.dev/)

## File Structure

```text
oga-dashboard/
├── docs/adr/              # Architecture Decision Records
├── prisma/
│   └── schema.prisma      # Core Data Models
├── src/
│   ├── app/               # Next.js App Router (Views, API Routes)
│   ├── components/        # Dumb UI Components (Cards, Charts)
│   ├── features/          # Domain Logic & SQL Aggregation Queries
│   └── lib/               # Shared Utilities (Zod, Prisma Singleton)
└── tests/                 # Unit & Integration Tests
```

## Architectural Design Patterns Used
- **URL-Driven State:** Client-side filtering is lifted entirely into URL parameters to ensure perfect Server-Side Rendering (SSR) and deep-linkability. See [ADR-001](docs/adr/001-zod-url-state-management.md).
- **Pull-Based Ingestion:** We avoid complex Webhook replay architecture by utilizing a scheduled pull-based Sync Engine. See [ADR-002](docs/adr/002-background-sync-vs-webhooks.md).
