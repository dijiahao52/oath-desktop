import { useEffect, useRef, useState } from "react"

import {
  LAYER_DISPLAY_NAMES,
  LAYER_ORDER,
  type LayerId,
  type ParsedFile,
  type RunState,
  type Verdict,
} from "@/types/oath"

// ─── Per-layer accent colors ─────────────────────────────────────
// Uses mid-range shades that work on both dark and light backgrounds.
const LAYER_ACCENT: Record<LayerId, { text: string; dot: string }> = {
  board:       { text: "text-blue-400",   dot: "bg-blue-400"   },
  management:  { text: "text-violet-400", dot: "bg-violet-400" },
  execution:   { text: "text-teal-400",   dot: "bg-teal-400"   },
  supervision: { text: "text-amber-400",  dot: "bg-amber-400"  },
  audit:       { text: "text-rose-400",   dot: "bg-rose-400"   },
  rework:      { text: "text-orange-400", dot: "bg-orange-400" },
}

interface OathStreamProps {
  state: RunState
  defaultThinkingExpanded?: boolean
}

export function OathStream({
  state,
  defaultThinkingExpanded = false,
}: OathStreamProps) {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      <UserMessage command={state.command} />

      <ThinkingPanel
        state={state}
        defaultExpanded={defaultThinkingExpanded}
      />

      {state.narrator_response && (
        <NarratorBlock content={state.narrator_response} />
      )}

      {state.files.length > 0 && <OutputBlock files={state.files} />}

      {state.status === "done" && state.final_verdict && (
        <VerdictPill
          verdict={state.final_verdict}
          iterations={state.total_iterations}
        />
      )}

      {state.error && (
        <div className="border border-red-500/40 bg-red-500/5 rounded-2xl px-4 py-3">
          <p className="font-mono text-xs text-red-400">
            error: {state.error}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── User message bubble (right-aligned) ─────────────────────────
function UserMessage({ command }: { command: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-rule/50 rounded-2xl rounded-br-sm px-4 py-3">
        <p className="text-sm text-parch break-words whitespace-pre-wrap">
          {command || "..."}
        </p>
      </div>
    </div>
  )
}

// ─── Thinking panel (Claude-style) ───────────────────────────────
function ThinkingPanel({
  state,
  defaultExpanded,
}: {
  state: RunState
  defaultExpanded: boolean
}) {
  const isRunning = state.status === "starting" || state.status === "running"
  const elapsed = useElapsedSeconds(state)
  const sections = buildThinkingSections(state)

  const [expanded, setExpanded] = useState(defaultExpanded)
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom as content streams in.
  useEffect(() => {
    if (!autoScroll) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [sections, autoScroll, expanded])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24
    setAutoScroll(atBottom)
  }

  if (sections.length === 0 && !isRunning) return null

  const headerLabel = isRunning ? (
    <ThinkingDots />
  ) : elapsed > 0 ? (
    <span>thought for {elapsed}s</span>
  ) : (
    <span>thinking</span>
  )

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-2 px-2 py-1 -ml-2 rounded-md hover:bg-rule/30 transition-colors text-left"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isRunning ? "bg-gold animate-pulse" : "bg-parch-2/50"
          }`}
        />
        <span className="font-mono text-xs text-parch-2 lowercase">
          {headerLabel}
        </span>
        {state.current_iteration > 0 && (
          <span className="font-mono text-xs text-gold">
            · iter {state.current_iteration}
          </span>
        )}
        <span className="font-mono text-xs text-parch-2/60">
          {expanded ? "−" : "+"}
        </span>
      </button>

      {expanded && (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="mt-3 border-l-2 border-rule pl-5 max-h-[520px] overflow-y-auto"
        >
          <div className="space-y-6 pr-2 pb-1">
            {sections.length === 0 ? (
              <span className="font-mono text-xs text-parch-2/60 italic">
                waiting for first layer...
              </span>
            ) : (
              sections.map((s, i) => {
                const isLast = i === sections.length - 1
                return (
                  <ThinkingSectionView
                    key={`${s.layer_id}-${s.iteration}-${i}`}
                    section={s}
                    showCursor={isRunning && isLast}
                  />
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ThinkingSectionView({
  section,
  showCursor,
}: {
  section: ThinkingSection
  showCursor: boolean
}) {
  const accent = LAYER_ACCENT[section.layer_id]
  return (
    <section>
      <header className="font-mono text-[11px] uppercase tracking-[0.12em] mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${accent.dot}`}
            aria-hidden
          />
          <span className={`${accent.text} font-medium`}>
            {section.heading}
          </span>
        </span>
        {section.iteration > 0 && (
          <span className="text-gold">· iter {section.iteration}</span>
        )}
        {section.verdict === "PASS" && (
          <span className="text-emerald-400">· pass</span>
        )}
        {section.verdict === "FAIL" && (
          <span className="text-red-400">· fail</span>
        )}
      </header>
      <div className="font-sans text-[15px] text-parch leading-[1.7] whitespace-pre-wrap break-words">
        {section.body}
        {showCursor && <span className="ml-1 animate-pulse">▍</span>}
      </div>
    </section>
  )
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span>thinking</span>
      <span className="inline-flex gap-0.5 ml-1">
        <span className="animate-pulse">.</span>
        <span className="animate-pulse [animation-delay:200ms]">.</span>
        <span className="animate-pulse [animation-delay:400ms]">.</span>
      </span>
    </span>
  )
}

