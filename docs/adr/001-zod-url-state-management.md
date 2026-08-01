# ADR 001: Lifting State to URL with Zod Validation

**Date:** 2026-08-01
**Status:** Accepted

## Context
Our dashboard requires complex filtering (Time Windows, Team Slugs, Sorting Modes, Pagination) across multiple server-rendered views. In a standard React SPA, these would be tracked via `useState` or a global store like Redux/Zustand.

## Decision
We decided to completely forgo internal React state for core data filters and instead lift all filtering state into the URL query parameters (`?window=7d&team=wg-dev&page=1`), validated symmetrically on the server via `Zod`.

## Rationale
1. **Shareability:** Executives can copy a URL of a specific, heavily-filtered data view and slack it to another team member. The view will perfectly re-hydrate.
2. **Server-Side Rendering (SSR):** Next.js Server Components can immediately read URL parameters before sending any HTML to the client. If state lived in `useState`, the server wouldn't know what to render until client-side hydration, causing layout shift and double-fetching.
3. **Type Safety:** By using `Zod` schemas (e.g., `TimeWindowSchema.parse(searchParams)`), we guarantee that if a user manually tampers with the URL (e.g., `?window=999d`), the server gracefully defaults back to a safe fallback without crashing.

## Consequences
- **Positive:** Deep-linking works flawlessly. SSR is incredibly fast. Zero client-side state synchronization bugs.
- **Negative:** Slightly more verbose navigation logic (must use Next.js `useRouter` and update query strings rather than just calling `setFilter()`).
