"use client";
// src/components/charts/IssueAgingChart.tsx
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import type { IssueAgingBucket } from "@/features/activity/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { Clock } from "lucide-react";

interface IssueAgingChartProps {
  data: IssueAgingBucket[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="panel-raised border border-[var(--color-border)] px-3 py-2.5 text-xs shadow-xl rounded-md bg-[var(--color-panel)] text-[var(--color-text-primary)]">
      <div className="flex items-center gap-2 mb-1">
        <span className="capitalize text-[var(--color-text-secondary)] font-medium">
          {p.payload.label}:
        </span>
        <span className="font-semibold ml-auto pl-4">{p.value} issues</span>
      </div>
    </div>
  );
};

export function IssueAgingChart({ data }: IssueAgingChartProps) {
  if (!data.length || data.every(d => d.count === 0)) {
    return (
      <EmptyState
        icon={Clock}
        title="No open issues"
        description="There are currently no open issues to track for aging."
      />
    );
  }

  // Determine colors based on urgency (older = red)
  const getBarColor = (label: string) => {
    switch (label) {
      case "< 7 days": return "#10b981"; // success green
      case "7–14 days": return "#3b82f6"; // blue
      case "15–30 days": return "#f59e0b"; // warning orange
      case "30+ days": return "#ef4444"; // danger red
      default: return "#64748b";
    }
  };

  return (
    <div className="flex flex-col h-[250px] w-full">
      <div className="flex-1 -ml-4 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} opacity={0.4} />
            <XAxis type="number" tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "var(--color-border)" }} />
            <YAxis dataKey="label" type="category" tick={{ fill: "var(--color-text-primary)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-panel-raised)" }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.label)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
