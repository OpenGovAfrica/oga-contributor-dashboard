"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SortOption {
  value: string;
  label: string;
}

export function SortTabs({
  current,
  options,
}: {
  current: string;
  options: SortOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", value);
    // Reset to page 1 when sorting changes
    params.delete("page");
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center bg-[var(--color-panel)] border border-[var(--color-border)] rounded-lg p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          id={`sort-${opt.value}`}
          onClick={() => handleSortChange(opt.value)}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all",
            opt.value === current
              ? "bg-[var(--color-brand)] text-[var(--color-text-inverse)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
