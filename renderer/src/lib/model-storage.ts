export interface ModelConfig {
  id: string
  name: string
  base_url: string
  api_key: string
  model_name: string
}

const MODELS_KEY = "oath:models"
const ACTIVE_KEY = "oath:active_model"

export const DEFAULT_MODELS: ModelConfig[] = [
  {
    id: "deepseek",
    name: "DeepSeek",
    base_url: "https://api.deepseek.com/v1",
    api_key: "",
    model_name: "deepseek-chat",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    base_url: "https://api.openai.com/v1",
    api_key: "",
    model_name: "gpt-4o",
  },
  {
    id: "claude",
    name: "Claude",
    base_url: "https://api.anthropic.com/v1",
    api_key: "",
    model_name: "claude-opus-4-6",
  },
]

export function loadModels(): ModelConfig[] {
  try {
    const raw = localStorage.getItem(MODELS_KEY)
    if (!raw) return DEFAULT_MODELS
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_MODELS
    return parsed as ModelConfig[]
  } catch {
    return DEFAULT_MODELS
  }
}

export function saveModels(models: ModelConfig[]): void {
  try {
    localStorage.setItem(MODELS_KEY, JSON.stringify(models))
  } catch {
    // ignore
  }
}

export function loadActiveModelId(): string {
  try {
    return localStorage.getItem(ACTIVE_KEY) ?? "deepseek"
  } catch {
    return "deepseek"
  }
}

export function saveActiveModelId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, id)
  } catch {
    // ignore
  }
}
