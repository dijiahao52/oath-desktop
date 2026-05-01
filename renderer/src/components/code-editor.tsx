import { useState } from "react"
import Editor from "@monaco-editor/react"
import type { ParsedFile } from "@/types/oath"

interface CodeEditorProps {
  files: ParsedFile[]
}

export function CodeEditor({ files }: CodeEditorProps) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
        <p className="font-mono text-xs text-white/30">
          no files yet — run a build to see output here
        </p>
      </div>
    )
  }

  const file = files[Math.min(activeIdx, files.length - 1)]

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* File tabs */}
      {files.length > 1 && (
        <div className="flex items-center gap-0.5 px-2 py-1 border-b border-white/10 overflow-x-auto">
          {files.map((f, i) => (
            <button
              key={`${f.filename}-${i}`}
              onClick={() => setActiveIdx(i)}
              className={`font-mono text-xs px-3 py-1 rounded whitespace-nowrap transition-colors ${
                i === activeIdx
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              {f.filename}
            </button>
          ))}
        </div>
      )}

      {/* Monaco */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={file.language || "plaintext"}
          value={file.code}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  )
}
