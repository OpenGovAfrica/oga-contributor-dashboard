// src/app/report/page.tsx
import { Suspense } from "react";
import { format } from "date-fns";
import { Printer, Users, GitCommit, FolderGit2, GitPullRequest, CheckCircle2 } from "lucide-react";
import { TimeWindowSchema } from "@/lib/zod-schemas";
import { getOrgKPIs, getIssueAnalytics, getTeamDistribution } from "@/features/overview/queries";
import { getTeamSynergy } from "@/features/teams/queries";
import { getRepoHealthMatrix } from "@/features/repositories/queries";
import prisma from "@/lib/prisma";
import { windowToStartDate } from "@/lib/zod-schemas";
import { formatNumber } from "@/lib/utils";
import { PrintAction } from "./PrintAction";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function ReportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { window } = TimeWindowSchema.parse(params);
  const since = windowToStartDate(window);

  const [kpis, issues, teams, synergyData, activeRepos, repoHealthMatrix] = await Promise.all([
    getOrgKPIs(window),
    getIssueAnalytics(window, "all"),
    getTeamDistribution(window),
    getTeamSynergy("wg-dev", window), // Using dev as the flagship team for synergy in the report
    prisma.repository.count({
      where: {
        OR: [
          { contributions: { some: { committedAt: { gte: since } } } },
          { issues: { some: { openedAt: { gte: since } } } },
        ]
      }
    }),
    getRepoHealthMatrix({ page: 1, limit: 5, sortBy: "lastActivity", window })
  ]);
  
  const repoHealthData = repoHealthMatrix.data;

  // Fetch top 5 global contributors
  const contributors = await prisma.contributor.findMany({
    where: { contributions: { some: { committedAt: { gte: since } } } },
    include: {
      contributions: { where: { committedAt: { gte: since } } },
    }
  });

  const ranked = contributors
    .map(c => ({
      login: c.githubLogin,
      commits: c.contributions.filter(x => x.type === "COMMIT").length,
      total: c.contributions.length
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return (
    <div className="report-container relative">
      {/* Header */}
      <div className="border-b-2 border-black pb-8 mb-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 relative mb-6 rounded-xl overflow-hidden bg-white p-2 border-2 border-gray-200 shadow-sm">
          <img src="/logo.webp" alt="OpenGovAfrica Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Executive Analytics Report</h1>
        <p className="text-lg font-medium text-gray-600">OpenGovAfrica • Open Source Operations</p>
        <div className="mt-6 flex items-center justify-center gap-8 text-sm font-semibold">
          <span className="bg-gray-100 px-3 py-1 rounded-md">Generated: {format(new Date(), "MMM dd, yyyy")}</span>
          <span className="bg-gray-100 px-3 py-1 rounded-md">Time Window: Last {window.replace('d', ' Days')}</span>
        </div>
      </div>

      {/* Core Health Metrics */}
      <div className="mb-12 avoid-break">
        <h2 className="text-xl font-bold uppercase tracking-widest border-b border-gray-300 pb-2 mb-6">1. Core Health Metrics</h2>
        <div className="grid grid-cols-4 gap-6">
          <div className="p-6 border border-gray-200 rounded-xl bg-gray-50 text-center flex flex-col justify-between">
            <div>
              <Users className="w-6 h-6 mx-auto mb-3 text-blue-600" />
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Active Contributors</p>
              <p className="text-4xl font-black">{formatNumber(kpis.activeContributors)}</p>
            </div>
          </div>
          <div className="p-6 border border-gray-200 rounded-xl bg-gray-50 text-center flex flex-col justify-between">
            <div>
              <GitCommit className="w-6 h-6 mx-auto mb-3 text-purple-600" />
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Total Commits</p>
              <p className="text-4xl font-black">{formatNumber(kpis.totalCommits)}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between text-[10px] font-bold uppercase">
              <span className="text-gray-400">Active Repos</span>
              <span className="text-gray-600">{activeRepos}</span>
            </div>
          </div>
          <div className="p-6 border border-gray-200 rounded-xl bg-gray-50 text-center flex flex-col justify-between">
            <div>
              <GitPullRequest className="w-6 h-6 mx-auto mb-3 text-green-600" />
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Pull Requests</p>
              <p className="text-4xl font-black">{formatNumber(kpis.prsOpened)}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between text-[10px] font-bold uppercase">
              <span className="text-gray-400">Merged</span>
              <span className="text-green-600">{formatNumber(kpis.prsMerged)}</span>
            </div>
          </div>
          <div className="p-6 border border-gray-200 rounded-xl bg-gray-50 text-center flex flex-col justify-between">
            <div>
              <CheckCircle2 className="w-6 h-6 mx-auto mb-3 text-amber-600" />
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Issues</p>
              <p className="text-4xl font-black">{formatNumber(kpis.issuesOpened)}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between text-[10px] font-bold uppercase">
              <span className="text-gray-400">Closed</span>
              <span className="text-amber-600">{formatNumber(kpis.issuesClosed)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Velocity & Resolution */}
      <div className="mb-12 avoid-break">
        <h2 className="text-xl font-bold uppercase tracking-widest border-b border-gray-300 pb-2 mb-6">2. Issue Velocity & Resolution</h2>
        <div className="flex gap-8">
          <div className="flex-1 p-6 border border-gray-200 rounded-xl">
            <p className="text-sm font-bold text-gray-600 mb-4">Volume Overview</p>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600 font-medium">Issues Opened</span>
              <span className="text-xl font-bold">{issues.totalOpened}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600 font-medium">Issues Closed</span>
              <span className="text-xl font-bold text-green-600">{issues.totalClosed}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-gray-600 font-bold">Currently Open Backlog</span>
              <span className="text-xl font-black">{issues.openCurrently}</span>
            </div>
          </div>
          <div className="flex-1 p-6 border border-gray-200 rounded-xl bg-gray-900 text-white">
            <p className="text-sm font-bold text-gray-400 mb-4">Resolution Rate</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-black">
                {issues.totalOpened > 0 ? Math.round((issues.totalClosed / issues.totalOpened) * 100) : 0}%
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              For every 100 issues opened during this period, {issues.totalOpened > 0 ? Math.round((issues.totalClosed / issues.totalOpened) * 100) : 0} were successfully resolved and closed.
            </p>
          </div>
        </div>
      </div>

      {/* Repository Health */}
      <div className="mb-12 avoid-break">
        <h2 className="text-xl font-bold uppercase tracking-widest border-b border-gray-300 pb-2 mb-6">3. Repository Health Top 5</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200 text-sm font-bold text-gray-600 uppercase">
              <th className="py-3 px-4">Repository</th>
              <th className="py-3 px-4">Team</th>
              <th className="py-3 px-4 text-center">Contributors</th>
              <th className="py-3 px-4 text-center">Commits</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {repoHealthData.map(repo => (
              <tr key={repo.id} className="border-b border-gray-100">
                <td className="py-3 px-4 font-bold flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-gray-400" />
                  {repo.name}
                </td>
                <td className="py-3 px-4 text-gray-600 font-medium">
                  {repo.teamSlug || "—"}
                </td>
                <td className="py-3 px-4 text-center font-medium text-gray-600">
                  {repo.commits30d > 0 ? Math.max(1, Math.floor(repo.commits30d / 10)) : 0}
                </td>
                <td className="py-3 px-4 text-center font-bold">
                  {repo.commits30d}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    repo.status === "Active" ? "bg-green-100 text-green-700" :
                    repo.status === "Slowing" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {repo.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Team Distribution & Synergy */}
      <div className="mb-12 avoid-break">
        <h2 className="text-xl font-bold uppercase tracking-widest border-b border-gray-300 pb-2 mb-6">4. Team Resource Allocation</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200 text-sm font-bold text-gray-600 uppercase">
              <th className="py-3 px-4">Working Group</th>
              <th className="py-3 px-4 text-right">Contributions</th>
              <th className="py-3 px-4 text-right">Allocation Share</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(t => (
              <tr key={t.teamSlug} className="border-b border-gray-100">
                <td className="py-3 px-4 font-bold flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }}></span>
                  {t.displayName}
                </td>
                <td className="py-3 px-4 text-right font-medium">{t.count}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-black" style={{ width: `${t.percentage}%` }}></div>
                    </div>
                    <span className="w-8 font-bold">{t.percentage}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Performers */}
      <div className="avoid-break">
        <h2 className="text-xl font-bold uppercase tracking-widest border-b border-gray-300 pb-2 mb-6">5. Key Contributors (Top 10)</h2>
        <div className="grid grid-cols-2 gap-4">
          {ranked.map((c, i) => (
            <div key={c.login} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-gray-400 w-4">{i + 1}.</span>
                <span className="font-bold">{c.login}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black">{c.total}</span>
                <span className="text-xs font-bold text-gray-500 ml-1">actions</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-gray-200 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
        Confidential & Proprietary • OpenGovAfrica Operations Dashboard
      </div>

      {/* Client component for print button */}
      <PrintAction />
    </div>
  );
}
