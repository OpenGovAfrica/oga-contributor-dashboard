"use client";
// src/components/charts/TeamDistributionChart.tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { TeamDistributionSlice } from "@/features/overview/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { PieChart as PieIcon } from "lucide-react";

interface TeamDistributionChartProps {
  data: TeamDistributionSlice[];
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TeamDistributionSlice }>;
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="panel-raised border border-[var(--color-border)] px-3 py-2.5 text-xs shadow-xl">
      <p className="text-[var(--color-text-primary)] font-medium mb-0.5">
        {d.displayName}
      </p>
      <p className="text-[var(--color-text-muted)]">
        {d.count.toLocaleString()} contributions &middot; {d.percentage}%
      </p>
    </div>
  );
};

export function TeamDistributionChart({ data }: TeamDistributionChartProps) {
  if (!data.length) {
    return (
      <EmptyState
        icon={PieIcon}
        title="No distribution data"
        description="No team contributions found in the selected window."
      />
    );
  }

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={54}
            outerRadius={80}
            paddingAngle={3}
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                opacity={0.9}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom legend — data-dense list */}
      <div className="flex-1 space-y-2">
        {data.map((d) => (
          <div key={d.teamSlug} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-xs text-[var(--color-text-muted)] font-mono flex-1 truncate">
              {d.teamSlug}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)] font-medium tabular-nums">
              {d.count.toLocaleString()}
            </span>
            <span className="text-xs text-[var(--color-text-muted)] tabular-nums w-8 text-right">
              {d.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
