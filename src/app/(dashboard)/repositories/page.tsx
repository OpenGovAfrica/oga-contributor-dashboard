// src/app/(dashboard)/repositories/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { GitFork } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { TeamFilterBar } from "@/components/shared/TeamFilterBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TeamBadge } from "@/components/shared/TeamBadge";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableRowSkeleton } from "@/components/shared/LoadingSkeleton";
import { SortSelector } from "@/components/shared/SortSelector";
import { getRepoHealthMatrix } from "@/features/repositories/queries";
import { formatRelativeDate } from "@/lib/utils";
import { RepoQuerySchema, REPO_SORT_KEYS, type RepoSortKey } from "@/lib/zod-schemas";
import type { RepoHealthRow } from "@/features/repositories/types";

export const metadata: Metadata = { title: "Repositories" };

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", Python: "#3572A5", Go: "#00ADD8",
  Rust: "#dea584", JavaScript: "#f1e05a", Shell: "#89e051",
  MDX: "#083fa1", HCL: "#844FBA", YAML: "#cb171e",
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function RepositoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsed = RepoQuerySchema.parse(params);

  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title="Repository Health Matrix"
        subtitle="Graded by commit recency and issue cycle activity"
        currentWindow={parsed.window}
      />
      <div className="p-6 space-y-4 animate-fade-in">
        {/* Filter Bar */}
        <div className="flex items-center gap-4">
          <TeamFilterBar />
          <div className="ml-auto flex items-center gap-3">
            <span className="text-small text-[var(--color-text-muted)]">Sort by</span>
            <SortSelector 
              current={parsed.sortBy} 
              options={[
                { value: "lastActivity", label: "Last Activity" },
                { value: "commits30d", label: "Commits (30d)" },
                { value: "openIssues", label: "Open Issues" },
                { value: "stars", label: "Stars" },
                { value: "name", label: "Name" }
              ]}
            />
          </div>
        </div>

        {/* Table */}
        <div className="panel overflow-hidden">
          <Suspense fallback={<TableLoadingSkeleton />}>
            <RepoTable parsed={parsed} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function RepoTable({
  parsed,
}: {
  parsed: ReturnType<typeof RepoQuerySchema.parse>;
}) {
  const { data, meta } = await getRepoHealthMatrix({
    page: parsed.page,
    limit: parsed.limit,
    teamSlug: parsed.team,
    sortBy: parsed.sortBy,
    window: parsed.window,
  });

  if (!data.length) {
    return (
      <EmptyState
        icon={GitFork}
        title="No repositories found"
        description="Try adjusting the team filter or time window."
      />
    );
  }

  return (
    <>
      {/* Status summary */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-panel-raised)]">
        {(["Active", "Slowing", "Stalled"] as const).map((s) => {
          const count = data.filter((r) => r.status === s).length;
          return (
            <div key={s} className="flex items-center gap-2">
              <StatusBadge status={s} />
              <span className="text-small text-[var(--color-text-muted)]">
                {count}
              </span>
            </div>
          );
        })}
        <span className="ml-auto text-small text-[var(--color-text-muted)]">
          {meta.total} total
        </span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Repository</th>
            <th>Team</th>
            <th>Status</th>
            <th>Last Commit</th>
            <th className="text-center">30d Commits</th>
            <th className="text-center">Open Issues</th>
            <th className="text-center">Stars</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {data.map((repo) => (
            <RepoRow key={repo.id} repo={repo} />
          ))}
        </tbody>
      </table>
      <Pagination {...meta} />
    </>
  );
}

import { ExternalLink } from "lucide-react";

function RepoRow({ repo }: { repo: RepoHealthRow }) {
  const langColor = repo.primaryLanguage
    ? LANGUAGE_COLORS[repo.primaryLanguage] ?? "#888"
    : null;

  return (
    <tr>
      <td>
        <div className="flex items-center gap-2">
          {langColor && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: langColor }}
              title={repo.primaryLanguage ?? ""}
            />
          )}
          <div className="flex flex-col items-start min-w-0">
            <a
              href={`https://github.com/${repo.nameWithOwner}`}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-1 text-[var(--color-text-primary)] hover:text-[var(--color-brand)] font-medium text-xs transition-colors truncate max-w-full"
              title="View on GitHub"
            >
              {repo.name}
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            {repo.description && (
              <p className="text-[var(--color-text-muted)] text-[11px] truncate max-w-[260px]">
                {repo.description}
              </p>
            )}
          </div>
        </div>
      </td>
      <td>
        {repo.teamSlug ? (
          <TeamBadge
            slug={repo.teamSlug}
            displayName={repo.teamDisplayName ?? ""}
            color={repo.teamColor}
          />
        ) : (
          <span className="text-[var(--color-text-muted)]">—</span>
        )}
      </td>
      <td><StatusBadge status={repo.status} /></td>
      <td>
        <span className="text-xs">
          {repo.lastActivityAt
            ? formatRelativeDate(repo.lastActivityAt)
            : <span className="text-[var(--color-text-muted)]">never</span>}
        </span>
      </td>
      <td className="text-center tabular-nums text-xs font-medium">
        {repo.commits30d}
      </td>
      <td className="text-center tabular-nums text-xs">
        {repo.openIssuesCount}
      </td>
      <td className="text-center tabular-nums text-xs">
        {repo.stargazerCount}
      </td>
      <td>
        <MiniSparkline data={repo.sparkline} color="var(--color-brand)" />
      </td>
    </tr>
  );
}



function TableLoadingSkeleton() {
  return (
    <table className="data-table">
      <thead>
        <tr>
          {["Repository","Team","Status","Last Commit","30d Commits","Issues","Stars","Trend"]
            .map((h) => <th key={h}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 10 }).map((_, i) => (
          <TableRowSkeleton key={i} cols={8} />
        ))}
      </tbody>
    </table>
  );
}
