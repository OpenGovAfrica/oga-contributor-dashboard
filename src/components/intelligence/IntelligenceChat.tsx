"use client";
// src/components/intelligence/IntelligenceChat.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import {
  Send,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  Users,
  GitPullRequest,
  Flame,
  TrendingUp,
  FileText,
  StopCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ErrorState {
  type: "rate_limit" | "auth_error" | "generation_failed" | "network";
  message: string;
}

const QUICK_ACTIONS = [
  {
    id: "attention",
    icon: Flame,
    label: "What needs immediate attention?",
    prompt:
      "What's the single most concerning pattern in the org right now? Prioritize ruthlessly.",
  },
  {
    id: "meeting",
    icon: BookOpen,
    label: "Draft meeting points",
    prompt:
      "Give me structured talking points for this week's engineering sync. Name repos and contributors.",
  },
  {
    id: "burnout",
    icon: Users,
    label: "Check for burnout signals",
    prompt:
      "Analyze contributor activity and identify anyone showing signs of burnout or disengagement.",
  },
  {
    id: "prs",
    icon: GitPullRequest,
    label: "Review PR bottlenecks",
    prompt:
      "Analyze the merge rate and any PRs that might be stuck. Where is the review bottleneck?",
  },
];

// Styled markdown components (Claude/GPT style)
const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold mt-6 mb-4 text-[var(--color-text-primary)] tracking-tight">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold mt-5 mb-3 text-[var(--color-text-primary)] tracking-tight">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[15px] font-semibold mt-4 mb-2 text-[var(--color-text-primary)]">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 leading-relaxed text-[var(--color-text-primary)] text-[15px] antialiased opacity-90">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--color-text-primary)]">{children}</strong>
  ),
  em: ({ children }) => <em className="italic opacity-80">{children}</em>,
  ul: ({ children }) => <ul className="mb-4 space-y-2 pl-1.5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 space-y-2 list-decimal list-outside pl-5">{children}</ol>,
  li: ({ children }) => (
    <li className="flex gap-3 items-start text-[15px] text-[var(--color-text-primary)] leading-relaxed opacity-90">
      <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-blue-500/80 shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre className="my-4 p-4 rounded-xl bg-[#1e1e1e] border border-white/10 overflow-x-auto text-[13px] shadow-sm">
          <code className="font-mono text-gray-200">{children}</code>
        </pre>
      );
    }
    return (
      <code className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[var(--color-panel-raised)] font-mono text-[13px] text-[var(--color-text-primary)] border border-[var(--color-border)]">
        {children}
      </code>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500/40 pl-4 py-1 my-4 text-[var(--color-text-muted)] italic text-[15px] bg-blue-500/5 rounded-r-lg">
      {children}
</blockquote>
  ),
  hr: () => <hr className="my-6 border-[var(--color-border)]" />,
};

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center py-2 h-6">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-blue-500/60"
          style={{ animation: `bounce 1s ease-in-out ${i * 0.16}s infinite` }}
        />
      ))}
    </div>
  );
}

function RobotAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="shrink-0 relative rounded-full overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-[var(--color-border)] flex items-center justify-center shadow-sm"
      style={{ width: size, height: size, minWidth: size }}
    >
      <div className="relative w-[70%] h-[70%]">
        <Image
          src="/oga-intelligence.png"
          alt="OGA Intelligence"
          fill
          sizes={`${size}px`}
          className="object-contain"
        />
      </div>
    </div>
  );
}

