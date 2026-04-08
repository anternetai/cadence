"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NudgeMessage {
  id: string
  text: string
  type: "TACTIC" | "SIGNAL" | "RED_FLAG" | "SILENT"
  urgency: "critical" | "adjust" | "positive"
  confidence: number
  timestamp: number
  latencyMs: number
  source: "layer1" | "layer2"
}

interface NudgeCardProps {
  message: NudgeMessage
  onDismiss?: (id: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  return `${Math.floor(seconds / 60)}m ago`
}

// ─── Urgency config ───────────────────────────────────────────────────────────

const urgencyConfig = {
  critical: {
    badge: "bg-red-500/10 text-red-400 border border-red-500/20",
    bar: "bg-red-500",
    barTrack: "bg-red-500/20",
    border: "border-red-500",
  },
  adjust: {
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    bar: "bg-amber-500",
    barTrack: "bg-amber-500/20",
    border: "border-amber-500",
  },
  positive: {
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    bar: "bg-emerald-500",
    barTrack: "bg-emerald-500/20",
    border: "border-emerald-500",
  },
} as const

// ─── Component ────────────────────────────────────────────────────────────────

export default function NudgeCard({ message, onDismiss }: NudgeCardProps) {
  const [timeLabel, setTimeLabel] = useState(() => timeAgo(message.timestamp))
  const [dismissed, setDismissed] = useState(false)
  const dismissedRef = useRef(false)

  // Update time-ago label every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLabel(timeAgo(message.timestamp))
    }, 1000)
    return () => clearInterval(interval)
  }, [message.timestamp])

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!dismissedRef.current) {
        dismissedRef.current = true
        setDismissed(true)
      }
    }, 8000)
    return () => clearTimeout(timeout)
  }, [message.id])

  function handleAnimationComplete() {
    if (dismissed) {
      onDismiss?.(message.id)
    }
  }

  const cfg = urgencyConfig[message.urgency]
  const isRedFlag = message.type === "RED_FLAG"
  const sourceLabel = message.source === "layer1" ? "Audio" : "AI"
  const isShort = message.text.length < 30
  const showConfidenceBar = message.confidence < 1.0
  const leftBorderWidth = isRedFlag ? "3px" : "2px"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12, scale: 0.98 }}
      animate={dismissed ? { opacity: 0, x: 12, scale: 0.98 } : { opacity: 1, x: 0, scale: 1 }}
      transition={dismissed
        ? { duration: 0.2, ease: "easeOut" }
        : { duration: 0.25, ease: "easeOut" }
      }
      onAnimationComplete={handleAnimationComplete}
      className={[
        "relative rounded-xl border border-white/[0.06] overflow-hidden",
        isRedFlag ? "bg-red-500/[0.06]" : "bg-white/[0.03]",
      ].join(" ")}
      style={{
        borderLeft: `${leftBorderWidth} solid`,
        borderLeftColor: isRedFlag
          ? "rgb(239 68 68)"      // red-500
          : message.urgency === "critical"
          ? "rgb(239 68 68)"
          : message.urgency === "adjust"
          ? "rgb(245 158 11)"     // amber-500
          : "rgb(16 185 129)",    // emerald-500
      }}
    >
      <div className="p-4 flex flex-col gap-3">
        {/* Top row: type badge + source + time */}
        <div className="flex items-center justify-between gap-2">
          {/* Type badge */}
          <span
            className={[
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase",
              cfg.badge,
            ].join(" ")}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
            {message.type.replace("_", " ")}
          </span>

          {/* Source + time */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 shrink-0">
            <span>{sourceLabel}</span>
            <span>·</span>
            <span>{timeLabel}</span>
          </div>
        </div>

        {/* Message text */}
        <p
          className={[
            "text-zinc-100 leading-snug",
            isShort ? "text-base font-medium" : "text-sm",
          ].join(" ")}
        >
          {message.text}
        </p>

        {/* Confidence bar */}
        {showConfidenceBar && (
          <div className="flex items-center gap-2">
            <div className={["flex-1 h-0.5 rounded-full", cfg.barTrack].join(" ")}>
              <div
                className={["h-full rounded-full transition-all duration-300", cfg.bar].join(" ")}
                style={{ width: `${Math.round(message.confidence * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-600 tabular-nums shrink-0">
              {Math.round(message.confidence * 100)}% confidence
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
