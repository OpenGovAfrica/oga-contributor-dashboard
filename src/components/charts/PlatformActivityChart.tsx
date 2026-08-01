"use client";
// src/components/charts/PlatformActivityChart.tsx
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
import type { VelocityDataPoint } from "@/features/overview/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { Activity } from "lucide-react";

interface PlatformActivityChartProps {
  data: VelocityDataPoint[];
  viewType?: "bar" | "line";
}

const CustomTooltip = ({ active, payload, label, coordinate, viewBox, containerRef }: any) => {
  if (!active || !payload?.length || !coordinate || !containerRef?.current || typeof document === 'undefined') return null;

  const rect = containerRef.current.getBoundingClientRect();
  const left = rect.left + coordinate.x + (viewBox?.x ?? 0);
  const top = rect.top + coordinate.y + (viewBox?.y ?? 0) - 20;

  return createPortal(
    <div 
      className="fixed px-3 py-2.5 text-xs text-[var(--color-text-primary)] pointer-events-none z-[9999] transition-all duration-[150ms] ease-out shadow-2xl rounded-xl"
      style={{
        left: left,
        top: top,
        transform: 'translate(-50%, -100%)',
        backgroundColor: 'var(--color-surface)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        border: '1px solid var(--color-border)',
      }}
    >
      <p className="text-[var(--color-text-muted)] mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: p.color || p.fill || p.stroke }}
          />
          <span className="capitalize text-[var(--color-text-secondary)]">
            {p.name === 'pullRequests' ? 'Pull Requests' : p.name}:
          </span>
          <span className="font-semibold ml-auto pl-4">
            {p.value}
          </span>
        </div>
      ))}
    </div>,
    document.body
  );
};

export function PlatformActivityChart({ data, viewType = "bar" }: PlatformActivityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!data.length) {
    return (
      <EmptyState
        icon={Activity}
        title="No activity data"
        description="There are no contributions in the selected time window."
      />
    );
  }

  // Use daily data straight from the backend which is now pre-filled
  const chartData = data.map((d) => ({
    ...d,
    date: formatDate(d.date),
  }));

  // Calculate dynamic bar size based on data density
  const dynamicBarSize = data.length > 30 ? 6 : 16;

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full">
      <div className="flex-1 -ml-4 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === "line" ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.4} />
              <XAxis dataKey="date" tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "var(--color-border)" }} interval="preserveStartEnd" tickMargin={12} />
              <Tooltip content={(props: any) => mounted ? <CustomTooltip {...props} containerRef={containerRef} /> : null} cursor={{ stroke: "var(--color-border)", strokeWidth: 1, strokeDasharray: "4 4" }} />

              <Line type="monotone" dataKey="commits" stroke="#1e3a8a" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="pullRequests" stroke="#2563eb" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="reviews" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={dynamicBarSize}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.4} />
              <XAxis dataKey="date" tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "var(--color-border)" }} interval="preserveStartEnd" tickMargin={12} />
              <Tooltip content={(props: any) => mounted ? <CustomTooltip {...props} containerRef={containerRef} /> : null} cursor={{ fill: "var(--color-panel-raised)" }} />

              <Bar dataKey="commits" stackId="a" fill="#1e3a8a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pullRequests" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
              <Bar dataKey="reviews" stackId="a" fill="#3b82f6" radius={[2, 2, 0, 0]} />
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


