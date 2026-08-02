"use client";
// src/components/layout/Topbar.tsx
import { usePathname } from "next/navigation";
import { SearchInput } from "@/components/shared/SearchInput";
import { TimeWindowSelector } from "./TimeWindowSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { RefreshCw, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TimeWindow } from "@/lib/zod-schemas";

interface TopbarProps {
  title: string;
  subtitle?: string;
  currentWindow?: TimeWindow;
  showWindowSelector?: boolean;
}

// Global state to persist syncing status across page navigations
let globalIsSyncing = false;

export function Topbar({
  title,
  subtitle,
  currentWindow = "30d",
  showWindowSelector = true,
}: TopbarProps) {
  const pathname = usePathname();
  const [isSyncing, setIsSyncing] = useState(globalIsSyncing);

  const handleGlobalSync = async () => {
    if (globalIsSyncing) return;
    
    globalIsSyncing = true;
    setIsSyncing(true);
    
    try {
      // keepalive ensures the browser doesn't cancel the request if the user navigates away
      await fetch("/api/sync", { method: "POST", keepalive: true });
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      globalIsSyncing = false;
      setIsSyncing(false);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-xl shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-[var(--color-text-muted)]">OGA Corp</span>
        <span className="text-[var(--color-text-muted)]">›</span>
        <span className="text-[var(--color-text-primary)] font-medium">
          Platform Engineering
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <SearchInput className="w-[300px] hidden md:flex bg-[var(--color-canvas)]" />

        {showWindowSelector && (
          <>
            <div className="h-4 w-px bg-[var(--color-border)] mx-1" />
            <TimeWindowSelector currentWindow={currentWindow} />
          </>
        )}

        <div className="h-4 w-px bg-[var(--color-border)] mx-1" />

        {/* Global Sync Button */}
        <button
          onClick={handleGlobalSync}
          disabled={isSyncing}
          className={cn(
            "flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md transition-all shadow-sm",
            isSyncing
              ? "bg-[var(--color-panel-raised)] text-[var(--color-text-muted)] border border-[var(--color-border)] cursor-not-allowed"
              : "bg-[var(--color-brand)] text-[var(--color-text-inverse)] hover:opacity-90 hover:shadow-md border border-transparent"
          )}
          title="Refresh GitHub Data"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
          {isSyncing ? "Syncing..." : "Refresh Data"}
        </button>

        <div className="h-4 w-px bg-[var(--color-border)] mx-1" />

        <ThemeToggle />
      </div>
    </header>
  );
}
