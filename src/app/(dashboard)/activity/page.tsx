// src/app/(dashboard)/activity/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { BarChart2, Flame, ExternalLink, MessageSquare } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { TeamFilterBar } from "@/components/shared/TeamFilterBar";
import { ActivityFunnelChart } from "@/components/charts/ActivityFunnelChart";
import { PRMergeIntervalChart } from "@/components/charts/PRMergeIntervalChart";
import { ChartSkeleton } from "@/components/shared/LoadingSkeleton";
import { getActivityFunnelPayload } from "@/features/activity/queries";
import { ActivityQuerySchema } from "@/lib/zod-schemas";
import type { TimeWindow } from "@/lib/zod-schemas";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Activity" };

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function ActivityPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsed = ActivityQuerySchema.parse(params);

  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title="Issue & Collaboration Analytics"
        subtitle="Track issue lifecycle, resolution rates, and collaboration velocity"
        currentWindow={parsed.window}
      />
      <div className="p-6 space-y-6 animate-fade-in">
        <TeamFilterBar />

        <Suspense fallback={<div className="space-y-6"><ChartSkeleton height="160px" /><ChartSkeleton height="200px" /></div>}>
          <ActivityContent window={parsed.window} team={parsed.team} />
        </Suspense>
      </div>
    </div>
  );
}

import { IssueAgingChart } from "@/components/charts/IssueAgingChart";
import { LabelDistributionChart } from "@/components/charts/LabelDistributionChart";

async function ActivityContent({
  window,
  team,
}: {
  window: TimeWindow;
  team: string;
}) {
  const { funnel, prIntervals, issueAging, labelDistribution, hotCampaigns } = await getActivityFunnelPayload(
    window,
    team as Parameters<typeof getActivityFunnelPayload>[1],
  );

  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <FunnelMetric label="Issues Opened" value={funnel.opened} />
        <FunnelMetric label="Issues Closed" value={funnel.closed} />
        <FunnelMetric
          label="Close Ratio"
          value={`${Math.round(funnel.closeRatio * 100)}%`}
          highlight={funnel.closeRatio >= 0.6}
        />
        <FunnelMetric
          label="Avg Cycle Time"
          value={`${funnel.avgCycleTimeDays}d`}
        />
      </div>

      <div className="panel p-5">
        <h2 className="text-heading-3 text-[var(--color-text-primary)] mb-1">
          Issue Flow & Backlog Trend
        </h2>
        <p className="text-small text-[var(--color-text-muted)] mb-4">
          Daily opened vs closed issues and net backlog growth
        </p>
        <ActivityFunnelChart trend={funnel.trend} />
      </div>

      <div className="panel p-5 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-panel-raised)] border-l-4 border-l-[var(--color-brand)] mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 text-[var(--color-brand)] animate-pulse" />
          <h2 className="text-heading-3 text-[var(--color-text-primary)]">
            Hot Campaigns & Civic Momentum
          </h2>
        </div>
        <p className="text-small text-[var(--color-text-muted)] mb-4">
          The most actively discussed policy issues and operational tasks right now.
        </p>
        <div className="space-y-3">
          {hotCampaigns.length > 0 ? (
            hotCampaigns.map(c => (
              <a 
                key={c.id} 
                href={c.githubUrl || "#"} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border-light)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/5 transition-all group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--color-text-secondary)] bg-[var(--color-overlay)] px-1.5 py-0.5 rounded">
                      {c.repositoryName}
                    </span>
                    <span className={cn("w-2 h-2 rounded-full", c.state === "OPEN" ? "bg-green-500" : "bg-purple-500")} />
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-brand)] transition-colors">
                    {c.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3 shrink-0 pl-4">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-1 rounded-md font-medium text-sm">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {c.commentCount}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand)] transition-colors opacity-0 group-hover:opacity-100" />
                </div>
              </a>
            ))
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No active campaigns found in this window.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel p-5">
          <h2 className="text-heading-3 text-[var(--color-text-primary)] mb-1">
            Issue Aging Report
          </h2>
          <p className="text-small text-[var(--color-text-muted)] mb-4">
            Age distribution of currently open issues
          </p>
          <IssueAgingChart data={issueAging} />
        </div>

        <div className="panel p-5">
          <h2 className="text-heading-3 text-[var(--color-text-primary)] mb-1">
            Work Category Distribution
          </h2>
          <p className="text-small text-[var(--color-text-muted)] mb-4">
            Analysis of issue volume by GitHub labels
          </p>
          <LabelDistributionChart data={labelDistribution} />
        </div>
      </div>

      <div className="panel p-5">
        <h2 className="text-heading-3 text-[var(--color-text-primary)] mb-1">
          PR Merge Cycle Time
        </h2>
        <p className="text-small text-[var(--color-text-muted)] mb-4">
          Distribution of time from PR open to merge
        </p>
        <PRMergeIntervalChart data={prIntervals} />
      </div>
    </>
  );
}

function FunnelMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="panel p-4">
      <p className="text-label text-[var(--color-text-muted)] mb-2">{label}</p>
      <p
        className="text-2xl font-bold tabular-nums"
        style={{ color: highlight ? "var(--color-active)" : "var(--color-text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}
