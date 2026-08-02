"use client";

import { useState, useTransition, useEffect } from "react";
import { updateSettings, purgeData, factoryReset } from "./actions";
import { Save, AlertTriangle, RefreshCw, KeyRound, Monitor, Moon, Sun, CheckCircle2, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

interface SettingsClientProps {
  initialLookback: number;
  initialFrequency: string;
  hasGithubPat: boolean;
  targetOrg: string;
}

export function SettingsClient({ initialLookback, initialFrequency, hasGithubPat, targetOrg }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [confirmOrg, setConfirmOrg] = useState("");
  
  // Custom Alert Modal State (Replaces the corner Toast)
  const [alertModal, setAlertModal] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  // Custom Modal State
  const [showPurgeModal, setShowPurgeModal] = useState(false);

  function showAlert(message: string, type: "success" | "error" | "info" = "info") {
    setAlertModal({ message, type });
  }

  async function handleSave(formData: FormData) {
    const lookback = formData.get("syncLookbackDays")?.toString() || "30";
    const frequency = formData.get("autoSyncFrequency")?.toString() || "manual";
    
    const safeData = new FormData();
    safeData.append("syncLookbackDays", lookback);
    safeData.append("autoSyncFrequency", frequency);

    startTransition(async () => {
      try {
        await updateSettings(safeData);
        showAlert("Settings saved successfully.", "success");
      } catch (err: any) {
        console.error("Save error:", err);
        showAlert(`Failed to save settings: ${err.message || err}`, "error");
      }
    });
  }

  function handlePurgeClick() {
    setShowPurgeModal(true);
  }

  async function executePurge() {
    setShowPurgeModal(false);
    startTransition(async () => {
      try {
        await purgeData();
        showAlert("Data purged successfully. Fetching fresh state...", "success");
        setTimeout(() => router.refresh(), 1500);
      } catch (err: any) {
        showAlert("Failed to purge data.", "error");
      }
    });
  }

  async function handleFactoryReset() {
    if (confirmOrg !== targetOrg) return;
    startTransition(async () => {
      try {
        await factoryReset();
        showAlert("System factory reset complete.", "success");
        setTimeout(() => { window.location.href = "/"; }, 1500);
      } catch (err: any) {
        showAlert("Failed to reset system.", "error");
      }
    });
  }

  const TABS = [
    { id: "general", label: "General" },
    { id: "sync", label: "Data & Sync" },
    { id: "advanced", label: "Advanced" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-10 relative">
      
      {/* Central Alert Modal Notification */}
      {alertModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-canvas)]/80 backdrop-blur-md animate-fade-in p-4">
          <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-scale-in text-center">
            <div className="flex justify-center mb-5">
              {alertModal.type === "success" && <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" /></div>}
              {alertModal.type === "error" && <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" /></div>}
              {alertModal.type === "info" && <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Info className="w-8 h-8 text-blue-600 dark:text-blue-500" /></div>}
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              {alertModal.type === "success" ? "Success" : alertModal.type === "error" ? "Error" : "Information"}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-8">
              {alertModal.message}
            </p>
            <button 
              onClick={() => setAlertModal(null)} 
              className="w-full py-3 rounded-xl text-sm font-bold bg-[var(--color-brand)] text-[var(--color-text-inverse)] hover:opacity-90 transition-all active:scale-95"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Purge Modal Overlay */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-canvas)]/80 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Purge All Data?</h3>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mb-8">
              This action cannot be undone. All repositories, contributors, issues, and contributions will be completely wiped from the database.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowPurgeModal(false)} 
                className="px-4 py-2.5 rounded-lg text-sm font-medium border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-overlay)] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executePurge} 
                disabled={isPending}
                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
              >
                {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                Yes, Purge Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Sidebar */}
      <aside className="w-full md:w-[220px] shrink-0">
        <nav className="flex flex-col space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.id 
                  ? "bg-[var(--color-panel-raised)] text-[var(--color-text-primary)]" 
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-panel)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Settings Content Area */}
      <div className="flex-1 max-w-3xl space-y-8">
        
        {activeTab === "general" && (
          <div className="space-y-8 animate-fade-in">
            {/* Theme Settings Card */}
            <div className="panel overflow-hidden border border-[var(--color-border)] rounded-xl">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Appearance</h3>
                <p className="text-sm text-[var(--color-text-muted)] mb-6">Customize the look and feel of the OGA Dashboard.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ThemeOption 
                    icon={Monitor} 
                    label="System" 
                    selected={theme === "system"} 
                    onClick={() => setTheme("system")} 
                  />
                  <ThemeOption 
                    icon={Sun} 
                    label="Light" 
                    selected={theme === "light"} 
                    onClick={() => setTheme("light")} 
                  />
                  <ThemeOption 
                    icon={Moon} 
                    label="Dark" 
                    selected={theme === "dark"} 
                    onClick={() => setTheme("dark")} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sync" && (
          <div className="space-y-8 animate-fade-in">
            
            {/* GitHub API Status Card */}
            <div className="panel overflow-hidden border border-[var(--color-border)] rounded-xl">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">GitHub Integration</h3>
                <p className="text-sm text-[var(--color-text-muted)] mb-6">Manage your connection to the GitHub API.</p>
                
                <div className="flex items-center gap-4 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-panel-raised)]">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors"
                    style={{ 
                      backgroundColor: hasGithubPat ? 'var(--color-active-dim)' : 'var(--color-stalled-dim)',
                      color: hasGithubPat ? 'var(--color-active)' : 'var(--color-stalled)' 
                    }}
                  >
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[var(--color-text-primary)]">Personal Access Token (PAT)</h4>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {hasGithubPat ? "Token is securely loaded from environment variables." : "Missing GH_PAT in environment variables."}
                    </p>
                  </div>
                  {hasGithubPat && (
                    <div 
                      className="ml-auto flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                      style={{ backgroundColor: 'var(--color-active-dim)', color: 'var(--color-active)' }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sync Preferences Card */}
            <form action={handleSave} className="panel overflow-hidden border border-[var(--color-border)] rounded-xl">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Sync Preferences</h3>
                <p className="text-sm text-[var(--color-text-muted)] mb-6">Configure how often and how much data the dashboard fetches.</p>
                
                <div className="space-y-5 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Auto-Sync Frequency</label>
                    <select 
                      key={initialFrequency}
                      name="autoSyncFrequency"
                      defaultValue={initialFrequency}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-md px-3 py-2.5 focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                    >
                      <option value="manual">Manual (Triggered by button)</option>
                      <option value="hourly">Hourly (Requires Cron Setup)</option>
                      <option value="daily">Daily (Requires Cron Setup)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Data Lookback Window</label>
                    <select 
                      key={initialLookback}
                      name="syncLookbackDays"
                      defaultValue={initialLookback}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-md px-3 py-2.5 focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                    >
                      <option value="7">Last 7 Days</option>
                      <option value="14">Last 14 Days</option>
                      <option value="30">Last 30 Days</option>
                      <option value="90">Last 90 Days</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="bg-[var(--color-panel-raised)] px-6 py-4 flex items-center justify-between border-t border-[var(--color-border)]">
                <p className="text-xs text-[var(--color-text-muted)]">Changes will apply on the next sync execution.</p>
                <div className="flex items-center gap-3">
                  <button 
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md bg-[var(--color-text-primary)] text-[var(--color-canvas)] hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Enterprise Automation Card */}
            <div className="panel overflow-hidden border border-[var(--color-border)] rounded-xl">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-brand)]" />
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Enterprise Automation Enabled</h3>
                </div>
                <p className="text-sm text-[var(--color-text-muted)] mb-6">
                  The OGA Dashboard utilizes a Delta-Sync architecture for manual refreshes to prevent API timeouts. Deep backfills and data healing operations are handled entirely by an automated GitHub Action that runs every 6 hours.
                </p>
                
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
                   <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">Manual Data Purging & Factory Resets</h4>
                   <p className="text-xs text-[var(--color-text-secondary)]">
                     Destructive operations like wiping the database have been securely moved off the frontend to prevent accidental data loss. If you require a hard factory reset, please execute the deep-sync script directly via the CI/CD pipeline or server console.
                   </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

function ThemeOption({ icon: Icon, label, selected, onClick }: any) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all",
        selected 
          ? "border-[var(--color-brand)] bg-[var(--color-brand)] bg-opacity-5 shadow-sm" 
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-muted)]"
      )}
    >
      <Icon className={cn("w-6 h-6", selected ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)]")} />
      <span className={cn("text-sm font-medium", selected ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]")}>
        {label}
      </span>
    </button>
  );
}
