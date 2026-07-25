"use client";
// src/components/charts/ActivityTabsSection.tsx
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { VelocityDataPoint, IssueDataPoint } from "@/features/overview/types";
import { PlatformActivityChart } from "./PlatformActivityChart";
import { IssueActivityChart } from "./IssueActivityChart";
import { Code2, CircleDot, BarChart2, LineChart } from "lucide-react";

interface ActivityTabsSectionProps {
  velocityData: VelocityDataPoint[];
  issueData: IssueDataPoint[];
}

export function ActivityTabsSection({ velocityData, issueData }: ActivityTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<"code" | "issues">("code");
  const [viewType, setViewType] = useState<"bar" | "line">("bar");

  return (
    <div className="flex flex-col h-[350px]">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)] w-fit">
          <button
            onClick={() => setActiveTab("code")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              activeTab === "code"
                ? "bg-[var(--color-panel-raised)] text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            )}
          >
            <Code2 className="w-3.5 h-3.5" />
            Code Activity
          </button>
          <button
            onClick={() => setActiveTab("issues")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              activeTab === "issues"
                ? "bg-[var(--color-panel-raised)] text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            )}
          >
            <CircleDot className="w-3.5 h-3.5" />
            Issue Analytics
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6">
          {/* Dynamic Legend */}
          {activeTab === "code" ? (
            <div className="flex items-center gap-4 text-xs animate-fade-in">
              <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]" />
                Commits
              </div>
              <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                PRs
              </div>
              <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                Reviews
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-xs animate-fade-in">
              <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                Issues Opened
              </div>
              <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                Issues Closed
              </div>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)] ml-auto sm:ml-0">
            <button
              onClick={() => setViewType("bar")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewType === "bar"
                  ? "bg-[var(--color-panel-raised)] text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              )}
              title="Bar Chart View"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewType("line")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewType === "line"
                  ? "bg-[var(--color-panel-raised)] text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              )}
              title="Trend Line View"
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 relative">
        {activeTab === "code" ? (
          <div className="absolute inset-0 animate-fade-in">
            <PlatformActivityChart data={velocityData} viewType={viewType} />
          </div>
        ) : (
          <div className="absolute inset-0 animate-fade-in">
            <IssueActivityChart data={issueData} viewType={viewType} />
          </div>
        )}
      </div>
    </div>
  );
}
