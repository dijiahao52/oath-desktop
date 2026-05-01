import { useState } from "react"
import type { ModelConfig } from "@/lib/model-storage"
import { ModelForm } from "@/components/model-form"

interface ModelSwitcherProps {
  models: ModelConfig[]
  activeModelId: string
  onSelect: (id: string) => void
  onAddModel: (model: ModelConfig) => void
}

export function ModelSwitcher({
  models,
  activeModelId,
  onSelect,
  onAddModel,
}: ModelSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const activeModel = models.find((m) => m.id === activeModelId) ?? models[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rule hover:border-gold-2 font-mono text-xs text-parch transition-colors"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
        <span>{activeModel?.name ?? "model"}</span>
        <span className="text-parch-2/60 text-[10px]">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-background border border-rule rounded-lg shadow-xl overflow-hidden">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => { onSelect(m.id); setOpen(false) }}
                className={`w-full text-left px-3 py-2.5 font-mono text-xs transition-colors flex items-center gap-2 ${
                  m.id === activeModelId
                    ? "bg-rule/60 text-parch"
                    : "text-parch-2 hover:bg-rule/30 hover:text-parch"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    m.id === activeModelId ? "bg-gold" : "bg-transparent"
                  }`}
                />
                <div>
                  <div>{m.name}</div>
                  <div className="text-parch-2/50 text-[10px]">{m.model_name}</div>
                </div>
              </button>
            ))}
            <div className="border-t border-rule">
              <button
                onClick={() => { setShowForm(true); setOpen(false) }}
                className="w-full text-left px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-parch-2/70 hover:text-gold transition-colors"
              >
                + add custom model
              </button>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <ModelForm
          onSave={(m) => { onAddModel(m); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
