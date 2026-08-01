# GitHub App / Token Security Requirements

For the OpenGovAfrica Sync Engine to operate, it requires a GitHub Personal Access Token (PAT) or a GitHub App installation. This document outlines the exact permissions required.

## Why We Need Access
The dashboard operates purely on read-only historical data to calculate engineering velocity and synergy. It **never** modifies repository contents, closes issues, or pushes code.

## Required Permissions (Fine-Grained PAT)

If creating a Fine-Grained Personal Access Token, apply these exact permissions to the `OpenGovAfrica` organization:

- **Repository Permissions:**
  - `Metadata`: Read-only (Required for basic repo fetching)
  - `Commit statuses`: Read-only (Required for commit volume)
  - `Issues`: Read-only (Required for issue velocity)
  - `Pull Requests`: Read-only (Required for merge metrics)

- **Organization Permissions:**
  - `Members`: Read-only (Required to map GitHub logins to OpenGovAfrica Teams)

## Security Posture
The token is passed securely to the Next.js backend via the `GITHUB_TOKEN` environment variable. **This token is NEVER exposed to the client-side browser bundle.** All Octokit API calls are executed strictly on the server within `src/app/api/activity/route.ts` and background cron jobs.
