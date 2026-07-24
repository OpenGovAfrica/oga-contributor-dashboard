"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface SortOption {
  value: string;
  label: string;
}

export function SortSelector({
  current,
  options,
}: {
  current: string;
  options: SortOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", e.target.value);
    // Reset to page 1 when sorting changes
    params.delete("page");
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      id="repo-sort"
      value={current}
      onChange={handleSortChange}
      className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-md px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-brand)] cursor-pointer hover:bg-[var(--color-panel-raised)] transition-colors"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