type ThinkingSection = {
  layer_id: LayerId
  heading: string
  iteration: number
  verdict: Verdict
  body: string
}

function buildThinkingSections(state: RunState): ThinkingSection[] {
  const sections: ThinkingSection[] = []
  for (const id of LAYER_ORDER) {
    const lane = state.lanes[id]
    if (!lane.content) continue
    sections.push({
      layer_id: id,
      heading: lane.layer_name || LAYER_DISPLAY_NAMES[id],
      iteration: lane.iteration,
      verdict: lane.verdict,
      body: lane.content.trim(),
    })
  }
  return sections
}

function useElapsedSeconds(state: RunState): number {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef<number | null>(null)
  const isRunning = state.status === "starting" || state.status === "running"

  useEffect(() => {
    if (state.status === "idle") {
      startRef.current = null
      setElapsed(0)
      return
    }
    if (isRunning && startRef.current === null) {
      startRef.current = Date.now()
    }
    if (!isRunning && startRef.current !== null) {
      const final = Math.floor((Date.now() - startRef.current) / 1000)
      setElapsed(final)
      startRef.current = null
    }
  }, [state.status, isRunning])

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      if (startRef.current !== null) {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
      }
    }, 250)
    return () => clearInterval(interval)
  }, [isRunning])

  return elapsed
}

// ─── Narrator (conversational summary) ──────────────────────────
function NarratorBlock({ content }: { content: string }) {
  return (
    <div className="font-sans text-[15px] text-parch leading-[1.7] whitespace-pre-wrap break-words">
      {content}
    </div>
  )
}

// ─── Output (final answer) ───────────────────────────────────────
function OutputBlock({ files }: { files: ParsedFile[] }) {
  const [active, setActive] = useState(0)
  const file = files[active]
  if (!file) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-parch-2/70 shrink-0 pr-2">
          output
        </span>
        {files.map((f, i) => (
          <button
            key={`${f.filename}-${i}`}
            onClick={() => setActive(i)}
            className={`font-mono text-xs px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
              i === active
                ? "bg-rule/60 text-parch"
                : "text-parch-2 hover:text-parch hover:bg-rule/30"
            }`}
          >
            {f.filename}
          </button>
        ))}
      </div>

      <pre className="bg-ink-2 rounded-xl px-4 py-3 text-xs text-parch font-mono whitespace-pre overflow-auto max-h-[520px]">
        {file.code}
      </pre>
    </div>
  )
}

// ─── Verdict pill ────────────────────────────────────────────────
function VerdictPill({
  verdict,
  iterations,
}: {
  verdict: string
  iterations: number
}) {
  const colorClass =
    verdict === "PASS"
      ? "border-emerald-500/40 text-emerald-400"
      : verdict === "FAIL"
        ? "border-red-500/40 text-red-400"
        : verdict === "INTERRUPTED"
          ? "border-gold-2/50 text-gold-2"
          : "border-rule text-parch-2"

  const label =
    verdict === "PASS"
      ? "shipped · pass"
      : verdict === "FAIL"
        ? "did not pass audit"
        : verdict === "INTERRUPTED"
          ? "interrupted · superseded"
          : verdict.toLowerCase()

  const showIters = verdict !== "INTERRUPTED" || iterations > 0

  return (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2 border rounded-full ${colorClass}`}
    >
      <span className="font-mono text-xs uppercase tracking-wider">
        {label}
      </span>
      {showIters && (
        <span className="font-mono text-xs text-parch-2">
          · {iterations} {iterations === 1 ? "iteration" : "iterations"}
        </span>
      )}
    </div>
  )
}
