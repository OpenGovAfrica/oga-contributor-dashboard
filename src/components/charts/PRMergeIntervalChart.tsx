"use client";
// src/components/charts/PRMergeIntervalChart.tsx
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import type { PRIntervalBucket } from "@/features/activity/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { GitMerge } from "lucide-react";

interface PRMergeIntervalChartProps {
  data: PRIntervalBucket[];
}

// Color-code buckets by speed: fast → green, moderate → yellow, slow → red
const BUCKET_COLORS = ["#22c55e", "#4ade80", "#f59e0b", "#fb923c", "#ef4444"];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PRIntervalBucket }>;
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="panel-raised border border-[var(--color-border)] px-3 py-2.5 text-xs shadow-xl">
      <p className="text-[var(--color-text-primary)] font-medium mb-0.5">{d.label}</p>
      <p className="text-[var(--color-text-muted)]">
        {d.count} PRs &middot; {d.percentage}% of total
      </p>
    </div>
  );
};

export function PRMergeIntervalChart({ data }: PRMergeIntervalChartProps) {
  if (!data.length || data.every((d) => d.count === 0)) {
    return (
      <EmptyState
        icon={GitMerge}
        title="No merged PRs"
        description="No pull requests were merged in the selected time window."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={72}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[0, 3, 3, 0]} label={{ position: "right", fontSize: 11, fill: "var(--color-text-muted)" }}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={BUCKET_COLORS[index]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
