"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { SessionHeader } from "@/components/coach/session-header"
import type { AudioMetrics } from "@/lib/audio/client-analyzer"

import React from "react"

const NudgeFeed = dynamic(() => import("@/components/coach/nudge-feed"), {
  ssr: false,
}) as React.ComponentType<{ messages: CoachingMessage[] }>

const MetricsPanel = dynamic(() => import("@/components/coach/metrics-panel"), {
  ssr: false,
}) as React.ComponentType<{ metrics: AudioMetrics }>

const SentimentMeter = dynamic(() => import("@/components/coach/sentiment-meter"), {
  ssr: false,
}) as React.ComponentType<{ sentiment: string | null }>

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CoachingMessage {
  id: string
  text: string
  type: "TACTIC" | "SIGNAL" | "RED_FLAG" | "SILENT"
  urgency: "critical" | "adjust" | "positive"
  confidence: number
  timestamp: number
  latencyMs: number
  source: "layer1" | "layer2"
  sentiment?: "positive" | "negative" | "neutral" | null
}

export interface CoachingOverlayProps {
  messages: CoachingMessage[]
  metrics: AudioMetrics
  state: "connecting" | "active" | "ended"
  latency: number | null
  error: string | null
  onEnd: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLastSentiment(
  messages: CoachingMessage[]
): "positive" | "negative" | "neutral" | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.sentiment != null) return msg.sentiment
  }
  return null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CoachingOverlay({
  messages,
  metrics,
  state,
  latency,
  error,
  onEnd,
}: CoachingOverlayProps) {
  const [isMinimized, setIsMinimized] = useState(false)

  const lastSentiment = useMemo(() => getLastSentiment(messages), [messages])

  // Duration = seconds since first message, or 0
  const duration = useMemo(() => {
    if (messages.length === 0) return 0
    return Math.floor((Date.now() - messages[0].timestamp) / 1000)
  }, [messages])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      layout
      className="fixed inset-x-0 bottom-0 top-0 flex flex-col bg-[oklch(0.10_0_0.01)] border border-white/[0.06] backdrop-blur-xl z-50"
    >
      {/* Error banner — amber, non-alarming */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">
                Layer 2 coaching unavailable — real-time analysis still running.{" "}
                <span className="text-amber-400/70">{error}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header — always visible */}
      <SessionHeader
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized((v) => !v)}
        onEnd={onEnd}
        duration={duration}
        nudgeCount={messages.length}
        latency={latency}
        error={error}
      />

      {/* Main content — collapses when minimized */}
      <AnimatePresence initial={false}>
        {!isMinimized && (
          <motion.div
            key="overlay-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 overflow-hidden flex flex-col min-h-0"
          >
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-5 min-h-0">
              {/* Nudge Feed — primary focus area */}
              <div className="flex-1 min-h-0">
                <NudgeFeed messages={messages} />
              </div>

              {/* Metrics + Sentiment row */}
              <div className="flex flex-col gap-4 shrink-0">
                {/* Metrics panel */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
                  <MetricsPanel metrics={metrics} />
                </div>

                {/* Sentiment meter */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
                  <SentimentMeter sentiment={lastSentiment} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
