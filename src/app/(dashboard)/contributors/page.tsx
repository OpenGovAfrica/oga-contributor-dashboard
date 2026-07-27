// src/app/(dashboard)/contributors/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { Users } from "lucide-react";
import Image from "next/image";
import { Topbar } from "@/components/layout/Topbar";
import { TeamFilterBar } from "@/components/shared/TeamFilterBar";
import { TeamBadge } from "@/components/shared/TeamBadge";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { LeaderboardRowSkeleton } from "@/components/shared/LoadingSkeleton";
import { SortTabs } from "@/components/shared/SortTabs";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { getContributorLeaderboard } from "@/features/contributors/queries";
import { formatLongevity, formatLastActive, getImpactTier } from "@/features/contributors/transforms";
import {
  ContributorQuerySchema,
  CONTRIBUTOR_SORT_KEYS,
  type ContributorSortKey,
} from "@/lib/zod-schemas";
import type { ContributorLeaderboardEntry } from "@/features/contributors/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Contributors" };

const TIER_COLORS: Record<string, string> = {
  gold:    "#f59e0b",
  silver:  "#94a3b8",
  bronze:  "#cd7c3c",
  default: "var(--color-text-muted)",
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function ContributorsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsed = ContributorQuerySchema.parse(params);

  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title="Contributor Leaderboard"
        subtitle="Top impact drivers ranked by contribution volume, frequency, and longevity"
        currentWindow={parsed.window}
      />
      <div className="p-6 space-y-4 animate-fade-in flex-1 flex flex-col">
        <ModeToggle current={parsed.mode} />
        
        <div className="flex items-center gap-4">
          <TeamFilterBar />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-small text-[var(--color-text-muted)]">Sort by</span>
            <SortTabs 
              current={parsed.sortBy} 
              options={[
                { value: "volume", label: "Volume" },
                { value: "frequency", label: "Frequency" },
                { value: "longevity", label: "Longevity" },
              ]}
            />
          </div>
        </div>

        <div className="panel overflow-hidden">
          <Suspense
            fallback={
              <div>
                {Array.from({ length: 10 }).map((_, i) => (
                  <LeaderboardRowSkeleton key={i} />
                ))}
              </div>
            }
          >
            <LeaderboardTable parsed={parsed} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function LeaderboardTable({
  parsed,
}: {
  parsed: ReturnType<typeof ContributorQuerySchema.parse>;
}) {
  const { data, meta } = await getContributorLeaderboard({
    page: parsed.page,
    limit: parsed.limit,
    teamSlug: parsed.team,
    sortBy: parsed.sortBy,
    window: parsed.window,
    mode: parsed.mode,
  });

  if (!data.length) {
    return (
      <EmptyState
        icon={Users}
        title="No contributors found"
        description="Adjust the team filter or time window to see contributors."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-[2.5rem_2.5fr_1.5fr_6.5rem_6.5rem_4rem_4rem_6rem_6rem] items-center gap-3 px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-panel-raised)]">
        <span className="text-label text-[var(--color-text-muted)]">#</span>
        <span className="text-label text-[var(--color-text-muted)]">Contributor</span>
        <span className="text-label text-[var(--color-text-muted)]">Teams</span>
        
        {parsed.mode === "civic" ? (
          <>
            <span className="text-label text-[var(--color-brand)] text-center font-medium">Discussions</span>
            <span className="text-label text-[var(--color-brand)] text-center font-medium">Comments</span>
            <span className="text-label text-[var(--color-text-muted)] text-center">PRs</span>
          </>
        ) : (
          <>
            <span className="text-label text-[#10b981] text-center font-medium">Commits</span>
            <span className="text-label text-[#10b981] text-center font-medium">Reviews</span>
            <span className="text-label text-[var(--color-text-muted)] text-center">PRs</span>
          </>
        )}
        
        <span className="text-label text-[var(--color-text-muted)] text-center">Total</span>
        <span className="text-label text-[var(--color-text-muted)] text-center">Activity</span>
        <span className="text-label text-[var(--color-text-muted)] text-right">Tenure</span>
      </div>

      {data.map((contributor, index) => {
        const rank = (parsed.page - 1) * parsed.limit + index + 1;
        const tier = getImpactTier(rank);
        const sparklineData = contributor.sparkline.map((s) => s.count);
        return (
          <ContributorRow
            key={contributor.id}
            contributor={contributor}
            rank={rank}
            tierColor={TIER_COLORS[tier]}
            sparklineData={sparklineData}
            mode={parsed.mode}
          />
        );
      })}

      <Pagination {...meta} />
    </>
  );
}