function EmptyState({ onAction }: { onAction: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 pb-20 pt-10 text-center max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Icon */}
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-blue-500/10 to-transparent border border-white/5 flex items-center justify-center shadow-2xl backdrop-blur-md">
          <Image
            src="/oga-intelligence.png"
            alt="OGA Intelligence"
            width={48}
            height={48}
            className="object-contain drop-shadow-xl"
          />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3 tracking-tight">
        How can I help you today?
      </h2>
      <p className="text-[15px] text-[var(--color-text-muted)] max-w-lg leading-relaxed mb-10">
        I am your elite engineering analyst, powered by Groq and Llama 3 70B. I have live access to OpenGovAfrica's entire GitHub footprint.
      </p>

      {/* Quick action grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onAction(action.prompt)}
              className="group flex flex-col items-start gap-3 p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] hover:bg-[var(--color-panel-raised)] hover:border-blue-500/30 transition-all duration-300 text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                <Send className="w-4 h-4 text-blue-500/50" />
              </div>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-blue-500/80" />
                <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                  {action.label}
                </span>
              </div>
              <span className="text-[14px] text-[var(--color-text-muted)] leading-relaxed line-clamp-2 pr-4">
                "{action.prompt}"
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="max-w-[85%] md:max-w-[75%] px-5 py-4 rounded-3xl bg-[var(--color-panel-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}

function AssistantBubble({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  return (
    <div className="flex gap-4 mb-8 items-start animate-in fade-in duration-300 max-w-5xl mx-auto w-full">
      <div className="mt-1">
        <RobotAvatar size={34} />
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="text-[15px] leading-[1.7] text-[var(--color-text-primary)]">
          {content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {content}
            </ReactMarkdown>
          ) : (
            <TypingDots />
          )}
          {isStreaming && content && (
            <span className="inline-block w-2 h-4 bg-blue-500 ml-1 mb-[-2px] animate-pulse rounded-sm" />
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorBubble({
  error,
  onRetry,
}: {
  error: ErrorState;
  onRetry: () => void;
}) {
  const isRateLimit = error.type === "rate_limit";
  const isAuthError = error.type === "auth_error";

  return (
    <div className="flex gap-4 mb-8 items-start max-w-5xl mx-auto w-full">
      <div className="mt-1">
        <RobotAvatar size={34} />
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 max-w-3xl">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[15px] font-semibold text-red-400 mb-1">
                {isRateLimit
                  ? "Rate Limit Reached"
                  : isAuthError
                  ? "API Key Error"
                  : "Analysis Interrupted"}
              </p>
              <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed">
                {error.message}
              </p>
            </div>
          </div>
          
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 mt-4 text-[13px] font-medium text-[var(--color-text-inverse)] bg-[var(--color-brand)] rounded-lg hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate Response
          </button>
        </div>
      </div>
    </div>
  );
}

export function IntelligenceChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<ErrorState | null>(null);
  const [lastPrompt, setLastPrompt] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const sendMessage = useCallback(
    async (content: string, existingMessages?: Message[]) => {
      if (!content.trim() || isStreaming) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: content.trim(),
      };

      const newMessages = [...(existingMessages ?? messages), userMsg];
      setMessages(newMessages);
      setInput("");
      setIsStreaming(true);
      setStreamingContent("");
      setError(null);
      setLastPrompt(newMessages);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      try {
        const response = await fetch("/api/intelligence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages }),
        });

        if (!response.ok) {
          const data = await response.json();
          setError({
            type:
              data.error === "rate_limit"
                ? "rate_limit"
                : data.error === "auth_error"
                ? "auth_error"
                : "generation_failed",
            message: data.message ?? "Failed to get a response.",
          });
          setIsStreaming(false);
          return;
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullContent += decoder.decode(value, { stream: true });
          setStreamingContent(fullContent);
        }

        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: fullContent },
        ]);
        setStreamingContent("");
      } catch (err: any) {
        setError({
          type: "network",
          message:
            err?.message ?? "Network error — check your connection and try again.",
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  const handleRetry = useCallback(() => {
    if (!lastPrompt.length) return;
    const last = lastPrompt[lastPrompt.length - 1];
    setMessages(lastPrompt.slice(0, -1));
    setError(null);
    sendMessage(last.content, lastPrompt.slice(0, -1));
  }, [lastPrompt, sendMessage]);

  const stopGeneration = () => {
    // In a real app, you'd abort the fetch request. For now we just reset state.
    setIsStreaming(false);
    if (streamingContent) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: streamingContent + "  \n*[Analysis interrupted]*" },
      ]);
    }
    setStreamingContent("");
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-[var(--color-canvas)] relative">
      {/* Main Scrollable Chat Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
        {!hasMessages ? (
          <EmptyState onAction={(p) => sendMessage(p)} />
        ) : (
          <div className="max-w-5xl mx-auto px-6 pt-10 pb-10 flex flex-col w-full">
            {messages.map((msg) =>
              msg.role === "user" ? (
                <UserBubble key={msg.id} content={msg.content} />
              ) : (
                <AssistantBubble key={msg.id} content={msg.content} />
              )
            )}
            {isStreaming && (
              <AssistantBubble content={streamingContent} isStreaming />
            )}
            {error && !isStreaming && (
              <ErrorBubble error={error} onRetry={handleRetry} />
            )}
            <div ref={messagesEndRef} className="h-10" />
          </div>
        )}
      </div>

      {/* Floating Input Area (Claude style) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--color-canvas)] via-[var(--color-canvas)] to-transparent pt-10 pb-6 px-6">
        <div className="max-w-4xl mx-auto relative w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className={cn(
              "relative flex flex-col bg-[var(--color-panel)] border transition-all duration-300 rounded-[24px] shadow-lg",
              input.trim() ? "border-blue-500/40 shadow-blue-500/5" : "border-[var(--color-border)] hover:border-[var(--color-border-light)]",
              isStreaming && "opacity-90"
            )}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Message OGA Intelligence..."
              disabled={isStreaming}
              rows={1}
              className="w-full px-5 py-4 pb-14 bg-transparent text-[15px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none leading-relaxed custom-scrollbar max-h-[200px]"
            />
            
            {/* Embedded Action Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              {/* Left Side Actions (e.g. attachment placeholder) */}
              <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
                {/* Reserved for future actions */}
              </div>

              {/* Right Side Send/Stop */}
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-overlay)] text-[var(--color-text-primary)] hover:bg-[var(--color-panel-raised)] transition-all"
                >
                  <StopCircle className="w-5 h-5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-text-primary)] text-[var(--color-canvas)] transition-all duration-200 disabled:opacity-20 disabled:scale-90 hover:scale-105"
                >
                  <Send className="w-4 h-4 ml-[-1px]" />
                </button>
              )}
            </div>
          </form>

          {/* Minimal Disclaimer */}
          <div className="text-center mt-3 text-[11px] text-[var(--color-text-muted)] tracking-wide">
            OGA Intelligence is powered by <span className="text-[var(--color-text-secondary)] font-medium">Groq & Llama 3 70B</span>. AI can make mistakes.
          </div>
        </div>
      </div>
    </div>
  );
}

