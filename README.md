# 🌍 OpenGovAfrica Intelligence Dashboard

> An enterprise-grade, multi-dimensional analytics dashboard built for the OpenGovAfrica leadership team to track open-source repository health, contributor synergy, and engineering velocity across all internal teams.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat&logo=next.js)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](#)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat&logo=tailwind-css)](#)

## ⚡ Live Deployment
**[View the Live Dashboard on Vercel](#)** *(Requires authorized environment variables for live syncing)*

## ✨ Core Features
- **God-Level UI/UX:** Stunning, Glassmorphism-inspired design system built entirely from scratch using Tailwind v4. Perfectly responsive with Desktop-Lock safeguards for massive data grids.
- **The Synergy Matrix:** A proprietary 6x6 cross-team contribution matrix that tracks how often different OpenGovAfrica working groups collaborate on the same repositories.
- **Repository Health Matrix:** Real-time metrics on PR velocity, issue resolution rates, and commit frequency.
- **Executive PDF Export:** A standalone, A4-optimized reporting engine that converts live data into a pristine, print-ready PDF for stakeholder meetings.
- **Share to AI Auto-fill:** Groundbreaking "1-Click AI Export" that serializes the complex PDF data into a token-efficient prompt and auto-fills it directly into ChatGPT, Perplexity, or Claude.

## 🏗️ Architecture
This dashboard was engineered specifically to protect the OpenGovAfrica GitHub organization from API rate limits.
Rather than hitting the GitHub API on every page load, a **Pull-Based Sync Engine** ingest data in the background into a PostgreSQL database. The Next.js React Server Components (RSCs) execute heavy SQL aggregations against this database in milliseconds.

Read the [ARCHITECTURE.md](ARCHITECTURE.md) and our [Architecture Decision Records (ADRs)](docs/adr/) for deep-dives into our URL-state management and background sync engine.

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 20+
- Docker Desktop (for the local PostgreSQL instance)
- A GitHub Personal Access Token (`GITHUB_TOKEN`)

### 1. Boot the Database
```bash
docker compose up -d
```

### 2. Environment Variables
Copy the `.env.example` file to `.env` and fill in your GitHub Token.
```bash
cp .env.example .env
```

### 3. Database Migration & Seeding
```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Run the Sync Engine & App
To pull live data from OpenGovAfrica repositories:
```bash
npm run dev
```
Then navigate to `http://localhost:3000`.

## 🧪 Testing & CI
This project utilizes **Vitest** for lightning-fast unit testing of our core scoring algorithms and Zod parsing schemas.
GitHub Actions will automatically run `npm run lint` and `npm run test` on all Pull Requests to the `main` branch.

```bash
# Run unit tests locally
npx vitest run
```

## 📜 License
Internal OpenGovAfrica Tooling. All rights reserved.
