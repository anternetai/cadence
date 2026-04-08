"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface SessionHeaderProps {
  isMinimized: boolean
  onToggleMinimize: () => void
  onEnd: () => void
  duration: number
  nudgeCount: number
  latency: number | null
  error: string | null
}

export function SessionHeader({
  isMinimized,
  onToggleMinimize,
  onEnd,
  duration,
  nudgeCount,
  latency,
  error,
}: SessionHeaderProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now() - duration * 1000
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [duration])

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0")
  const seconds = String(elapsed % 60).padStart(2, "0")
  const timeDisplay = `${minutes}:${seconds}`

  const hasError = error !== null
  const latencyDisplay =
    latency !== null ? `${(latency / 1000).toFixed(1)}s` : null

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06]">
      {/* Live indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="relative flex h-2 w-2">
          <span
            className={[
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              hasError ? "bg-amber-400" : "bg-emerald-400",
            ].join(" ")}
          />
          <span
            className={[
              "relative inline-flex rounded-full h-2 w-2",
              hasError ? "bg-amber-400" : "bg-emerald-400",
            ].join(" ")}
          />
        </span>
        <span
          className={[
            "text-xs font-semibold tracking-widest uppercase",
            hasError ? "text-amber-400" : "text-emerald-400",
          ].join(" ")}
        >
          {hasError ? "Partial" : "Live"}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-white/[0.08]" />

      {/* Timer */}
      <span className="text-sm font-mono text-zinc-300 tabular-nums">
        {timeDisplay}
      </span>

      {/* Divider */}
      <div className="w-px h-4 bg-white/[0.08]" />

      {/* Nudge count */}
      <span className="text-sm text-zinc-400">
        {nudgeCount} {nudgeCount === 1 ? "nudge" : "nudges"}
      </span>

      {/* Latency — only when available */}
      {latencyDisplay !== null && (
        <>
          <div className="w-px h-4 bg-white/[0.08]" />
          <span className="text-xs text-zinc-600 tabular-nums">{latencyDisplay}</span>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Minimize toggle */}
      <button
        onClick={onToggleMinimize}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        aria-label={isMinimized ? "Expand overlay" : "Minimize overlay"}
      >
        <motion.div
          animate={{ rotate: isMinimized ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* Chevron down SVG */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </button>

      {/* End button */}
      <button
        onClick={onEnd}
        className="text-sm text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/[0.08] transition-colors"
      >
        End
      </button>
    </div>
  )
}
