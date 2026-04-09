"use client"

import { useEffect, useRef } from "react"
import { getDefaults } from "@/lib/onboarding/industry-defaults"

interface ScriptEditorProps {
  value: string
  onChange: (script: string) => void
  industry: string | null
}

export function ScriptEditor({ value, onChange, industry }: ScriptEditorProps) {
  const defaultScript = getDefaults(industry).script
  const charCount = value.length

  // Auto-resize textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 text-center">
        <h2 className="text-2xl font-semibold text-zinc-100">Got a script? Paste it here.</h2>
        <p className="text-sm text-zinc-400">
          Cadence will use this as context to coach your calls in real time.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.03] focus-within:border-white/[0.14] transition-colors duration-150">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste your call script here…"
            rows={7}
            className="w-full resize-none rounded-2xl bg-transparent px-4 py-4 pb-8 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none leading-relaxed"
            style={{ minHeight: "200px" }}
          />
          {/* Character count */}
          <span className="absolute bottom-3 right-4 text-xs text-zinc-600 tabular-nums pointer-events-none select-none">
            {charCount.toLocaleString()}
          </span>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onChange(defaultScript)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150 underline underline-offset-2"
          >
            Use default for {industry ?? "this industry"}
          </button>
          <button
            onClick={() => onChange("")}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
          >
            Clear
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-600">
        You can edit this anytime from your settings.
      </p>
    </div>
  )
}
