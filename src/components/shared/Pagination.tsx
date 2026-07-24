"use client";
// src/components/shared/Pagination.tsx
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export function Pagination({
  page: currentPage,
  totalPages,
  total,
  limit,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)]">
      <span className="text-small text-[var(--color-text-muted)]">
        Showing <span className="text-[var(--color-text-secondary)]">{start}–{end}</span> of{" "}
        <span className="text-[var(--color-text-secondary)]">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <button
          id="pagination-prev"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(
            "p-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors",
            currentPage <= 1
              ? "opacity-40 cursor-not-allowed"
              : "hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]",
          )}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="px-3 text-xs text-[var(--color-text-secondary)]">
          {currentPage} / {totalPages}
        </span>
        <button
          id="pagination-next"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn(
            "p-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors",
            currentPage >= totalPages
              ? "opacity-40 cursor-not-allowed"
              : "hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]",
          )}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
