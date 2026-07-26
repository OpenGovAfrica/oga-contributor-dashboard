"use client";
// src/components/shared/SearchInput.tsx
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ExternalLink, User, Folder, CircleDot } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SearchResult {
  repos: Array<{ id: string; name: string; nameWithOwner: string }>;
  contributors: Array<{ id: string; githubLogin: string; name: string | null; avatarUrl: string | null }>;
  issues: Array<{ id: string; title: string; githubNumber: number; repository: { name: string } }>;
}

export function SearchInput({ placeholder = "Search repos, users, issues...", className }: { placeholder?: string; className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // If clicking inside the container, do nothing
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        return;
      }
      
      // If clicking inside the portal dropdown, do nothing
      const target = e.target as HTMLElement;
      if (target.closest('.search-dropdown-portal')) {
        return;
      }

      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update dropdown position
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 350),
      });
    }
  }, [isOpen, results]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Flatten results for keyboard navigation
  const flatResults: any[] = [];
  if (results) {
    results.repos.forEach(r => flatResults.push({ type: 'repo', data: r }));
    results.contributors.forEach(c => flatResults.push({ type: 'user', data: c }));
    results.issues.forEach(i => flatResults.push({ type: 'issue', data: i }));
  }

  const handleSelect = (item: any) => {
    setIsOpen(false);
    setQuery("");

    if (item.type === 'repo') {
      router.push(`/repositories?search=${encodeURIComponent(item.data.name)}`);
    } else if (item.type === 'user') {
      router.push(`/contributors?search=${encodeURIComponent(item.data.githubLogin)}`);
    } else if (item.type === 'issue') {
      // For now, since we don't have an internal issue page, link out to GitHub
      window.open(`https://github.com/OpenGovAfrica/${item.data.repository.name}/issues/${item.data.githubNumber}`, "_blank");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || flatResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(flatResults[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative flex items-center", className)}>
      <Search className="absolute left-3 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
        onKeyDown={handleKeyDown}
        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-md pl-9 pr-3 py-1.5 focus:outline-none focus:border-[var(--color-text-muted)] transition-colors placeholder:text-[var(--color-text-muted)]"
      />

      {isLoading && (
        <div className="absolute right-3 w-3 h-3 rounded-full border-2 border-[var(--color-text-muted)] border-t-transparent animate-spin" />
      )}

      {mounted && isOpen && flatResults.length > 0 && typeof document !== 'undefined' && createPortal(
        <div 
          className="search-dropdown-portal ios-glass rounded-md shadow-2xl overflow-hidden z-[9999]"
          style={dropdownStyle}
        >
          <div className="max-h-[400px] overflow-y-auto py-2">
            
            {results?.repos.length! > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Repositories</div>
                {results?.repos.map((repo) => {
                  const idx = flatResults.findIndex(r => r.data.id === repo.id);
                  return (
                    <div
                      key={repo.id}
                      onClick={() => handleSelect({ type: 'repo', data: repo })}
                      className={cn(
                        "px-3 py-2 flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-primary)]",
                        selectedIndex === idx ? "bg-[var(--color-overlay)]" : "hover:bg-white/10"
                      )}
                    >
                      <Folder className="w-4 h-4 text-[var(--color-text-muted)]" />
                      <span className="truncate">{repo.name}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {results?.contributors.length! > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Contributors</div>
                {results?.contributors.map((user) => {
                  const idx = flatResults.findIndex(r => r.data.id === user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleSelect({ type: 'user', data: user })}
                      className={cn(
                        "px-3 py-2 flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-primary)]",
                        selectedIndex === idx ? "bg-[var(--color-overlay)]" : "hover:bg-white/10"
                      )}
                    >
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-4 h-4 rounded-full" />
                      ) : (
                        <User className="w-4 h-4 text-[var(--color-text-muted)]" />
                      )}
                      <span className="truncate">{user.name || user.githubLogin}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">@{user.githubLogin}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {results?.issues.length! > 0 && (
              <div>
                <div className="px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Issues</div>
                {results?.issues.map((issue) => {
                  const idx = flatResults.findIndex(r => r.data.id === issue.id);
                  return (
                    <div
                      key={issue.id}
                      onClick={() => handleSelect({ type: 'issue', data: issue })}
                      className={cn(
                        "px-3 py-2 flex flex-col cursor-pointer text-sm",
                        selectedIndex === idx ? "bg-[var(--color-overlay)]" : "hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                        <CircleDot className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                        <span className="truncate">{issue.title}</span>
                      </div>
                      <div className="flex items-center gap-1 pl-6 text-xs text-[var(--color-text-muted)] mt-0.5">
                        <span>{issue.repository.name}</span>
                        <span>#{issue.githubNumber}</span>
                        <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
