import type { Metadata } from "next";
import { Suspense } from "react";
import { Users, FolderGit2, GitCommit, Trophy, ExternalLink } from "lucide-react";
import Image from "next/image";
import { Topbar } from "@/components/layout/Topbar";
import { MetricCard } from "@/components/cards/MetricCard";
import { MetricCardSkeleton } from "@/components/shared/LoadingSkeleton";
import { TimeWindowSchema } from "@/lib/zod-schemas";
import { getTeams, getTeamKPIs, getTeamActivityTrend, getTeamTopContributors, getTeamSynergy } from "@/features/teams/queries";
import { formatNumber } from "@/lib/utils";
import { TeamSelector } from "./TeamSelector";
import { SynergyChart } from "@/components/charts/SynergyChart";

export const metadata: Metadata = {
  title: "Teams Analytics",
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function TeamsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { window } = TimeWindowSchema.parse(params);
  
  const teams = await getTeams();
  const teamSlug = params.team || (teams.length > 0 ? teams[0].slug : "wg-dev");

  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title="Teams Analytics"
        subtitle="Deep dive into working group performance"
        currentWindow={window}
      />

      <div className="flex-1 p-6 space-y-6 animate-fade-in max-w-[1400px]">
        
        <div className="flex items-center gap-4 border-b border-[var(--color-border)] pb-4">
          <TeamSelector teams={teams} currentTeam={teamSlug} />
        </div>

        <Suspense fallback={<div className="grid grid-cols-3 gap-4">{Array.from({length:3}).map((_,i)=><MetricCardSkeleton key={i} />)}</div>}>
          <TeamKPISection teamSlug={teamSlug} window={window} />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="panel overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" /> Top Team Members
              </h3>
            </div>
            <Suspense fallback={<div className="h-[300px] skeleton" />}>
              <TeamMembersList teamSlug={teamSlug} window={window} />
            </Suspense>
          </div>

          <Suspense fallback={<div className="panel h-[400px] skeleton" />}>
            <TeamSynergySection teamSlug={teamSlug} window={window} />
          </Suspense>
        </div>

      </div>
    </div>
  );
}

async function TeamKPISection({ teamSlug, window }: { teamSlug: string; window: import("@/lib/zod-schemas").TimeWindow }) {
  const kpis = await getTeamKPIs(teamSlug, window);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard
        id="team-contributors"
        title="TEAM CONTRIBUTORS"
        value={formatNumber(kpis.totalContributors)}
        icon={Users}
      />
      <MetricCard
        id="team-repos"
        title="ACTIVE REPOSITORIES"
        value={kpis.activeRepositories}
        icon={FolderGit2}
      />
      <MetricCard
        id="team-commits"
        title="TOTAL COMMITS"
        value={formatNumber(kpis.commits)}
        icon={GitCommit}
      />
    </div>
  );
}

async function TeamMembersList({ teamSlug, window }: { teamSlug: string; window: import("@/lib/zod-schemas").TimeWindow }) {
  const members = await getTeamTopContributors(teamSlug, window);

  if (members.length === 0) {
    return (
      <div className="p-8 text-center text-[var(--color-text-muted)] text-sm">
        No active contributors in this team for the selected time window.
      </div>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th className="w-12 text-center">Rank</th>
          <th>Contributor</th>
          <th className="text-center">Commits</th>
          <th className="text-center">Total Activity</th>
        </tr>
      </thead>
      <tbody>
        {members.map((member, idx) => (
          <tr key={member.id}>
            <td className="text-center text-xs font-bold text-[var(--color-text-muted)]">#{idx + 1}</td>
            <td>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--color-overlay)] shrink-0">
                  {member.avatarUrl ? (
                    <Image src={member.avatarUrl} alt="" width={32} height={32} className="w-8 h-8 object-cover" unoptimized />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-xs font-bold text-white">
                      {member.githubLogin[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex flex-col items-start">
                  <p className="text-xs font-medium text-[var(--color-text-primary)] truncate max-w-full">
                    {member.name ?? member.githubLogin}
                  </p>
                  <a 
                    href={`https://github.com/${member.githubLogin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-1 text-[11px] text-mono text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors truncate max-w-full"
                    title="View GitHub Profile"
                  >
                    @{member.githubLogin}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              </div>
            </td>
            <td className="text-center tabular-nums text-xs">{member.commits}</td>
            <td className="text-center tabular-nums text-xs font-medium text-[var(--color-text-primary)]">{member.totalCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

async function TeamSynergySection({ teamSlug, window }: { teamSlug: string; window: import("@/lib/zod-schemas").TimeWindow }) {
  const data = await getTeamSynergy(teamSlug, window);
  return <SynergyChart data={data} teamName={teamSlug} />;
}
