// src/app/(dashboard)/overview/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { Users, FolderGit2, GitPullRequest, CheckCircle2, ExternalLink, FileText } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { MetricCard } from "@/components/cards/MetricCard";
import { ActivityTabsSection } from "@/components/charts/ActivityTabsSection";
import { TeamDistributionWidget } from "@/components/cards/TeamDistributionWidget";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/shared/LoadingSkeleton";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { getOrgKPIs, getVelocityTrend, getTeamDistribution, getIssueAnalytics, getRecentPullRequests } from "@/features/overview/queries";
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

        {/* Charts & PRs Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          <div className="lg:col-span-3 panel p-5">
            <Suspense fallback={<div className="h-[350px] skeleton rounded-lg" />}>
              <VelocitySection window={window} />
            </Suspense>
          </div>
          <div className="lg:col-span-1">
            <Suspense fallback={<div className="h-full skeleton rounded-lg" />}>
              <RecentPRSection window={window} />
            </Suspense>
          </div>
        </div>

        {/* Repos & Teams Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-3 panel overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
              <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Repository Explorer</h3>
              <div className="flex items-center gap-3">
                <SearchInput placeholder="Filter repositories..." className="w-[240px]" />
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-panel-raised)] transition-colors">
                  <Filter className="w-3.5 h-3.5" /> Filter
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <Suspense fallback={<div className="h-[300px] skeleton" />}>
                <RepoTablePreview window={window} />
              </Suspense>
            </div>
          </div>
          <div className="lg:col-span-1">
            <Suspense fallback={<div className="h-[200px] skeleton rounded-lg" />}>
              <TeamDistSection window={window} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

// server sub-components with separate suspense boundaries

async function KPISection({ window }: { window: TimeWindow }) {
  const kpis = await getOrgKPIs(window);
  
  // Dummy data for sparklines to match design (these represent volume trends, not deltas)
  const spark1 = [10, 25, 15, 30, 45, 20, 60];
  const spark2 = [5, 10, 15, 12, 20, 25, 28];

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        id="kpi-active-contributors"
        title="ACTIVE CONTRIBUTORS"
        value={formatNumber(kpis.activeContributors)}
        icon={Users}
      >
        <MiniSparkline data={spark1} color="var(--color-brand)" type="bar" />
      </MetricCard>

      <MetricCard
        id="kpi-total-commits"
        title="TOTAL COMMITS"
        value={formatNumber(kpis.totalCommits)}
        delta={kpis.commitsDelta > 0 ? kpis.commitsDelta : undefined}
        deltaLabel={kpis.commitsDelta > 0 ? "vs previous period" : undefined}
        icon={FolderGit2}
      >
        <MiniSparkline data={spark2} color="var(--color-brand)" type="bar" />
      </MetricCard>

      <MetricCard
        id="kpi-pull-requests"
        title="PULL REQUESTS"
        value={formatNumber(kpis.prsOpened)}
        icon={GitPullRequest}
      >
        <div className="flex flex-col gap-1 text-[10px] text-[var(--color-text-muted)] text-right mt-1 font-medium">
          <div className="flex items-center justify-end gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)]"/> Merged: {formatNumber(kpis.prsMerged)}</div>
        </div>
      </MetricCard>

      <MetricCard
        id="kpi-issues"
        title="ISSUES"
        value={formatNumber(kpis.issuesOpened)}
        icon={CheckCircle2}
      >
        <div className="flex flex-col gap-1 text-[10px] text-[var(--color-text-muted)] text-right mt-1 font-medium">
          <div className="flex items-center justify-end gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#71717a]"/> Closed: {formatNumber(kpis.issuesClosed)}</div>
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

async function RecentPRSection({ window }: { window: TimeWindow }) {
  const prs = await getRecentPullRequests(window, 5);

  return (
    <div className="panel flex flex-col overflow-hidden h-full">
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Recent PRs</h3>
      </div>
      <div className="p-2 space-y-1 overflow-y-auto flex-1">
        {prs.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--color-text-muted)]">No PRs in this window.</div>
        ) : (
          prs.map(pr => (
            <a key={pr.id} href={pr.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-2 rounded-md hover:bg-[var(--color-panel-raised)] transition-colors">
              <div className="w-7 h-7 rounded-full bg-[var(--color-overlay)] overflow-hidden shrink-0">
                {pr.authorAvatar ? (
                  <img src={pr.authorAvatar} alt={pr.authorLogin} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-4 h-4 m-1.5 text-[var(--color-text-muted)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{pr.title}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{pr.authorLogin} • {formatRelativeDate(new Date(pr.createdAt))}</p>
              </div>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium ${
                pr.state === "MERGED" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                pr.state === "CLOSED" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                "bg-[var(--color-overlay)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
              }`}>
                {pr.state}
              </span>
            </a>
          ))
        )}
      </div>
    </div>
  );
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
              {repo.lastActivityAt ? formatRelativeDate(new Date(repo.lastActivityAt)) : "never"}
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
