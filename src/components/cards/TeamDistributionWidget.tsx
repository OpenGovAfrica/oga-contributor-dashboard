// src/components/cards/TeamDistributionWidget.tsx
import { cn } from "@/lib/utils";

interface TeamDistProps {
  data: {
    teamSlug: string;
    percentage: number;
    color?: string;
  }[];
}

export function TeamDistributionWidget({ data }: TeamDistProps) {
  // If no data provided (or dummy data mode), use defaults matching the design
  const teams = data && data.length > 0 ? data : [
    { teamSlug: "wg-dev", percentage: 42, color: "#ffffff" },
    { teamSlug: "wg-data", percentage: 28, color: "#a1a1aa" },
    { teamSlug: "wg-strategy", percentage: 15, color: "#71717a" },
  ];

  return (
    <div className="panel p-5 flex flex-col h-[200px]">
      <p className="text-sm font-medium text-[var(--color-text-primary)] mb-5">
        Team Distribution
      </p>

      <div className="space-y-4 flex-1">
        {teams.map((t) => (
          <div key={t.teamSlug}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: t.color || "#ffffff" }}
                />
                <span>{t.teamSlug}</span>
              </div>
              <span className="text-[var(--color-text-muted)] font-medium tabular-nums">{t.percentage}%</span>
            </div>
            <div className="h-1 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${t.percentage}%`,
                  backgroundColor: t.color || "#ffffff",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
