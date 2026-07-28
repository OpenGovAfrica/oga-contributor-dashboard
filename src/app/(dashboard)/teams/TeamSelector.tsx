"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Team {
  slug: string;
  displayName: string;
  color?: string | null;
}

export function TeamSelector({ teams, currentTeam }: { teams: Team[]; currentTeam: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelect(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("team", slug);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {teams.map((t) => {
        const isActive = t.slug === currentTeam;
        return (
          <button
            key={t.slug}
            onClick={() => handleSelect(t.slug)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150",
              isActive
                ? "text-white border-transparent"
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
            {t.displayName}
          </button>
        );
      })}
    </div>
  );
}
