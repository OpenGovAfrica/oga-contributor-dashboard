// src/components/cards/MetricCard.tsx
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  inverse?: boolean; // For open issues — higher delta is bad
  className?: string;
  id?: string;
  children?: React.ReactNode; // For the right-side chart
}

export function MetricCard({
  title,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  inverse = false,
  className,
  id,
  children,
}: MetricCardProps) {
  const hasDelta = delta !== undefined && delta !== null;
  const isPositive = hasDelta && (inverse ? delta < 0 : delta > 0);
  const isNegative = hasDelta && (inverse ? delta > 0 : delta < 0);
  
  // Custom colors matching the design exactly
  const deltaColor = isPositive
    ? "text-[var(--color-active)]"
    : isNegative
      ? "text-[var(--color-stalled)]"
      : "text-[var(--color-text-muted)]";

  const DeltaIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <div id={id} className={cn("panel p-4 flex flex-col justify-between h-[96px] relative overflow-hidden group", className)}>
      {/* Top row: Label & Icon */}
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
          {title}
        </p>
        <Icon className="w-4 h-4 text-[var(--color-text-muted)] opacity-70 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Middle/Bottom Layout */}
      <div className="flex items-end justify-between mt-auto">
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-semibold text-[var(--color-text-primary)] leading-none tabular-nums tracking-tight">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          
          {hasDelta && (
            <div className={cn("flex items-center gap-1 text-[11px] font-medium mt-1", deltaColor)}>
              <DeltaIcon className="w-3 h-3" />
              <span>
                {delta > 0 ? "+" : ""}
                {delta}% {deltaLabel && <span className="font-normal opacity-80">{deltaLabel}</span>}
              </span>
            </div>
          )}
        </div>

        {/* Right side chart area */}
        {children && (
          <div className="absolute bottom-4 right-4 h-[36px] w-[60px] flex items-end justify-end">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
