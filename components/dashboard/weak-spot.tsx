"use client"

import { motion } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeakSpotProps {
  weakestDimension: string
  avgScore: number
  tip: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WeakSpot({ weakestDimension, avgScore, tip }: WeakSpotProps) {
  const pct = Math.max(0, Math.min(100, avgScore))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.3 }}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5"
    >
      {/* Label */}
      <p className="text-zinc-500 text-xs uppercase tracking-wider font-medium mb-3">
        Focus Area
      </p>

      {/* Dimension name + score */}
      <p className="text-amber-400 text-lg font-semibold leading-tight">
        {weakestDimension}
      </p>
      <p className="text-zinc-400 text-sm mt-0.5 mb-4">{avgScore}/100 avg</p>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full bg-amber-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
        />
      </div>

      {/* Tip */}
      <div className="rounded-xl bg-white/[0.04] border-l-2 border-amber-500/50 px-4 py-3">
        <p className="text-zinc-300 text-sm leading-relaxed">{tip}</p>
      </div>
    </motion.div>
  )
}
