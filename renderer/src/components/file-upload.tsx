import { useRef } from "react"

interface FileUploadProps {
  fileContext: { name: string; content: string } | null
  onFileContent: (name: string, content: string) => void
  onClear: () => void
}

export function FileUpload({ fileContext, onFileContent, onClear }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      onFileContent(file.name, content)
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  if (fileContext) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gold-2/50 bg-gold/10">
        <span className="font-mono text-[10px] text-gold truncate max-w-[120px]">
          {fileContext.name}
        </span>
        <button
          onClick={onClear}
          aria-label="Remove file"
          className="text-gold/70 hover:text-gold transition-colors leading-none text-sm"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        accept=".txt,.md,.py,.js,.ts,.tsx,.jsx,.html,.css,.json,.csv"
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rule hover:border-gold-2 font-mono text-xs text-parch-2 hover:text-parch transition-colors"
      >
        <span>↑</span>
        <span>file</span>
      </button>
    </>
  )
}
