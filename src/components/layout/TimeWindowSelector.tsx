"use client";
// src/components/layout/TimeWindowSelector.tsx
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { TIME_WINDOWS, type TimeWindow } from "@/lib/zod-schemas";
import { cn } from "@/lib/utils";

const WINDOW_LABELS: Record<TimeWindow, string> = {
  "7d": "7D",
  "30d": "30D",
  "90d": "90D",
};

export function TimeWindowSelector({ currentWindow }: { currentWindow: TimeWindow }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(window: TimeWindow) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("window", window);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center bg-[var(--color-panel)] border border-[var(--color-border)] rounded-lg p-0.5 gap-0.5">
      {TIME_WINDOWS.map((w) => (
        <button
          key={w}
          id={`window-${w}`}
          onClick={() => handleChange(w)}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
            w === currentWindow
              ? "bg-[var(--color-panel-raised)] text-[var(--color-text-primary)] shadow-sm ring-1 ring-[var(--color-border)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-panel-raised)]/50",
          )}
        >
          {WINDOW_LABELS[w]}
        </button>
      ))}
    </div>
  );
}
