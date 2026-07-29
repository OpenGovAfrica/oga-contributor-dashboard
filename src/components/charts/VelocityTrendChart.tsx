"use client";
// src/components/charts/VelocityTrendChart.tsx
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { VelocityDataPoint } from "@/features/overview/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { Activity } from "lucide-react";

interface VelocityTrendChartProps {
  data: VelocityDataPoint[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="panel-raised border border-[var(--color-border)] px-3 py-2.5 text-xs shadow-xl">
      <p className="text-[var(--color-text-muted)] mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-[var(--color-text-secondary)] capitalize">
            {p.name}:
          </span>
          <span className="text-[var(--color-text-primary)] font-medium ml-auto pl-4">
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function VelocityTrendChart({ data }: VelocityTrendChartProps) {
  if (!data.length) {
    return (
      <EmptyState
        icon={Activity}
        title="No activity data"
        description="There are no contributions in the selected time window."
      />
    );
  }

  // Aggregate to weekly if data has >60 points for readability
  const chartData =
    data.length > 60
      ? aggregateToWeekly(data)
      : data.map((d) => ({
          ...d,
          date: formatDate(d.date),
        }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
          iconType="circle"
          iconSize={6}
        />
        <Line
          type="monotone"
          dataKey="commits"
          stroke="#6366f1"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 4, fill: "#6366f1" }}
        />
        <Line
          type="monotone"
          dataKey="pullRequests"
          stroke="#06b6d4"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 4, fill: "#06b6d4" }}
          name="pull requests"
        />
        <Line
          type="monotone"
          dataKey="reviews"
          stroke="#f59e0b"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 4, fill: "#f59e0b" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function aggregateToWeekly(data: VelocityDataPoint[]): Array<{
  date: string;
  commits: number;
  pullRequests: number;
  reviews: number;
}> {
  const weeks = new Map<
    string,
    { commits: number; pullRequests: number; reviews: number }
  >();
  for (const d of data) {
    const date = new Date(d.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    const existing = weeks.get(key) ?? { commits: 0, pullRequests: 0, reviews: 0 };
    existing.commits += d.commits;
    existing.pullRequests += d.pullRequests;
    existing.reviews += d.reviews;
    weeks.set(key, existing);
  }
  return Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date: formatDate(date),
      ...counts,
    }));
}
