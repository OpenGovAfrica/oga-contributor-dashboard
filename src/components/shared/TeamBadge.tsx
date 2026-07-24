// src/components/shared/TeamBadge.tsx
import { cn } from "@/lib/utils";

interface TeamBadgeProps {
  slug: string;
  displayName: string;
  color?: string | null;
  className?: string;
  size?: "sm" | "md";
}

export function TeamBadge({
  slug,
  displayName,
  color,
  className,
  size = "sm",
}: TeamBadgeProps) {
  const hex = color ?? "#6366f1";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium border",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
        className,
      )}
      style={{
        backgroundColor: `${hex}1a`,
        borderColor: `${hex}40`,
        color: hex,
      }}
      title={displayName}
    >
      {slug}
    </span>
  );
}
