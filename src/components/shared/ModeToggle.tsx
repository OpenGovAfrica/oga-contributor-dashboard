"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageSquare, Code2 } from "lucide-react";

export function ModeToggle({ current }: { current: "civic" | "code" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setMode = (mode: "civic" | "code") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", mode);
    // Reset to page 1
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] p-1 rounded-xl shadow-sm self-start mb-6 w-full max-w-sm mx-auto md:mx-0">
      <button
        onClick={() => setMode("civic")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200",
          current === "civic"
            ? "bg-[var(--color-brand)] text-[var(--color-text-inverse)] shadow-md"
            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-panel-raised)]"
        )}
      >
        <MessageSquare className="w-4 h-4" />
        Civic Impact
      </button>
      <button
        onClick={() => setMode("code")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200",
          current === "code"
            ? "bg-[#10b981] text-white shadow-md"
            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-panel-raised)]"
        )}
      >
        <Code2 className="w-4 h-4" />
        Code Impact
      </button>
    </div>
  );
}
