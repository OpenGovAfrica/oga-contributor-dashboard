// src/components/shared/StatusBadge.tsx
import type { RepoStatus } from "@/features/repositories/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: RepoStatus | "Healthy" | "Degraded";
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; dot: string; badge: string }
> = {
  Active: { label: "Active", dot: "bg-[var(--color-active)]", badge: "badge-active" },
  Slowing: { label: "Slowing", dot: "bg-[var(--color-slowing)]", badge: "badge-slowing" },
  Stalled: { label: "Stalled", dot: "bg-[var(--color-stalled)]", badge: "badge-stalled" },
  Healthy: { label: "Healthy", dot: "bg-[var(--color-active)]", badge: "badge-active" },
  Degraded: { label: "Degraded", dot: "bg-[var(--color-slowing)]", badge: "badge-slowing" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        config.badge,
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
