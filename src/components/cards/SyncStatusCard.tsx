"use client";
// src/components/cards/SyncStatusCard.tsx
import { useState, useEffect } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export function SyncStatusCard() {
  const [state, setState] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch initial state
  useEffect(() => {
    fetch("/api/sync")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.state) {
          setState(data.state);
        }
      })
      .catch(console.error);
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.success && data.state) {
        setState(data.state);
      } else {
        console.error("Sync failed:", data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const isHealthy = state ? (state.rateLimitTotal - state.rateLimitUsed > 100) : true;
  const timeAgo = state?.lastSyncAt
    ? formatDistanceToNow(new Date(state.lastSyncAt), { addSuffix: true })
    : "Never";

  return (
    <div className="panel p-4 flex flex-col justify-between h-[150px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
          <Activity className="w-4 h-4 text-[var(--color-text-muted)]" />
          <span className="text-sm font-medium">GitHub Sync</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium bg-[var(--color-panel-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-overlay)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
            {isSyncing ? "Syncing..." : "Refresh Data"}
          </button>
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium border",
              isHealthy
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-red-500/10 text-red-500 border-red-500/20"
            )}
          >
            {isHealthy ? "Healthy" : "Degraded"}
          </span>
        </div>
      </div>

      <div className="space-y-2.5 mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--color-text-muted)]">Last Sync</span>
          <span className="text-[var(--color-text-primary)] font-medium">{timeAgo}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--color-text-muted)]">API Rate Limit</span>
          <span className="text-[var(--color-text-primary)] font-medium tabular-nums">
            {state ? `${state.rateLimitTotal - state.rateLimitUsed} / ${state.rateLimitTotal}` : "---"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--color-text-muted)]">Avg Latency</span>
          <span className="text-[var(--color-text-primary)] font-medium tabular-nums">
            {state?.lastSyncLatencyMs ? `${state.lastSyncLatencyMs}ms` : "---"}
          </span>
        </div>
      </div>
    </div>
  );
}
