// src/components/layout/Sidebar.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  Users2,
  Network,
  Trophy,
  LineChart,
  Settings,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  {
    href: "/overview",
    label: "Overview",
    icon: LayoutDashboard,
    id: "nav-overview",
  },
  {
    href: "/activity",
    label: "Issue Analytics",
    icon: LineChart,
    id: "nav-analytics",
  },
  {
    href: "/contributors",
    label: "Contributor Leaderboard",
    icon: Trophy,
    id: "nav-contributors",
  },
  {
    href: "/teams",
    label: "Teams",
    icon: Network,
    id: "nav-teams",
  },
  {
    href: "/repositories",
    label: "Repositories",
    icon: FolderGit2,
    id: "nav-repositories",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    id: "nav-settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-[280px] min-h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3.5 px-8 py-8">
        <div className="w-8 h-8 shrink-0 relative rounded-md overflow-hidden bg-[var(--color-panel-raised)] p-1 border border-[var(--color-border)]">
          <Image src="/logo.webp" alt="OGA" fill sizes="32px" className="object-contain p-0.5" />
        </div>
        <p className="text-[var(--color-text-primary)] text-base font-semibold tracking-wide">
          OpenGov Africa
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 py-2 space-y-1.5" role="navigation" aria-label="Main navigation">
        <p className="px-4 text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4 mt-2">
          Main Menu
        </p>
        {NAV.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              id={item.id}
              className={cn(
                "flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-[14px] transition-all duration-150 relative overflow-hidden",
                isActive
                  ? "bg-[var(--color-panel-raised)] text-[var(--color-text-primary)] font-medium border border-[var(--color-border)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-panel)] border border-transparent",
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-brand-light)] rounded-r-sm" />
              )}
              <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-[var(--color-brand-light)]" : "opacity-70")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="px-7 py-5 border-t border-[var(--color-border)] bg-[var(--color-canvas)]">
        <div className="flex items-center gap-3 mb-3">
          <a
            href="https://github.com/OpenGovAfrica"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-panel-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] hover:bg-[var(--color-overlay)] transition-colors shadow-sm"
            title="OGA GitHub"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>
          <a
            href="https://opengovafrica.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-panel-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] hover:bg-[var(--color-overlay)] transition-colors shadow-sm"
            title="OGA Website"
          >
            <Globe className="w-5 h-5" />
          </a>
        </div>
        <p className="text-[11.5px] text-[var(--color-text-muted)] font-medium">
          Made with ❤️ by <span className="text-[var(--color-text-primary)] font-semibold">Rohit</span>
        </p>
      </div>
    </aside>
  );
}
