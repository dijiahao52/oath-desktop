/**
 * Shared type definitions for the oath-engine SSE protocol.
 * Mirrors backend Phase 6.4b/6.4c/6.6 event payloads.
 */

export type LayerId =
  | "board"
  | "management"
  | "execution"
  | "supervision"
  | "audit"
  | "rework"

export type Verdict = "PASS" | "FAIL" | null
export type FinalVerdict =
  | "PASS"
  | "FAIL"
  | "UNKNOWN"
  | "ERROR"
  | "INTERRUPTED"

export interface ParsedFile {
  filename: string
  language: string
  code: string
}

// ─── SSE event payloads ───────────────────────────────────────────
export interface StartedEvent {
  run_id: string
  command: string
}

export interface LayerCompleteEvent {
  layer_id: LayerId
  layer_name: string
  iteration: number
  content: string
  verdict: Verdict
}

export interface FilesExtractedEvent {
  iteration: number
  source_layer: "execution" | "rework"
  files: ParsedFile[]
}

export interface ReworkTriggeredEvent {
  iteration: number
  reason: string
}

export interface DoneEvent {
  final_verdict: FinalVerdict
  total_iterations: number
}

export interface ErrorEvent {
  message: string
}

export interface NarratorCompleteEvent {
  iteration: number
  content: string
}

export type OathEvent =
  | { type: "started"; data: StartedEvent }
  | { type: "layer_complete"; data: LayerCompleteEvent }
  | { type: "files_extracted"; data: FilesExtractedEvent }
  | { type: "rework_triggered"; data: ReworkTriggeredEvent }
  | { type: "narrator_complete"; data: NarratorCompleteEvent }
  | { type: "done"; data: DoneEvent }
  | { type: "error"; data: ErrorEvent }

// ─── UI-derived state ─────────────────────────────────────────────
export type LaneStatus = "pending" | "running" | "done" | "failed"

export interface LaneState {
  layer_id: LayerId
  layer_name: string
  status: LaneStatus
  content: string
  verdict: Verdict
  iteration: number
}

export type RunStatus = "idle" | "starting" | "running" | "done" | "error"

export interface RunState {
  status: RunStatus
  run_id: string | null
  command: string
  lanes: Record<LayerId, LaneState>
  current_iteration: number
  total_iterations: number
  files: ParsedFile[]
  final_verdict: FinalVerdict | null
  error: string | null
  narrator_response: string | null
}

export const LAYER_ORDER: LayerId[] = [
  "board",
  "management",
  "execution",
  "supervision",
  "audit",
  "rework",
]

export const LAYER_DISPLAY_NAMES: Record<LayerId, string> = {
  board: "I / Board",
  management: "II / Management",
  execution: "III / Execution",
  supervision: "IV / Supervision",
  audit: "V / Audit",
  rework: "VI / Rework",
}
