"use client"

import { motion } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardCall {
  id: string
  date: string
  duration: number
  scores: {
    toneControl: number
    paceManagement: number
    objectionHandling: number
    closeQuality: number
    talkRatio: number
    energyMatching: number
    silenceUsage: number
    overall: number
  }
  grade: "A" | "B" | "C" | "D" | "F"
  nudgeCount: number
  headline: string
}

interface CallListProps {
  calls: DashboardCall[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const GRADE_STYLES: Record<DashboardCall["grade"], string> = {
  A: "bg-emerald-400/15 border-emerald-400/30 text-emerald-400",
  B: "bg-emerald-500/10 border-emerald-500/25 text-emerald-500",
  C: "bg-amber-400/15 border-amber-400/30 text-amber-400",
  D: "bg-amber-500/10 border-amber-500/25 text-amber-500",
  F: "bg-red-400/15 border-red-400/30 text-red-400",
}

// ─── Row ──────────────────────────────────────────────────────────────────────

interface CallRowProps {
  call: DashboardCall
  index: number
  isLast: boolean
}

function CallRow({ call, index, isLast }: CallRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 + index * 0.05 }}
      className={`px-5 py-3.5 ${!isLast ? "border-b border-white/[0.04]" : ""}`}
    >
      <div className="flex items-center gap-3">
        {/* Grade badge */}
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center
            text-xs font-bold
            ${GRADE_STYLES[call.grade]}
          `}
        >
          {call.grade}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 text-sm">{formatDate(call.date)}</span>
            <span className="text-zinc-700 text-xs">·</span>
            <span className="text-zinc-500 text-sm">{formatDuration(call.duration)}</span>
            <span className="text-zinc-700 text-xs">·</span>
            <span className="text-zinc-100 font-semibold tabular-nums text-sm">
              {call.scores.overall}/100
            </span>
          </div>
          <p className="text-zinc-600 text-xs mt-0.5 truncate">{call.headline}</p>
        </div>

        {/* Nudge count */}
        {call.nudgeCount > 0 && (
          <div className="flex-shrink-0 text-right">
            <span className="text-zinc-700 text-xs">{call.nudgeCount} nudges</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CallList({ calls }: CallListProps) {
  const recent = calls.slice(0, 10)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.35 }}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <p className="text-zinc-300 text-sm font-medium">
          Recent Calls{" "}
          <span className="text-zinc-600 font-normal">({recent.length})</span>
        </p>
      </div>

      {/* Rows */}
      {recent.length === 0 ? (
        <div className="px-5 py-10 text-center text-zinc-600 text-sm">
          No calls yet. Start a session to see your history.
        </div>
      ) : (
        recent.map((call, i) => (
          <CallRow key={call.id} call={call} index={i} isLast={i === recent.length - 1} />
        ))
      )}
    </motion.div>
  )
}
