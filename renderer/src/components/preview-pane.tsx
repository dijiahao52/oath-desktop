interface PreviewPaneProps {
  html: string
}

export function PreviewPane({ html }: PreviewPaneProps) {
  if (!html) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white">
        <p className="font-mono text-xs text-gray-400">
          preview appears here after a build that produces HTML
        </p>
      </div>
    )
  }

  return (
    <iframe
      srcDoc={html}
      sandbox="allow-scripts allow-same-origin allow-forms"
      className="w-full h-full border-0 bg-white"
      title="live preview"
    />
  )
}
