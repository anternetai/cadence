"use client"

import { motion } from "framer-motion"
import { ScoreDimension } from "./score-dimension"
import type { Scorecard } from "@/lib/scoring/scorecard-generator"

// Re-export Scorecard so consumers can import from this module if needed
export type { Scorecard }

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScorecardProps {
  scorecard: Scorecard
  duration: number  // session duration in seconds
  onClose?: () => void
  onShare?: () => void
}

// ─── Grade Badge ──────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<Scorecard["grade"], string> = {
  A: "bg-emerald-400/15 border-emerald-400/30 text-emerald-400",
  B: "bg-emerald-500/10 border-emerald-500/25 text-emerald-500",
  C: "bg-amber-400/15 border-amber-400/30 text-amber-400",
  D: "bg-amber-500/10 border-amber-500/25 text-amber-500",
  F: "bg-red-400/15 border-red-400/30 text-red-400",
}

function GradeBadge({ grade }: { grade: Scorecard["grade"] }) {
  return (
    <div
      className={`
        flex items-center justify-center
        w-16 h-16 rounded-full border-2 text-3xl font-bold tracking-tight
        ${GRADE_COLORS[grade]}
      `}
    >
      {grade}
    </div>
  )
}

// ─── Section Divider ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-[10px] font-semibold tracking-widest text-zinc-600 uppercase whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  )
}

// ─── Duration Formatter ───────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

// ─── Score Dimensions Config ──────────────────────────────────────────────────

const DIMENSIONS: Array<{
  key: keyof Omit<Scorecard["scores"], "overall">
  label: string
}> = [
  { key: "toneControl",        label: "Tone Control" },
  { key: "paceManagement",     label: "Pace Management" },
  { key: "objectionHandling",  label: "Objection Handling" },
  { key: "closeQuality",       label: "Close Quality" },
  { key: "talkRatio",          label: "Talk Ratio" },
  { key: "energyMatching",     label: "Energy Matching" },
  { key: "silenceUsage",       label: "Silence Usage" },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function ScorecardDisplay({ scorecard, duration, onClose, onShare }: ScorecardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md mx-auto px-4"
    >
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
        {/* ── Header ── */}
        <div className="px-6 pt-7 pb-5 flex flex-col items-center gap-3 text-center">
          <GradeBadge grade={scorecard.grade} />

          <div className="flex flex-col gap-1">
            <p className="text-zinc-100 text-xl font-semibold tracking-tight">
              {scorecard.scores.overall}/100
            </p>
            <p className="text-zinc-400 text-sm italic leading-snug max-w-[280px]">
              &ldquo;{scorecard.headline}&rdquo;
            </p>
          </div>

          {/* Duration pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <span className="text-xs text-zinc-500">Session</span>
            <span className="text-xs font-semibold text-zinc-300 tabular-nums">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        <div className="px-6 pb-7 flex flex-col gap-5">
          {/* ── Scores ── */}
          <div className="flex flex-col gap-3.5">
            <SectionLabel>Scores</SectionLabel>

            {DIMENSIONS.map((dim, i) => (
              <ScoreDimension
                key={dim.key}
                label={dim.label}
                score={scorecard.scores[dim.key]}
                delay={0.05 + i * 0.07}
              />
            ))}

            {/* Overall — larger */}
            <div className="pt-1">
              <ScoreDimension
                label="Overall"
                score={scorecard.scores.overall}
                delay={0.05 + DIMENSIONS.length * 0.07}
                large
              />
            </div>
          </div>

          {/* ── What You Did Well ── */}
          <div className="flex flex-col gap-2.5">
            <SectionLabel>What you did well</SectionLabel>
            <ul className="flex flex-col gap-2">
              {scorecard.didWell.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-emerald-400 mt-0.5 text-sm flex-shrink-0">✓</span>
                  <span className="text-zinc-300 text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── To Improve ── */}
          <div className="flex flex-col gap-2.5">
            <SectionLabel>To improve</SectionLabel>
            <ul className="flex flex-col gap-2">
              {scorecard.toImprove.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-red-400 mt-0.5 text-sm flex-shrink-0">✗</span>
                  <span className="text-zinc-300 text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Priority Focus ── */}
          <div className="flex flex-col gap-2.5">
            <SectionLabel>Priority for next call</SectionLabel>
            <div className="rounded-xl bg-white/[0.04] border-l-2 border-emerald-500/60 px-4 py-3">
              <p className="text-zinc-300 text-sm leading-relaxed">
                {scorecard.priorityFocus}
              </p>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center gap-3 pt-1">
            {onShare && (
              <motion.button
                onClick={onShare}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.11] border border-white/[0.10] text-zinc-100 text-sm font-medium transition-colors backdrop-blur-xl"
              >
                Share Scorecard
              </motion.button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