import { ExternalLink, Flame } from "lucide-react";

function ContributorRow({
  contributor,
  rank,
  tierColor,
  sparklineData,
  mode,
}: {
  contributor: ContributorLeaderboardEntry;
  rank: number;
  tierColor: string;
  sparklineData: number[];
  mode: "civic" | "code";
}) {
  return (
    <div className="grid grid-cols-[2.5rem_2.5fr_1.5fr_6.5rem_6.5rem_4rem_4rem_6rem_6rem] items-center gap-3 px-6 py-4 border-b border-[var(--color-border-light)] hover:bg-[rgba(99,102,241,0.04)] transition-colors">
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color: tierColor }}
      >
        {rank}
      </span>

      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-full overflow-hidden bg-[var(--color-overlay)] shrink-0">
          {contributor.avatarUrl ? (
            <Image
              src={contributor.avatarUrl}
              alt={contributor.githubLogin}
              width={28}
              height={28}
              className="w-7 h-7 object-cover"
              unoptimized
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-xs font-bold text-white">
              {contributor.githubLogin[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex flex-col items-start">
          <div className="flex items-center gap-2 max-w-full">
            <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
              {contributor.name ?? contributor.githubLogin}
            </p>
            {contributor.currentStreak > 0 && (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                  contributor.currentStreak >= 10
                    ? "bg-purple-500/10 text-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)] animate-pulse"
                    : contributor.currentStreak >= 3
                    ? "bg-orange-500/10 text-orange-500"
                    : "bg-[var(--color-overlay)] text-[var(--color-text-secondary)]"
                )}
                title={`${contributor.currentStreak} Day Streak!`}
              >
                <Flame className={cn("w-3 h-3", contributor.currentStreak >= 3 && "animate-pulse")} />
                {contributor.currentStreak}
              </div>
            )}
          </div>
          <a 
            href={`https://github.com/${contributor.githubLogin}`}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-1 text-[11px] text-mono text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors truncate max-w-full"
            title="View GitHub Profile"
          >
            @{contributor.githubLogin}
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {contributor.teams.slice(0, 2).map((t) => (
          <TeamBadge
            key={t.slug}
            slug={t.slug}
            displayName={t.displayName}
            color={t.color}
          />
        ))}
        {contributor.teams.length > 2 && (
          <span className="text-[10px] text-[var(--color-text-muted)]">
            +{contributor.teams.length - 2}
          </span>
        )}
      </div>

      {mode === "civic" ? (
        <>
          <span className="text-xs tabular-nums text-center text-[var(--color-text-primary)] font-medium bg-[var(--color-brand)]/10 text-[var(--color-brand)] rounded mx-2 py-0.5">
            {contributor.issueOpenedCount.toLocaleString()}
          </span>
          <span className="text-xs tabular-nums text-center text-[var(--color-text-primary)] font-medium bg-[var(--color-brand)]/10 text-[var(--color-brand)] rounded mx-2 py-0.5">
            {contributor.issueCommentCount.toLocaleString()}
          </span>
          <span className="text-xs tabular-nums text-center text-[var(--color-text-secondary)]">
            {contributor.prCount.toLocaleString()}
          </span>
        </>
      ) : (
        <>
          <span className="text-xs tabular-nums text-center text-[var(--color-text-primary)] font-medium bg-[#10b981]/10 text-[#10b981] rounded mx-2 py-0.5">
            {contributor.commitCount.toLocaleString()}
          </span>
          <span className="text-xs tabular-nums text-center text-[var(--color-text-primary)] font-medium bg-[#10b981]/10 text-[#10b981] rounded mx-2 py-0.5">
            {contributor.reviewCount.toLocaleString()}
          </span>
          <span className="text-xs tabular-nums text-center text-[var(--color-text-secondary)]">
            {contributor.prCount.toLocaleString()}
          </span>
        </>
      )}
      <span className="text-xs tabular-nums text-center font-semibold text-[var(--color-text-primary)]">
        {contributor.totalCount.toLocaleString()}
      </span>

      <div className="flex justify-center">
        <MiniSparkline data={sparklineData} color="#6366f1" height={24} />
      </div>

      <div className="text-right">
        <p className="text-xs text-[var(--color-text-secondary)]">
          {formatLongevity(contributor.longevityDays)}
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          {formatLastActive(contributor.lastActiveAt)}
        </p>
      </div>
    </div>
  );
}


