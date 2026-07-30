// src/app/(dashboard)/intelligence/page.tsx
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/Topbar";
import { IntelligenceChat } from "@/components/intelligence/IntelligenceChat";

export const metadata: Metadata = {
  title: "OGA Intelligence",
  description: "AI-powered engineering analyst with real-time access to OpenGovAfrica's GitHub org data.",
};

export default function IntelligencePage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="OGA Intelligence"
        showWindowSelector={false}
      />
      <div className="flex-1 overflow-hidden">
        <IntelligenceChat />
      </div>
    </div>
  );
}
