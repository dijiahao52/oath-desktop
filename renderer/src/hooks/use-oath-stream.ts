import { useCallback, useRef, useState } from "react"

import {
  LAYER_DISPLAY_NAMES,
  LAYER_ORDER,
  type LaneState,
  type LayerId,
  type OathEvent,
  type RunState,
} from "@/types/oath"

const API_URL =
  import.meta.env.VITE_OATH_API_URL ||
  "https://oath-engine-production.up.railway.app"

const initialLanes = (): Record<LayerId, LaneState> =>
  LAYER_ORDER.reduce((acc, id) => {
    acc[id] = {
      layer_id: id,
      layer_name: LAYER_DISPLAY_NAMES[id],
      status: "pending",
      content: "",
      verdict: null,
      iteration: 0,
    }
    return acc
  }, {} as Record<LayerId, LaneState>)

const initialState = (): RunState => ({
  status: "idle",
  run_id: null,
  command: "",
  lanes: initialLanes(),
  current_iteration: 0,
  total_iterations: 0,
  files: [],
  final_verdict: null,
  error: null,
})

export function useOathStream() {
  const [state, setState] = useState<RunState>(initialState())
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setState(initialState())
  }, [])

  // `command` is the prompt sent to the backend (may include merged context).
  // `displayCommand` is what's shown in the chat bubble (defaults to `command`).
  // Splitting them lets us send richer context to the engine while keeping the
  // UI bubble equal to what the user actually typed.
  const start = useCallback(async (command: string, displayCommand?: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState({
      ...initialState(),
      status: "starting",
      command: displayCommand ?? command,
    })

    try {
      const resp = await fetch(`${API_URL}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
        signal: controller.signal,
      })

      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status}`)
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const { events, remaining } = parseSSE(buffer)
        buffer = remaining

        for (const ev of events) {
          setState((prev) => applyEvent(prev, ev))
        }
      }
    } catch (e: unknown) {
      const err = e as Error
      if (err.name !== "AbortError") {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: err.message || "stream failed",
        }))
      }
    }
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  return { state, start, stop, reset }
}

// ─── SSE parsing ──────────────────────────────────────────────────
function parseSSE(buffer: string): { events: OathEvent[]; remaining: string } {
  const events: OathEvent[] = []
  const blocks = buffer.split("\n\n")
  // Last fragment may be incomplete; preserve as remaining buffer.
  const remaining = blocks.pop() ?? ""

  for (const block of blocks) {
    let type = ""
    const dataLines: string[] = []
    for (const line of block.split("\n")) {
      if (line.startsWith("event: ")) {
        type = line.slice(7).trim()
      } else if (line.startsWith("data: ")) {
        dataLines.push(line.slice(6))
      }
    }
    if (!type || dataLines.length === 0) continue
    try {
      const data = JSON.parse(dataLines.join("\n"))
      events.push({ type, data } as OathEvent)
    } catch {
      // ignore malformed event
    }
  }

  return { events, remaining }
}

// ─── State reducer ────────────────────────────────────────────────
function applyEvent(prev: RunState, ev: OathEvent): RunState {
  switch (ev.type) {
    case "started":
      // Keep the locally-set command (so an interrupt-merge prompt isn't
      // surfaced to the UI). Only fall back to backend echo if we somehow
      // didn't set one locally.
      return {
        ...prev,
        status: "running",
        run_id: ev.data.run_id,
        command: prev.command || ev.data.command,
      }

    case "layer_complete": {
      const { layer_id, layer_name, iteration, content, verdict } = ev.data
      const updatedLane: LaneState = {
        layer_id,
        layer_name: layer_name || LAYER_DISPLAY_NAMES[layer_id],
        status: verdict === "FAIL" ? "failed" : "done",
        content,
        verdict,
        iteration,
      }
      return {
        ...prev,
        current_iteration: Math.max(prev.current_iteration, iteration),
        lanes: { ...prev.lanes, [layer_id]: updatedLane },
      }
    }

    case "files_extracted":
      return { ...prev, files: ev.data.files }

    case "rework_triggered":
      return { ...prev, current_iteration: ev.data.iteration }

    case "done":
      return {
        ...prev,
        status: "done",
        final_verdict: ev.data.final_verdict,
        total_iterations: ev.data.total_iterations,
      }

    case "error":
      return {
        ...prev,
        status: "error",
        error: ev.data.message,
      }

    default:
      return prev
  }
}
