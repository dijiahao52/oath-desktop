import { useEffect, useRef, useState } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { BuildSidebar } from "@/components/build-sidebar"
import { CodeEditor } from "@/components/code-editor"
import { FileUpload } from "@/components/file-upload"
import { ModelSwitcher } from "@/components/model-switcher"
import { OathStream } from "@/components/oath-stream"
import { PreviewPane } from "@/components/preview-pane"
import { useOathStream } from "@/hooks/use-oath-stream"
import {
  DEFAULT_MODELS,
  loadActiveModelId,
  loadModels,
  saveActiveModelId,
  saveModels,
  type ModelConfig,
} from "@/lib/model-storage"
import { clearRuns, loadRuns, saveRuns } from "@/lib/run-storage"
import type { RunState } from "@/types/oath"

const EXAMPLES = [
  "a landing page for my restaurant",
  "a discord bot that tracks ETH gas prices",
  "a chrome extension that blocks X after 10pm",
]

export default function App() {
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<RunState[]>([])
  const [viewingRunId, setViewingRunId] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activePane, setActivePane] = useState<"chat" | "editor">("chat")
  const [fileContext, setFileContext] = useState<{ name: string; content: string } | null>(null)
  const [models, setModels] = useState<ModelConfig[]>(() => loadModels())
  const [activeModelId, setActiveModelId] = useState<string>(() => loadActiveModelId())
  const [darkMode, setDarkMode] = useState<boolean>(
    () => localStorage.getItem("oath:theme") !== "light"
  )
  const { state, start, reset } = useOathStream()
  const feedRef = useRef<HTMLDivElement>(null)

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev
      localStorage.setItem("oath:theme", next ? "dark" : "light")
      return next
    })
  }

  useEffect(() => {
    setHistory(loadRuns())
  }, [])

  useEffect(() => {
    const isTerminal = state.status === "done" || state.status === "error"
    if (!isTerminal || !state.run_id) return
    setHistory((prev) => {
      if (prev.some((r) => r.run_id === state.run_id)) return prev
      const next = [...prev, state]
      saveRuns(next)
      return next
    })
  }, [state])

  // Auto-switch to editor pane when files arrive
  useEffect(() => {
    if (state.files.length > 0 && activePane === "chat") {
      // Don't force-switch; just make editor tab available
    }
  }, [state.files.length, activePane])

  const archiveCurrentRun = () => {
    if (state.status === "idle" || !state.run_id) return
    const isFinished = state.status === "done" || state.status === "error"
    const snapshot: RunState = isFinished
      ? state
      : { ...state, status: "done", final_verdict: "INTERRUPTED" }
    setHistory((prev) => {
      if (prev.some((r) => r.run_id === state.run_id)) return prev
      const next = [...prev, snapshot]
      saveRuns(next)
      return next
    })
  }

  const isViewingArchived = viewingRunId !== null
  const archivedRun = isViewingArchived
    ? history.find((r) => r.run_id === viewingRunId)
    : null
  const isCurrentArchived =
    !!state.run_id && history.some((r) => r.run_id === state.run_id)
  const hasCurrentRun = state.status !== "idle" && !isCurrentArchived
  const isIdle =
    !isViewingArchived && state.status === "idle" && history.length === 0
  const isStreaming =
    !isViewingArchived &&
    (state.status === "starting" || state.status === "running")

  // Files and preview for the active view
  const currentFiles = isViewingArchived && archivedRun
    ? archivedRun.files
    : state.files
  const previewHtml =
    currentFiles.find(
      (f) => f.filename.endsWith(".html") || f.language === "html"
    )?.code ?? ""

  useEffect(() => {
    if (!feedRef.current) return
    feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [
    state.command,
    state.current_iteration,
    state.lanes,
    state.files.length,
    state.status,
    history.length,
    viewingRunId,
  ])

  const handleSubmit = () => {
    const newInput = input.trim()
    if (!newInput) return

    const displayCommand = newInput
    const baseCommand = fileContext
      ? `File context (${fileContext.name}):\n${fileContext.content}\n\n${newInput}`
      : newInput

    let apiCommand = baseCommand
    if (isStreaming && state.command) {
      apiCommand = [
        "Original request:",
        state.command,
        "",
        "Refinement / new instruction (interrupted mid-build):",
        baseCommand,
        "",
        "Please consider both requests together when planning.",
      ].join("\n")
    }

    archiveCurrentRun()
    setViewingRunId(null)
    start(apiCommand, displayCommand)
    setInput("")
    setMobileMenuOpen(false)
  }

  const handleNewBuild = () => {
    archiveCurrentRun()
    reset()
    setViewingRunId(null)
    setInput("")
    setMobileMenuOpen(false)
    setActivePane("chat")
  }

  const handleSelectRun = (runId: string) => {
    setViewingRunId(runId)
    setInput("")
    setMobileMenuOpen(false)
  }

  const handleClearAll = () => {
    if (typeof window !== "undefined") {
      const ok = window.confirm("Clear all past builds?")
      if (!ok) return
    }
    clearRuns()
    setHistory([])
    setViewingRunId(null)
    reset()
    setInput("")
    setMobileMenuOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSelectModel = (id: string) => {
    setActiveModelId(id)
    saveActiveModelId(id)
  }

  const handleAddModel = (model: ModelConfig) => {
    const next = [...models, model]
    setModels(next)
    saveModels(next)
    setActiveModelId(model.id)
    saveActiveModelId(model.id)
  }

  return (
    <main className={`${darkMode ? "" : "theme-light"} h-screen bg-background flex flex-col overflow-hidden`}>
      {/* ── Desktop top bar ── */}
      <div className="hidden md:flex items-center justify-between px-4 py-2 border-b border-rule bg-background/80 backdrop-blur-sm shrink-0">
        <span className="font-serif text-sm text-parch-2 tracking-wide">oath</span>
        <div className="flex items-center gap-2">
          <FileUpload
            fileContext={fileContext}
            onFileContent={(name, content) => setFileContext({ name, content })}
            onClear={() => setFileContext(null)}
          />
          <ModelSwitcher
            models={models.length > 0 ? models : DEFAULT_MODELS}
            activeModelId={activeModelId}
            onSelect={handleSelectModel}
            onAddModel={handleAddModel}
          />
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="p-1.5 rounded-lg text-parch-2 hover:text-parch hover:bg-rule/40 transition-colors"
          >
            {darkMode ? (
              /* Sun icon */
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              /* Moon icon */
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex min-h-0">
        <BuildSidebar
          runs={history}
          activeRunId={viewingRunId}
          hasUnsavedRun={hasCurrentRun && !isViewingArchived}
          onSelectRun={handleSelectRun}
          onNewBuild={handleNewBuild}
          onClearAll={handleClearAll}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* ── 3-pane resizable area ── */}
        <PanelGroup direction="horizontal" className="flex-1 min-w-0">

          {/* Middle: Chat / Editor */}
          <Panel defaultSize={55} minSize={25}>
            <div className="flex flex-col h-full">
              {/* Pane toggle tabs (desktop only) */}
              <div className="hidden md:flex items-center gap-1 px-3 py-1.5 border-b border-rule shrink-0">
                {(["chat", "editor"] as const).map((pane) => (
                  <button
                    key={pane}
                    onClick={() => setActivePane(pane)}
                    className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded transition-colors ${
                      activePane === pane
                        ? "bg-rule/60 text-parch"
                        : "text-parch-2/60 hover:text-parch-2"
                    }`}
                  >
                    {pane}
                    {pane === "editor" && currentFiles.length > 0 && (
                      <span className="ml-1 text-gold">{currentFiles.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {activePane === "chat" ? (
                <section className="flex-1 flex flex-col min-h-0">
                  <MobileTopBar
                    onOpenMenu={() => setMobileMenuOpen(true)}
                    onNewBuild={handleNewBuild}
                  />
                  {isIdle ? (
                    <IdleView
                      input={input}
                      setInput={setInput}
                      onSubmit={handleSubmit}
                      onKeyDown={handleKeyDown}
                    />
                  ) : (
                    <ChatView
                      input={input}
                      setInput={setInput}
                      onSubmit={handleSubmit}
                      onKeyDown={handleKeyDown}
                      onNewBuild={handleNewBuild}
                      isStreaming={isStreaming}
                      isViewingArchived={isViewingArchived}
                      feedRef={feedRef}
                    >
                      <div className="space-y-12">
                        {isViewingArchived && archivedRun ? (
                          <OathStream state={archivedRun} defaultThinkingExpanded />
                        ) : (
                          <>
                            {history.map((run, i) => (
                              <OathStream
                                key={run.run_id || `hist-${i}`}
                                state={run}
                                defaultThinkingExpanded={false}
                              />
                            ))}
                            {hasCurrentRun && <OathStream state={state} />}
                          </>
                        )}
                      </div>
                    </ChatView>
                  )}
                </section>
              ) : (
                <div className="flex-1 min-h-0">
                  <CodeEditor files={currentFiles} />
                </div>
              )}
            </div>
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="w-px bg-rule/70 hover:bg-gold transition-colors cursor-col-resize" />

          {/* Right: Live Preview */}
          <Panel defaultSize={45} minSize={15}>
            <PreviewPane html={previewHtml} />
          </Panel>

        </PanelGroup>
      </div>
    </main>
  )
}

// ─── Mobile top bar ──────────────────────────────────────────────
function MobileTopBar({
  onOpenMenu,
  onNewBuild,
}: {
  onOpenMenu: () => void
  onNewBuild: () => void
}) {
  return (
    <div className="md:hidden flex items-center justify-between px-3 py-2 border-b border-rule bg-background/90 backdrop-blur-md shrink-0">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="p-2 -ml-1 rounded-lg hover:bg-rule/40 text-parch-2 hover:text-parch transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onNewBuild}
        className="font-mono text-xs px-3 py-1.5 rounded-lg border border-rule hover:border-gold-2 text-parch-2 hover:text-gold transition-colors"
      >
        + new
      </button>
    </div>
  )
}

// ─── Idle view ───────────────────────────────────────────────────
interface IdleViewProps {
  input: string
  setInput: (v: string) => void
  onSubmit: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

function IdleView({ input, setInput, onSubmit, onKeyDown }: IdleViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-16 overflow-y-auto">
      <div className="w-full max-w-2xl">
        <p className="font-mono text-sm text-parch-2 text-center mb-8">
          tell oath what to build.
        </p>
        <ComposerBox
          input={input}
          setInput={setInput}
          onSubmit={onSubmit}
          onKeyDown={onKeyDown}
          rows={3}
        />
        <div className="mt-8 space-y-2">
          <p className="font-mono text-xs text-parch-2 mb-3">try:</p>
          {EXAMPLES.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="block w-full text-left font-mono text-sm text-parch-2 hover:text-gold border border-rule hover:border-gold-2 rounded-md px-4 py-3 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Chat view ───────────────────────────────────────────────────
interface ChatViewProps {
  input: string
  setInput: (v: string) => void
  onSubmit: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onNewBuild: () => void
  isStreaming: boolean
  isViewingArchived: boolean
  feedRef: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}

function ChatView({
  input,
  setInput,
  onSubmit,
  onKeyDown,
  onNewBuild,
  isStreaming,
  isViewingArchived,
  feedRef,
  children,
}: ChatViewProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={feedRef} className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 py-6 sm:py-8 pb-40">{children}</div>
      </div>
      <div className="sticky bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-rule">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          {isViewingArchived ? (
            <button
              type="button"
              onClick={onNewBuild}
              className="w-full px-4 py-3 rounded-2xl border border-rule hover:border-gold-2 font-mono text-sm text-parch-2 hover:text-gold transition-colors"
            >
              + start a new build
            </button>
          ) : (
            <ComposerBox
              input={input}
              setInput={setInput}
              onSubmit={onSubmit}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={
                isStreaming
                  ? "interrupt with a refinement..."
                  : "describe a new build, or refine the last one..."
              }
              hint={
                isStreaming
                  ? "submit will interrupt and re-plan with both requests"
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Composer ────────────────────────────────────────────────────
interface ComposerBoxProps {
  input: string
  setInput: (v: string) => void
  onSubmit: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  rows: number
  placeholder?: string
  hint?: string
}

function ComposerBox({
  input,
  setInput,
  onSubmit,
  onKeyDown,
  rows,
  placeholder = "describe it in plain english...",
  hint,
}: ComposerBoxProps) {
  return (
    <div className="border border-rule rounded-2xl bg-ink-2 transition-colors focus-within:border-gold-2">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-transparent px-4 py-3 font-mono text-sm text-parch placeholder:text-parch-2/50 resize-none focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3 px-3 py-1.5 border-t border-rule">
        <span className="font-mono text-[10px] text-parch-2/60 truncate">
          {hint ?? " "}
        </span>
        <button
          onClick={onSubmit}
          disabled={!input.trim()}
          aria-label="Submit"
          className="w-7 h-7 shrink-0 rounded-full bg-parch text-ink hover:bg-gold flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xs"
        >
          ↑
        </button>
      </div>
    </div>
  )
}
