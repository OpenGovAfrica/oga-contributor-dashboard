// src/components/shared/LoadingSkeleton.tsx

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = "", width, height }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="panel p-5 space-y-3">
      <Skeleton height="12px" width="40%" />
      <Skeleton height="28px" width="55%" />
      <Skeleton height="10px" width="30%" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton height="14px" width={`${60 + Math.random() * 30}%`} />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton({ height = "240px" }: { height?: string }) {
  return (
    <div className="panel p-5">
      <Skeleton height="16px" width="30%" className="mb-4" />
      <Skeleton height={height} width="100%" className="rounded-lg" />
    </div>
  );
}

export function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-[var(--color-border-light)]">
      <Skeleton height="14px" width="24px" />
      <Skeleton className="rounded-full" height="32px" width="32px" />
      <div className="flex-1 space-y-1.5">
        <Skeleton height="12px" width="140px" />
        <Skeleton height="10px" width="90px" />
      </div>
      <Skeleton height="12px" width="60px" />
      <Skeleton height="12px" width="40px" />
      <Skeleton height="12px" width="40px" />
      <Skeleton height="24px" width="80px" />
    </div>
  );
}
