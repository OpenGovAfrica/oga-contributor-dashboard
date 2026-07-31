export default function GlobalDashboardLoading() {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 w-full">
      {/* Fake Topbar / Header Area */}
      <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="h-7 w-48 bg-[var(--color-panel-raised)] rounded-md animate-pulse" />
      </div>

      <div className="flex-1 p-6 md:p-10 space-y-8 overflow-hidden max-w-[1600px] w-full mx-auto">
        {/* KPI Cards Row Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="h-[140px] rounded-2xl bg-[var(--color-panel)] border border-[var(--color-border)] p-5 flex flex-col justify-between overflow-hidden relative"
            >
              {/* Shimmer overlay */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[var(--color-border)]/20 to-transparent" />
              
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[var(--color-panel-raised)] animate-pulse" />
                <div className="h-4 w-16 bg-[var(--color-panel-raised)] rounded-sm animate-pulse" />
              </div>
              <div>
                <div className="h-8 w-24 bg-[var(--color-panel-raised)] rounded-md animate-pulse mb-2" />
                <div className="h-3 w-32 bg-[var(--color-panel-raised)] rounded-sm animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Chart / Table Area Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[400px]">
          <div className="lg:col-span-2 rounded-2xl bg-[var(--color-panel)] border border-[var(--color-border)] p-6 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[var(--color-border)]/20 to-transparent" />
            
            <div className="flex justify-between items-center mb-8">
              <div className="h-6 w-32 bg-[var(--color-panel-raised)] rounded-md animate-pulse" />
              <div className="h-8 w-40 bg-[var(--color-panel-raised)] rounded-md animate-pulse" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 w-full bg-[var(--color-panel-raised)] rounded-lg animate-pulse" />
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--color-panel)] border border-[var(--color-border)] p-6 relative overflow-hidden hidden lg:block">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[var(--color-border)]/20 to-transparent" />
            
            <div className="h-6 w-24 bg-[var(--color-panel-raised)] rounded-md animate-pulse mb-8" />
            <div className="w-full aspect-square rounded-full border-8 border-[var(--color-panel-raised)] animate-pulse mx-auto max-w-[200px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
