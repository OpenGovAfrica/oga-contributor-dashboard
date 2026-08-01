# ADR 002: Scheduled API Polling vs GitHub Webhooks

**Date:** 2026-08-01
**Status:** Accepted

## Context
To populate the database with GitHub activity (commits, PRs, issues), we needed a synchronization mechanism. The two primary options were:
1. **GitHub Webhooks:** A push-based system where GitHub sends an HTTP POST request to our server the millisecond an event occurs.
2. **Background API Polling (Sync Engine):** A pull-based system that hits the GitHub REST API at scheduled intervals to fetch the latest data.

## Decision
We opted for a **Pull-Based Synchronization Engine** (Background Polling) orchestrated by Vercel Cron Jobs or internal application scheduling, explicitly rejecting GitHub Webhooks for the MVP architecture.

## Rationale
1. **Infrastructure Simplicity:** Webhooks require the dashboard to be publicly accessible from the internet at all times to receive payloads. During local development, this requires tunneling (like ngrok). A pull-based sync engine allows developers to run the entire stack locally without any tunneling infrastructure.
2. **Rate Limit Management:** An enterprise open-source org might generate 1,000 webhook events per minute during a CI spike. In a serverless environment (like Vercel), this would trigger 1,000 concurrent edge function executions, skyrocketing costs and potentially exhausting database connections. A polling engine processes data in predictable, batch-controlled intervals using `Octokit` pagination.
3. **Idempotency:** Webhooks can be dropped or duplicated. Building a robust webhook receiver requires complex replay logic. Our pull-based sync engine uses Prisma `upsert` and simply scans the latest timestamp since the last sync, guaranteeing eventual consistency with zero risk of missed events.

## Consequences
- **Positive:** Vercel deployment costs remain flat regardless of GitHub activity spikes. Local development is frictionless.
- **Negative:** Data is not perfectly real-time (it is bound by the cron interval, e.g., every 1 hour), but for an Executive level dashboard analyzing 90-day trends, microsecond-level latency is unnecessary.
