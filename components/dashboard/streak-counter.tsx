"use client"

import { motion } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────

interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
  /** ISO date strings of days that had a session, last 7 days most recent first */
  recentDays?: boolean[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StreakCounter({ currentStreak, longestStreak, recentDays }: StreakCounterProps) {
  // Default: last 7 days, filled based on streak
  const days = recentDays ?? Array.from({ length: 7 }, (_, i) => i < currentStreak)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.25 }}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5"
    >
      <p className="text-zinc-500 text-xs uppercase tracking-wider font-medium mb-4">
        Daily Streak
      </p>

      {/* Main number */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-5xl font-bold text-emerald-400 tabular-nums leading-none">
          {currentStreak}
        </span>
        {currentStreak >= 3 && (
          <span className="text-2xl leading-none" role="img" aria-label="fire">
            🔥
          </span>
        )}
      </div>

      <p className="text-zinc-400 text-sm mb-1">day streak</p>
      <p className="text-zinc-600 text-xs mb-5">Best: {longestStreak} days</p>

      {/* Last 7 days circles */}
      <div className="flex items-center gap-1.5">
        {days.map((filled, i) => (
          <div
            key={i}
            className={`
              w-5 h-5 rounded-full border transition-colors
              ${filled
                ? "bg-emerald-400/30 border-emerald-400/60"
                : "bg-white/[0.03] border-white/[0.08]"
              }
            `}
            title={filled ? "Session completed" : "No session"}
          />
        ))}
      </div>
      <p className="text-zinc-700 text-[10px] mt-1.5 tracking-wide">Last 7 days</p>
    </motion.div>
  )
}
