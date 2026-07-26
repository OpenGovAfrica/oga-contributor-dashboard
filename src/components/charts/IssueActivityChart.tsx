"use client";
// src/components/charts/IssueActivityChart.tsx
import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { IssueDataPoint } from "@/features/overview/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { AlertCircle } from "lucide-react";

interface IssueActivityChartProps {
  data: IssueDataPoint[];
  viewType?: "bar" | "line";
}

const CustomTooltip = ({ active, payload, label, coordinate, viewBox, containerRef }: any) => {
  if (!active || !payload?.length || !coordinate || !containerRef?.current || typeof document === 'undefined') return null;

  const rect = containerRef.current.getBoundingClientRect();
  const left = rect.left + coordinate.x + (viewBox?.x ?? 0);
  const top = rect.top + coordinate.y + (viewBox?.y ?? 0) - 20;

  return createPortal(
    <div 
      className="fixed px-3 py-2.5 text-xs shadow-2xl text-[var(--color-text-primary)] pointer-events-none z-[9999] transition-all duration-[150ms] ease-out"
      style={{
        left: left,
        top: top,
        transform: 'translate(-50%, -100%)',
        backgroundColor: "rgba(10, 10, 14, 0.32)",
        backdropFilter: "blur(60px) saturate(220%)",
        WebkitBackdropFilter: "blur(60px) saturate(220%)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <p className="text-[var(--color-text-muted)] mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: p.color || p.fill || p.stroke }}
          />
          <span className="capitalize text-[var(--color-text-secondary)]">{p.name}:</span>
          <span className="font-semibold ml-auto pl-4">
            {p.value}
          </span>
        </div>
      ))}
    </div>,
    document.body
  );
};

export function IssueActivityChart({ data, viewType = "bar" }: IssueActivityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!data.length) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="No issues found"
        description="There are no issues opened or closed in the selected time window."
      />
    );
  }

  // Aggregate to weekly if data has >30 points for better visual
  const chartData =
    data.length > 30
      ? aggregateToWeekly(data)
      : data.map((d) => ({
        ...d,
        date: formatDate(d.date),
      }));

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full">
      <div className="flex-1 -ml-4 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === "line" ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.4} />
              <XAxis dataKey="date" tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "var(--color-border)" }} interval="preserveStartEnd" tickMargin={12} />
              <Tooltip content={(props: any) => mounted ? <CustomTooltip {...props} containerRef={containerRef} /> : null} cursor={{ stroke: "var(--color-border)", strokeWidth: 1, strokeDasharray: "4 4" }} />

              <Line type="monotone" dataKey="opened" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="closed" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.4} />
              <XAxis dataKey="date" tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "var(--color-border)" }} interval="preserveStartEnd" tickMargin={12} />
              <Tooltip content={(props: any) => mounted ? <CustomTooltip {...props} containerRef={containerRef} /> : null} cursor={{ fill: "var(--color-panel-raised)" }} />

              <Bar dataKey="opened" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="closed" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function aggregateToWeekly(data: IssueDataPoint[]): Array<any> {
  const weeks = new Map<
    string,
    { opened: number; closed: number }
  >();
  for (const d of data) {
    const date = new Date(d.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    const existing = weeks.get(key) ?? { opened: 0, closed: 0 };
    existing.opened += d.opened;
    existing.closed += d.closed;
    weeks.set(key, existing);
  }
  return Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date: formatDate(date),
      ...counts,
    }));
}
