"use client";
// src/components/charts/ActivityFunnelChart.tsx
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { IssueTrendPoint } from "@/features/activity/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { BarChart2 } from "lucide-react";

interface ActivityFunnelChartProps {
  trend: IssueTrendPoint[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string; stroke?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="panel-raised border border-[var(--color-border)] px-3 py-2.5 text-xs shadow-xl">
      <p className="text-[var(--color-text-muted)] mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: p.stroke || p.fill }} />
          <span className="text-[var(--color-text-secondary)] capitalize">
            {p.name === "backlogSize" ? "Net Backlog" : p.name}:
          </span>
          <span className="text-[var(--color-text-primary)] font-medium ml-auto pl-4 tabular-nums">
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function ActivityFunnelChart({ trend }: ActivityFunnelChartProps) {
  if (!trend.length) {
    return (
      <EmptyState
        icon={BarChart2}
        title="No activity data"
        description="No issues were opened or closed in the selected time window."
      />
    );
  }

  const chartData = trend.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        barGap={2}
        barCategoryGap="30%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
          opacity={0.5}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-panel-raised)", opacity: 0.4 }} />
        <Legend
          wrapperStyle={{ fontSize: "11px", paddingTop: "16px" }}
          iconType="square"
          iconSize={8}
          formatter={(value) => (value === "backlogSize" ? "Net Backlog Growth" : value)}
        />
        <Bar yAxisId="left" dataKey="opened" fill="#f59e0b" radius={[2, 2, 0, 0]} />
        <Bar yAxisId="left" dataKey="closed" fill="#10b981" radius={[2, 2, 0, 0]} />
        <Line 
          yAxisId="right" 
          type="monotone" 
          dataKey="backlogSize" 
          stroke="#ef4444" 
          strokeWidth={2}
          dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
