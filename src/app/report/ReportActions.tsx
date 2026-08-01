"use client";

import { useState, useRef, useEffect } from "react";
import { Printer, Sparkles, ChevronDown, CheckCircle2, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportDataPayload {
  timeWindow: string;
  activeContributors: number;
  totalCommits: number;
  prsOpened: number;
  prsMerged: number;
  issuesOpened: number;
  issuesClosed: number;
  activeRepos: number;
  topContributors: { login: string; commits: number; total: number }[];
}

interface ReportActionsProps {
  data: ReportDataPayload;
}

export function ReportActions({ data }: ReportActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const generatePrompt = () => {
    return `Act as a Staff-level Engineering Manager analyzing the OpenGovAfrica organization. Here is the exact timeline report for the last ${data.timeWindow}:

### Core KPIs
- Active Contributors: ${data.activeContributors}
- Total Commits: ${data.totalCommits}
- PRs Opened / Merged: ${data.prsOpened} / ${data.prsMerged}
- Issues Opened / Closed: ${data.issuesOpened} / ${data.issuesClosed}
- Active Repositories: ${data.activeRepos}

### Top Contributors
${data.topContributors.map((c, i) => `${i + 1}. ${c.login} (${c.total} contributions, ${c.commits} commits)`).join('\n')}

Based on this data, what are your immediate takeaways regarding our engineering velocity, bottlenecks, and contributor health?`;
  };

  const handleShareToLLM = (platform: 'chatgpt' | 'perplexity' | 'claude') => {
    setIsOpen(false);
    const prompt = generatePrompt();

    if (platform === 'claude') {
      // Claude doesn't support ?q= reliably, so we use clipboard + manual paste
      navigator.clipboard.writeText(prompt);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 3000);
      window.open('https://claude.ai/new', '_blank');
    } else if (platform === 'chatgpt') {
      const url = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
      window.open(url, '_blank');
    } else if (platform === 'perplexity') {
      const url = `https://www.perplexity.ai/?q=${encodeURIComponent(prompt)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 print:hidden">
      
      {/* Success Toast */}
      <div className={cn(
        "absolute right-0 bottom-[120%] bg-[var(--color-panel-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
        showCopied ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        Data copied! Please paste into Claude.
      </div>

      {/* Share to AI Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] hover:border-[var(--color-brand)] text-[var(--color-text-primary)] px-5 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Sparkles className="w-4 h-4 text-[var(--color-brand)]" />
          Share to AI
          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] ml-1" />
        </button>

        {isOpen && (
          <div className="absolute bottom-[120%] right-0 mb-2 w-56 bg-[var(--color-panel)] backdrop-blur-xl border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Analyze with LLM</span>
            </div>
            <div className="p-1 flex flex-col gap-1">
              <button onClick={() => handleShareToLLM('chatgpt')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-panel-raised)] text-[14px] text-left text-[var(--color-text-primary)] transition-colors">
                <MessageSquareText className="w-4 h-4 opacity-70" />
                ChatGPT (Auto-fill)
              </button>
              <button onClick={() => handleShareToLLM('perplexity')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-panel-raised)] text-[14px] text-left text-[var(--color-text-primary)] transition-colors">
                <MessageSquareText className="w-4 h-4 opacity-70" />
                Perplexity (Auto-fill)
              </button>
              <button onClick={() => handleShareToLLM('claude')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-panel-raised)] text-[14px] text-left text-[var(--color-text-primary)] transition-colors">
                <MessageSquareText className="w-4 h-4 opacity-70" />
                Claude (Copy + Paste)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Print Button */}
      <button 
        onClick={() => window.print()}
        className="flex items-center gap-2 bg-[var(--color-text-primary)] text-[var(--color-canvas)] hover:opacity-90 px-5 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <Printer className="w-4 h-4" /> Save as PDF
      </button>

    </div>
  );
}
