"use client";
// src/components/charts/LabelDistributionChart.tsx
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import type { LabelDistributionSlice } from "@/features/activity/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tag } from "lucide-react";

interface LabelDistributionChartProps {
  data: LabelDistributionSlice[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="panel-raised border border-[var(--color-border)] px-3 py-2.5 text-xs shadow-xl rounded-md bg-[var(--color-panel)] text-[var(--color-text-primary)]">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: p.payload.color }}
        />
        <span className="capitalize text-[var(--color-text-secondary)] font-medium">
          {p.name}:
        </span>
        <span className="font-semibold ml-auto pl-4">{p.value} issues</span>
      </div>
    </div>
  );
};

export function LabelDistributionChart({ data }: LabelDistributionChartProps) {
  if (!data.length) {
    return (
      <EmptyState
        icon={Tag}
        title="No labels found"
        description="There are no labeled issues in the selected time window."
      />
    );
  }

  return (
    <div className="flex h-[250px] w-full items-center">
      {/* Chart */}
      <div className="flex-1 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="count"
              stroke="var(--color-panel)"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="w-[140px] flex flex-col justify-center gap-2.5 pl-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[var(--color-text-primary)] truncate font-medium">
              {item.name}
            </span>
            <span className="text-[var(--color-text-muted)] ml-auto tabular-nums">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
