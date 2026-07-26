"use client";
// src/components/charts/MiniSparkline.tsx
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  type?: "line" | "bar"; // Added bar support
}

export function MiniSparkline({
  data,
  color = "#ffffff", // Default to white for the dark theme cards
  height = 36,
  type = "bar",
}: MiniSparklineProps) {
  if (!data.length || data.every((v) => v === 0)) {
    return (
      <div
        className="w-full border-b border-dashed border-[var(--color-border)]"
        style={{ height: `${height}px` }}
      />
    );
  }

  const chartData = data.map((value, i) => ({ i, value }));
  const max = Math.max(...data);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={1}>
        <Bar dataKey="value" isAnimationActive={false} radius={[1, 1, 0, 0]}>
          {chartData.map((entry, index) => {
            // Make the last bar solid, others slightly transparent matching the design
            const isLast = index === chartData.length - 1;
            return <Cell key={`cell-${index}`} fill={color} opacity={isLast ? 1 : 0.6} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
