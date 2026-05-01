import type { RunState } from "@/types/oath"

const STORAGE_KEY = "oath:runs"
const MAX_RUNS = 50

export function loadRuns(): RunState[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as RunState[]
  } catch {
    return []
  }
}

export function saveRuns(runs: RunState[]): void {
  if (typeof window === "undefined") return
  try {
    const trimmed = runs.slice(-MAX_RUNS)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded) — ignore.
  }
}

export function clearRuns(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
