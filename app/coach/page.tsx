"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useCoachingSession } from "@/lib/audio/use-coaching-session"
import { CoachingOverlay } from "@/components/coach/coaching-overlay"
import type { CoachingMessage } from "@/components/coach/coaching-overlay"

// ─── Idle / Start Screen ──────────────────────────────────────────────────────

function IdleScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      key="idle"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center justify-center gap-8 text-center px-6"
    >
      {/* Logo / wordmark */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2.5">
          {/* Simple dot-pulse mark */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
          </span>
          <span className="text-3xl font-semibold tracking-tight text-zinc-100">
            Cadence
          </span>
        </div>
        <p className="text-zinc-500 text-sm">Real-time AI sales coach</p>
      </div>

      {/* Taglines */}
      <div className="flex flex-col gap-1.5 max-w-xs">
        <p className="text-zinc-300 text-lg font-medium leading-snug">
          Ready when you are.
        </p>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Start a call, then hit go. Cadence listens and guides you to the close.
        </p>
      </div>

      {/* CTA */}
      <motion.button
        onClick={onStart}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="px-8 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.10] text-zinc-100 text-base font-medium transition-colors backdrop-blur-xl"
      >
        Start Session
      </motion.button>

      {/* Compatibility note */}
      <p className="text-zinc-600 text-xs">
        Works with Zoom, phone, Google Meet, any call
      </p>
    </motion.div>
  )
}

// ─── Connecting Screen ────────────────────────────────────────────────────────

function ConnectingScreen() {
  return (
    <motion.div
      key="connecting"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-center gap-3 text-zinc-400 text-sm"
    >
      {/* Pulsing dot */}
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
      </span>
      Connecting to coach&hellip;
    </motion.div>
  )
}

// ─── Ended Screen ─────────────────────────────────────────────────────────────

function EndedScreen({
  duration,
  nudgeCount,
  onRestart,
}: {
  duration: number
  nudgeCount: number
  onRestart: () => void
}) {
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  const durationDisplay =
    minutes > 0
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`

  return (
    <motion.div
      key="ended"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center gap-8 text-center px-6"
    >
      {/* Summary card */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] px-8 py-6 flex flex-col items-center gap-5 min-w-[260px]">
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            Session Complete
          </p>
          <p className="text-2xl font-semibold text-zinc-100 mt-1">
            {durationDisplay}
          </p>
        </div>

        <div className="w-full h-px bg-white/[0.06]" />

        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col items-start gap-0.5">
            <p className="text-xs text-zinc-600">Nudges received</p>
            <p className="text-xl font-semibold text-zinc-200">{nudgeCount}</p>
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <p className="text-xs text-zinc-600">Duration</p>
            <p className="text-xl font-semibold text-zinc-200">{durationDisplay}</p>
          </div>
        </div>
      </div>

      <motion.button
        onClick={onRestart}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="px-8 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.10] text-zinc-100 text-base font-medium transition-colors backdrop-blur-xl"
      >
        Start New Session
      </motion.button>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachPage() {
  const {
    state,
    messages,
    metrics,
    error,
    latency,
    startSession,
    endSession,
  } = useCoachingSession()

  // Duration: seconds from first message timestamp to now (for ended summary)
  const sessionDurationSeconds =
    messages.length > 0
      ? Math.floor((Date.now() - messages[0].timestamp) / 1000)
      : 0

  const isActive = state === "active" || state === "connecting"

  return (
    <div className="min-h-screen bg-[oklch(0.06_0_0)] flex items-center justify-center">
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <IdleScreen key="idle" onStart={startSession} />
        )}

        {state === "connecting" && (
          <ConnectingScreen key="connecting" />
        )}

        {state === "ended" && (
          <EndedScreen
            key="ended"
            duration={sessionDurationSeconds}
            nudgeCount={messages.length}
            onRestart={startSession}
          />
        )}
      </AnimatePresence>

      {/* Overlay — mounted while active or connecting */}
      <AnimatePresence>
        {isActive && (
          <CoachingOverlay
            messages={messages as CoachingMessage[]}
            metrics={metrics}
            state={state}
            latency={latency}
            error={error}
            onEnd={endSession}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
