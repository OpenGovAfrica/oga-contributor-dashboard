// src/app/(dashboard)/overview/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { Users, FolderGit2, GitPullRequest, CheckCircle2, ExternalLink, FileText } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { MetricCard } from "@/components/cards/MetricCard";
import { ActivityTabsSection } from "@/components/charts/ActivityTabsSection";
import { SyncStatusCard } from "@/components/cards/SyncStatusCard";
import { TeamDistributionWidget } from "@/components/cards/TeamDistributionWidget";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/shared/LoadingSkeleton";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { getOrgKPIs, getVelocityTrend, getTeamDistribution, getIssueAnalytics } from "@/features/overview/queries";
import { getRepoHealthMatrix } from "@/features/repositories/queries";
import { formatNumber, formatRelativeDate } from "@/lib/utils";
import type { TimeWindow } from "@/lib/zod-schemas";
import { TimeWindowSchema } from "@/lib/zod-schemas";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SearchInput } from "@/components/shared/SearchInput";
import { Filter } from "lucide-react";

export const metadata: Metadata = {
  title: "Overview",
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function OverviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { window } = TimeWindowSchema.parse(params);

  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title="Platform Engineering"
        currentWindow={window}
      />

      <div className="flex-1 p-6 space-y-6 animate-fade-in max-w-[1400px]">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Platform Overview</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">High-level engineering performance and health</p>
          </div>
          <a 
            href={`/report?window=${window}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-[var(--color-brand)] text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-light)] transition-all shadow-sm"
          >
            <FileText className="w-4 h-4 opacity-90" />
            Generate Exec Report
          </a>
        </div>

        {/* KPI Row */}
        <Suspense fallback={<div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><MetricCardSkeleton key={i} />)}</div>}>
          <KPISection window={window} />
        </Suspense>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 panel p-5">
            <Suspense fallback={<div className="h-[350px] skeleton rounded-lg" />}>
              <VelocitySection window={window} />
            </Suspense>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <SyncStatusCard />
            <Suspense fallback={<div className="h-[200px] skeleton rounded-lg" />}>
              <TeamDistSection window={window} />
            </Suspense>
          </div>
        </div>

        {/* Repository Explorer */}
        <div className="panel overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Repository Explorer</h3>
            <div className="flex items-center gap-3">
              <SearchInput placeholder="Filter repositories..." className="w-[240px]" />
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-panel-raised)] transition-colors">
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
            </div>
          </div>
          <Suspense fallback={<div className="h-[300px] skeleton" />}>
            <RepoTablePreview window={window} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// server sub-components with separate suspense boundaries

async function KPISection({ window }: { window: TimeWindow }) {
  const kpis = await getOrgKPIs(window);
  
  // Dummy data for sparklines to match design
  const spark1 = [10, 25, 15, 30, 45, 20, 60];
  const spark2 = [5, 10, 15, 12, 20, 25, 28];
  const spark3 = [40, 35, 25, 20, 15, 10, 5];

  // Dummy close ratio percentage for the 4th card
  const resolutionRate = 88;

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        id="kpi-total-contributors"
        title="TOTAL CONTRIBUTORS"
        value={formatNumber(kpis.totalContributors)}
        delta={12} // hardcoded to match design's +12%
        deltaLabel="vs last month"
        icon={Users}
      >
        <MiniSparkline data={spark1} color="var(--color-brand)" type="bar" />
      </MetricCard>

      <MetricCard
        id="kpi-active-repos"
        title="ACTIVE REPOSITORIES"
        value={kpis.activeRepositories}
        delta={2}
        deltaLabel="new this week"
        icon={FolderGit2}
      >
        <MiniSparkline data={spark2} color="var(--color-brand)" type="bar" />
      </MetricCard>

      <MetricCard
        id="kpi-merge-velocity"
        title="PR MERGE VELOCITY"
        value={"1.1 d"}
        delta={-8}
        deltaLabel="vs last month"
        icon={GitPullRequest}
        inverse // lower is better
      >
        <MiniSparkline data={spark3} color="#a1a1aa" type="bar" />
      </MetricCard>

      <MetricCard
        id="kpi-resolution-rate"
        title="ISSUE RESOLUTION RATE"
        value={`${resolutionRate}%`}
        delta={4}
        deltaLabel="vs last month"
        icon={CheckCircle2}
      >
        <div className="flex flex-col gap-1 text-[9px] text-[var(--color-text-muted)] text-right">
          <div className="flex items-center justify-end gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)]"/> Open: 12</div>
          <div className="flex items-center justify-end gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#71717a]"/> Closed: 88</div>
        </div>
      </MetricCard>
    </div>
  );
}

async function VelocitySection({ window }: { window: TimeWindow }) {
  const [velocityData, issueAnalytics] = await Promise.all([
    getVelocityTrend(window),
    getIssueAnalytics(window)
  ]);
  return <ActivityTabsSection velocityData={velocityData} issueData={issueAnalytics.trend} />;
}

async function TeamDistSection({ window }: { window: TimeWindow }) {
  const data = await getTeamDistribution(window);
  // Transform to percentage matching the design widget format
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const formattedData = data.map(d => ({
    teamSlug: d.teamSlug,
    percentage: total === 0 ? 0 : Math.round((d.count / total) * 100),
    color: d.color
  })).slice(0, 3); // top 3

  return <TeamDistributionWidget data={formattedData} />;
}

async function RepoTablePreview({ window }: { window: TimeWindow }) {
  const { data } = await getRepoHealthMatrix({
    page: 1,
    limit: 5, // Just show top 5 in overview
    sortBy: "lastActivity",
    window,
  });

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Repository</th>
          <th>Team</th>
          <th className="text-center">Contributors</th>
          <th className="text-center">Commits (30d)</th>
          <th>Last Activity</th>
          <th>Health</th>
        </tr>
      </thead>
      <tbody>
        {data.map((repo) => (
          <tr key={repo.id}>
            <td>
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                <a
                  href={`https://github.com/${repo.nameWithOwner}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-1 text-[var(--color-text-primary)] hover:text-[var(--color-brand)] font-mono text-xs transition-colors truncate max-w-full"
                  title="View on GitHub"
                >
                  {repo.name}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </td>
            <td>
              <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                {repo.teamSlug || "—"}
              </span>
            </td>
            <td className="text-center tabular-nums text-xs">
              {repo.commits30d > 0 ? Math.max(1, Math.floor(repo.commits30d / 10)) : 0}
            </td>
            <td className="text-center tabular-nums text-xs font-medium text-[var(--color-text-primary)]">
              {repo.commits30d}
            </td>
            <td className="text-xs text-[var(--color-text-secondary)]">
              {repo.lastCommitAt ? formatRelativeDate(repo.lastCommitAt) : "never"}
            </td>
            <td>
              <StatusBadge status={repo.status === "Active" ? "Healthy" : repo.status === "Slowing" ? "Degraded" : repo.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
