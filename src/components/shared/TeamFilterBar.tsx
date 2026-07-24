"use client";
// src/components/shared/TeamFilterBar.tsx
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { TEAM_SLUGS, type TeamSlugOrAll } from "@/lib/zod-schemas";

const ALL_TEAMS: Array<{ slug: TeamSlugOrAll; label: string; color?: string }> = [
  { slug: "all", label: "All Teams" },
  { slug: "wg-dev",        label: "wg-dev",        color: "#6366f1" },
  { slug: "wg-data",       label: "wg-data",        color: "#06b6d4" },
  { slug: "wg-marketing",  label: "wg-marketing",   color: "#f59e0b" },
  { slug: "wg-operations", label: "wg-operations",  color: "#10b981" },
  { slug: "wg-strategy",   label: "wg-strategy",    color: "#f43f5e" },
  { slug: "wg-community",  label: "wg-community",   color: "#ec4899" },
];

interface TeamFilterBarProps {
  className?: string;
}

export function TeamFilterBar({ className }: TeamFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTeam = (searchParams.get("team") ?? "all") as TeamSlugOrAll;

  function handleSelect(slug: TeamSlugOrAll) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") {
      params.delete("team");
    } else {
      params.set("team", slug);
    }
    // Reset to page 1 when filter changes
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {ALL_TEAMS.map((t) => {
        const isActive = t.slug === currentTeam;
        return (
          <button
            key={t.slug}
            id={`team-filter-${t.slug}`}
            onClick={() => handleSelect(t.slug)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
              isActive
                ? (t.slug === "all" ? "text-[var(--color-text-inverse)] border-transparent" : "text-white border-transparent")
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border)]",
            )}
            style={
              isActive
                ? {
                    backgroundColor: t.color ?? "var(--color-brand)",
                    borderColor: t.color ?? "var(--color-brand)",
                  }
                : undefined
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
