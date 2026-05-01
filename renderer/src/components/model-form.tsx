import { useState } from "react"
import type { ModelConfig } from "@/lib/model-storage"

interface ModelFormProps {
  onSave: (model: ModelConfig) => void
  onCancel: () => void
}

export function ModelForm({ onSave, onCancel }: ModelFormProps) {
  const [name, setName] = useState("")
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1")
  const [apiKey, setApiKey] = useState("")
  const [modelName, setModelName] = useState("")

  const handleSave = () => {
    if (!name.trim() || !modelName.trim()) return
    onSave({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      base_url: baseUrl.trim(),
      api_key: apiKey.trim(),
      model_name: modelName.trim(),
    })
  }

  const fields = [
    { label: "display name", value: name, set: setName, placeholder: "My Model" },
    { label: "base url", value: baseUrl, set: setBaseUrl, placeholder: "https://..." },
    { label: "api key", value: apiKey, set: setApiKey, placeholder: "sk-..." },
    { label: "model name", value: modelName, set: setModelName, placeholder: "gpt-4o" },
  ] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-background border border-rule rounded-xl p-5 w-80 space-y-4 shadow-2xl">
        <h3 className="font-mono text-sm text-parch">add custom model</h3>

        {fields.map(({ label, value, set, placeholder }) => (
          <div key={label} className="space-y-1">
            <label className="font-mono text-[10px] uppercase tracking-wider text-parch-2">
              {label}
            </label>
            <input
              value={value}
              onChange={(e) => (set as (v: string) => void)(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-ink-2 border border-rule rounded-lg px-3 py-2 font-mono text-xs text-parch placeholder:text-parch-2/40 focus:outline-none focus:border-gold-2"
            />
          </div>
        ))}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={!name.trim() || !modelName.trim()}
            className="flex-1 px-3 py-2 rounded-lg bg-parch text-ink font-mono text-xs hover:bg-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            save
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 rounded-lg border border-rule font-mono text-xs text-parch-2 hover:text-parch transition-colors"
          >
            cancel
          </button>
        </div>
      </div>
    </div>
  )
}
