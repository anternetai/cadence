"use client"

import { motion } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreDimensionProps {
  label: string
  score: number   // 1–100
  delay?: number  // animation delay in seconds
  large?: boolean // larger bar for the overall score
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBarColor(score: number): string {
  if (score >= 85) return "bg-emerald-400"
  if (score >= 70) return "bg-emerald-500/80"
  if (score >= 55) return "bg-amber-400"
  if (score >= 40) return "bg-amber-500/80"
  return "bg-red-400"
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScoreDimension({
  label,
  score,
  delay = 0,
  large = false,
}: ScoreDimensionProps) {
  const barColor = getBarColor(score)
  const barHeight = large ? "h-3" : "h-2"
  const barBrightness = large ? "" : ""

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className={`text-sm ${large ? "text-zinc-200 font-medium" : "text-zinc-300"}`}>
          {label}
        </span>
        <span
          className={`text-sm tabular-nums ${
            large ? "text-zinc-100 font-bold" : "text-zinc-100 font-semibold"
          }`}
        >
          {score}/100
        </span>
      </div>

      {/* Bar track */}
      <div className={`w-full ${barHeight} rounded-full bg-white/[0.06] overflow-hidden`}>
        <motion.div
          className={`${barHeight} rounded-full ${barColor} ${barBrightness}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}
