// src/components/shared/EmptyState.tsx
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-8 text-center",
        className,
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--color-panel-raised)] border border-[var(--color-border)] flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-[var(--color-text-muted)]" />
      </div>
      <p className="text-[var(--color-text-secondary)] font-medium text-sm mb-1">
        {title}
      </p>
      <p className="text-[var(--color-text-muted)] text-xs max-w-[280px] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
