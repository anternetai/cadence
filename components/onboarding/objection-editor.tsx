"use client"

import { useRef } from "react"

interface ObjectionEditorProps {
  value: string[]
  onChange: (objections: string[]) => void
  industry: string | null
}

export function ObjectionEditor({ value, onChange }: ObjectionEditorProps) {
  const newInputRef = useRef<HTMLInputElement>(null)

  function update(index: number, text: string) {
    const next = [...value]
    next[index] = text
    onChange(next)
  }

  function remove(index: number) {
    const next = value.filter((_, i) => i !== index)
    onChange(next)
  }

  function addObjection() {
    onChange([...value, ""])
    // Focus the new input on next tick
    setTimeout(() => {
      newInputRef.current?.focus()
    }, 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Enter") {
      e.preventDefault()
      addObjection()
    }
    if (e.key === "Backspace" && value[index] === "" && value.length > 1) {
      e.preventDefault()
      remove(index)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 text-center">
        <h2 className="text-2xl font-semibold text-zinc-100">What objections do you hear most?</h2>
        <p className="text-sm text-zinc-400">
          Cadence will alert you and suggest counter-moves when these come up.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {value.map((objection, index) => {
          const isLast = index === value.length - 1
          return (
            <div
              key={index}
              className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 transition-colors duration-150 focus-within:border-white/[0.14]"
            >
              <span className="text-zinc-600 text-xs font-mono w-4 shrink-0 select-none">
                {String(index + 1).padStart(2, "0")}
              </span>
              <input
                ref={isLast ? newInputRef : undefined}
                value={objection}
                onChange={(e) => update(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                placeholder='e.g. "I&apos;m not interested"'
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
              />
              <button
                onClick={() => remove(index)}
                disabled={value.length <= 1}
                aria-label="Remove objection"
                className="shrink-0 text-zinc-600 hover:text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors duration-150 text-base leading-none"
              >
                ×
              </button>
            </div>
          )
        })}

        {/* Add button */}
        <button
          onClick={addObjection}
          className="flex items-center gap-2 rounded-2xl border border-dashed border-white/[0.06] bg-transparent px-4 py-2.5 text-sm text-zinc-500 hover:border-white/[0.12] hover:text-zinc-400 transition-all duration-150 cursor-pointer"
        >
          <span className="text-base leading-none">+</span>
          Add objection
        </button>
      </div>

      <p className="text-center text-xs text-zinc-600">
        Press Enter to add a new line. Backspace on empty to remove.
      </p>
    </div>
  )
}
