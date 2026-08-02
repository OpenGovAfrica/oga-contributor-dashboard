import type { Metadata } from "next";
import { Topbar } from "@/components/layout/Topbar";
import { SettingsClient } from "./SettingsClient";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const state = await prisma.systemState.findUnique({ where: { id: 1 } });
  
  const syncLookbackDays = state?.syncLookbackDays || 30;
  const autoSyncFrequency = state?.autoSyncFrequency || "manual";
  const hasGithubPat = !!process.env.GH_PAT;

  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title="Settings"
        showWindowSelector={false}
      />
      <div className="flex-1 max-w-[1200px] w-full mx-auto p-6 md:p-10 animate-fade-in">
        <SettingsClient 
          initialLookback={syncLookbackDays} 
          initialFrequency={autoSyncFrequency}
          hasGithubPat={hasGithubPat}
          targetOrg={state?.targetOrg || "OpenGovAfrica"}
        />
      </div>
    </div>
  );
}
