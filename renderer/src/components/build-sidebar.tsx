import { useEffect } from "react"

import type { FinalVerdict, RunState } from "@/types/oath"

interface BuildSidebarProps {
  runs: RunState[]
  activeRunId: string | null
  hasUnsavedRun: boolean
  onSelectRun: (runId: string) => void
  onNewBuild: () => void
  onClearAll: () => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export function BuildSidebar({
  runs,
  activeRunId,
  hasUnsavedRun,
  onSelectRun,
  onNewBuild,
  onClearAll,
  mobileOpen = false,
  onCloseMobile,
}: BuildSidebarProps) {
  // ESC closes mobile drawer
  useEffect(() => {
    if (!mobileOpen || !onCloseMobile) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMobile()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [mobileOpen, onCloseMobile])

  const content = (
    <SidebarContent
      runs={runs}
      activeRunId={activeRunId}
      hasUnsavedRun={hasUnsavedRun}
      onSelectRun={onSelectRun}
      onNewBuild={onNewBuild}
      onClearAll={onClearAll}
      onCloseMobile={onCloseMobile}
    />
  )

  return (
    <>
      {/* Desktop: always visible left rail */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-rule bg-ink-2/40">
        {content}
      </aside>

      {/* Mobile: drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <aside className="flex flex-col w-72 max-w-[85%] border-r border-rule bg-background shadow-2xl">
            {content}
          </aside>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onCloseMobile}
            className="flex-1 bg-black/40"
          />
        </div>
      )}
    </>
  )
}

// ─── Shared content (desktop sidebar + mobile drawer) ────────────
function SidebarContent({
  runs,
  activeRunId,
  hasUnsavedRun,
  onSelectRun,
  onNewBuild,
  onClearAll,
  onCloseMobile,
}: {
  runs: RunState[]
  activeRunId: string | null
  hasUnsavedRun: boolean
  onSelectRun: (runId: string) => void
  onNewBuild: () => void
  onClearAll: () => void
  onCloseMobile?: () => void
}) {
  const reversed = [...runs].reverse()

  return (
    <>
      <div className="p-3 border-b border-rule flex items-center gap-2">
        <button
          type="button"
          onClick={onNewBuild}
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-rule hover:border-gold-2 hover:bg-rule/40 font-mono text-xs text-parch transition-colors"
        >
          <span className="text-base leading-none">+</span>
          <span>new build</span>
        </button>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="md:hidden p-2 rounded-lg hover:bg-rule/40 text-parch-2 hover:text-parch transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="px-3 pt-4 pb-2 font-mono text-[10px] uppercase tracking-wider text-parch-2/70">
        recent
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {hasUnsavedRun && activeRunId === null && (
          <div className="px-3 py-2 rounded-lg bg-rule/60 font-mono text-xs text-parch flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span>current build</span>
          </div>
        )}

        {reversed.length === 0 ? (
          <p className="font-mono text-xs text-parch-2/50 px-3 py-4">
            no past runs yet
          </p>
        ) : (
          reversed.map((run, i) => {
            const id = run.run_id || `r-${i}`
            const isActive = run.run_id === activeRunId
            return (
              <button
                key={id}
                onClick={() => run.run_id && onSelectRun(run.run_id)}
                className={`w-full text-left px-3 py-2 rounded-lg font-mono text-xs transition-colors flex items-center gap-2 ${
                  isActive
                    ? "bg-rule/60 text-parch"
                    : "text-parch-2 hover:bg-rule/40 hover:text-parch"
                }`}
              >
                <VerdictDot verdict={run.final_verdict} />
                <span className="truncate flex-1">{run.command}</span>
              </button>
            )
          })
        )}
      </nav>

      {runs.length > 0 && (
        <div className="border-t border-rule p-3">
          <button
            type="button"
            onClick={onClearAll}
            className="font-mono text-[10px] uppercase tracking-wider text-parch-2/70 hover:text-red-600 transition-colors"
          >
            clear history
          </button>
        </div>
      )}
    </>
  )
}

function VerdictDot({ verdict }: { verdict: FinalVerdict | null }) {
  const cls =
    verdict === "PASS"
      ? "bg-emerald-500"
      : verdict === "FAIL"
        ? "bg-red-500"
        : verdict === "ERROR"
          ? "bg-red-500/60"
          : verdict === "INTERRUPTED"
            ? "bg-gold-2/70"
            : "bg-parch-2/40"
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cls}`} />
}
