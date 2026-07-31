// src/app/(dashboard)/layout.tsx
import { Sidebar } from "@/components/layout/Sidebar";
import { MonitorSmartphone } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Mobile Lock Screen - Visible only on mobile (< 768px) */}
      <div className="md:hidden flex flex-col items-center justify-center min-h-screen bg-[var(--color-canvas)] p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50" />
        <div className="relative z-10 flex flex-col items-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-panel-raised)] border border-[var(--color-border)] shadow-xl flex items-center justify-center mb-8">
            <MonitorSmartphone className="w-8 h-8 text-[var(--color-text-primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3 tracking-tight">
            Designed for Workspace
          </h1>
          <p className="text-[15px] text-[var(--color-text-muted)] leading-relaxed mb-8">
            The OpenGovAfrica Intelligence Dashboard harnesses massive high-fidelity data grids and multi-dimensional analytics that command a larger canvas. Please open this experience on a desktop or tablet.
          </p>
          <div className="h-1 w-12 bg-[var(--color-border)] rounded-full" />
        </div>
      </div>

      {/* Actual Dashboard - Hidden on mobile, visible on md (768px/iPads) and up */}
      <div className="hidden md:flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </>
  );
}
