// src/components/charts/SynergyChart.tsx
import { Network, ArrowRight } from "lucide-react";
import { TeamBadge } from "@/components/shared/TeamBadge";

interface SynergyProps {
  data: {
    internalCount: number;
    externalCount: number;
    totalCount: number;
    internalPercentage: number;
    topExternalTeams: { slug: string; name: string; count: number; color: string }[];
  };
  teamName: string;
}

export function SynergyChart({ data, teamName }: SynergyProps) {
  if (data.totalCount === 0) {
    return (
      <div className="panel p-5 h-full flex flex-col justify-center items-center text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--color-panel-raised)] flex items-center justify-center mb-3 border border-[var(--color-border)]">
          <Network className="w-5 h-5 text-[var(--color-text-muted)]" />
        </div>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">No synergy data yet</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          This team has no contributions in the selected window.
        </p>
      </div>
    );
  }

  const externalPercentage = 100 - data.internalPercentage;
  const isHealthy = externalPercentage > 15; // >15% cross-team is good!

  return (
    <div className="panel overflow-hidden flex flex-col h-full relative">
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
          <Network className="w-4 h-4 text-purple-500" /> Silo Index & Synergy
        </h3>
        {isHealthy ? (
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
            Highly Collaborative
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
            Siloed Focus
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col gap-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Internal Operations</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">{data.internalPercentage}%</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Cross-Team Synergy</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">{externalPercentage}%</p>
            </div>
          </div>
          
          <div className="h-3 w-full bg-[var(--color-panel-raised)] rounded-full overflow-hidden flex ring-1 ring-inset ring-[var(--color-border)]">
            <div 
              className="h-full bg-[var(--color-brand)] transition-all duration-1000" 
              style={{ width: `${data.internalPercentage}%` }}
            />
            <div 
              className="h-full bg-purple-500 transition-all duration-1000" 
              style={{ width: `${externalPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-2 flex justify-between">
            <span>{data.internalCount.toLocaleString()} internal contributions</span>
            <span>{data.externalCount.toLocaleString()} external contributions</span>
          </p>
        </div>

        {data.externalCount > 0 && (
          <div className="mt-8 pt-6 border-t border-dashed border-[var(--color-border)]">
            <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              Top Collaborative Partners
            </p>
            <div className="space-y-2.5">
              {data.topExternalTeams.map((team, idx) => (
                <div key={team.slug} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)] w-3">{idx + 1}.</span>
                    <TeamBadge slug={team.slug} displayName={team.name} color={team.color} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-[var(--color-panel-raised)] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-purple-500/50 group-hover:bg-purple-500 transition-colors"
                        style={{ width: `${Math.max(5, (team.count / data.externalCount) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[var(--color-text-primary)] tabular-nums w-8 text-right">
                      {team.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
