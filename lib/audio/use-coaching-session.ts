"use client"

/**
 * useCoachingSession — Orchestrates both coaching layers.
 *
 * Layer 1: Client-side audio analysis (talk ratio, volume, pace, silence)
 * Layer 2: Gemini AI coaching via WebSocket proxy (objections, signals, tactics)
 *
 * This hook manages:
 * - Mic capture lifecycle
 * - Layer 1 analyzer start/stop
 * - Layer 2 WebSocket connection + audio streaming
 * - Coaching message aggregation from both layers
 * - Session state (idle → connecting → active → ended)
 */

import { useState, useCallback, useRef, useEffect } from "react"
import { useAudioMetrics } from "./use-audio-metrics"
import { startAudioCapture, type AudioCaptureHandle } from "./audio-capture"
import { createAudioResampler, type AudioResamplerHandle } from "./audio-resampler"

// ─── Types ───────────────────────────────────────────────────────────────────

interface CoachingMessage {
  id: string
  text: string
  type: "TACTIC" | "SIGNAL" | "RED_FLAG" | "SILENT"
  urgency: "critical" | "adjust" | "positive"
  confidence: number
  timestamp: number
  latencyMs: number
  /** Which layer generated this message. */
  source: "layer1" | "layer2"
}

type SessionState = "idle" | "connecting" | "active" | "ended"

interface SessionContext {
  industry?: string
  callGoal?: string
  script?: string
  objections?: string[]
}

// ─── Layer 1 nudge definitions ────────────────────────────────────────────────

interface NudgeRule {
  key: string
  cooldownMs: number
}

const NUDGE_COOLDOWN_MS = 15000 // don't repeat same nudge within 15s

// Keys that track the last time each nudge was fired
const NUDGE_RULES: NudgeRule[] = [
  { key: "talkRatio",     cooldownMs: NUDGE_COOLDOWN_MS },
  { key: "longSilence",   cooldownMs: NUDGE_COOLDOWN_MS },
  { key: "volumeRising",  cooldownMs: NUDGE_COOLDOWN_MS },
  { key: "paceTooFast",   cooldownMs: NUDGE_COOLDOWN_MS },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_GEMINI_WS_URL ?? "ws://localhost:8765"
const MAX_MESSAGES = 100

// Number of consecutive volume-rising checks before nudging
const VOLUME_RISING_STREAK_THRESHOLD = 3

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCoachingSession(context?: SessionContext) {
  const [state, setState] = useState<SessionState>("idle")
  const [messages, setMessages] = useState<CoachingMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [latency, setLatency] = useState<number | null>(null)

  const { metrics, isAnalyzing, start: startAnalyzer, stop: stopAnalyzer } = useAudioMetrics()

  const captureRef    = useRef<AudioCaptureHandle | null>(null)
  const resamplerRef  = useRef<AudioResamplerHandle | null>(null)
  const wsRef         = useRef<WebSocket | null>(null)
  const messageIdRef  = useRef(0)

  // Nudge cooldown tracking: key → timestamp of last fire
  const nudgeCooldownRef = useRef<Record<string, number>>({})

  // Volume rising streak counter
  const volumeRisingStreakRef = useRef(0)

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const nextId = () => {
    messageIdRef.current += 1
    return `msg-${messageIdRef.current}-${Date.now()}`
  }

  const addMessage = useCallback((msg: Omit<CoachingMessage, "id">) => {
    setMessages((prev) => {
      const next = [...prev, { ...msg, id: nextId() }]
      // Cap at MAX_MESSAGES — drop oldest
      return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next
    })
  }, [])

  /** Returns true if the nudge is off-cooldown and records the fire time. */
  const canNudge = (key: string): boolean => {
    const now = Date.now()
    const last = nudgeCooldownRef.current[key] ?? 0
    if (now - last >= NUDGE_COOLDOWN_MS) {
      nudgeCooldownRef.current[key] = now
      return true
    }
    return false
  }

  // ─── Layer 1 nudge generation ─────────────────────────────────────────────

  // This runs whenever the metrics ref updates. We use a ref to the latest
  // metrics so we don't need to re-create this callback on every render.
  const metricsRef = useRef(metrics)
  useEffect(() => {
    metricsRef.current = metrics
  }, [metrics])

  // Metrics-based nudge effect — fires whenever metrics change
  useEffect(() => {
    if (!isAnalyzing) return

    const m = metrics
    const now = Date.now()

    // 1. Talking too much (talk ratio > 0.7)
    if (m.talkRatio > 0.7 && canNudge("talkRatio")) {
      addMessage({
        text: "Let them talk — you're doing most of the talking.",
        type: "RED_FLAG",
        urgency: "critical",
        confidence: 1,
        timestamp: now,
        latencyMs: 0,
        source: "layer1",
      })
    }

    // 2. Long silence (> 5s)
    if (m.silenceDuration > 5000 && canNudge("longSilence")) {
      addMessage({
        text: "Re-engage — there's been a long silence.",
        type: "RED_FLAG",
        urgency: "adjust",
        confidence: 1,
        timestamp: now,
        latencyMs: 0,
        source: "layer1",
      })
    }

    // 3. Volume rising streak (3+ consecutive rising readings)
    if (m.volumeTrend === "rising") {
      volumeRisingStreakRef.current += 1
    } else {
      volumeRisingStreakRef.current = 0
    }
    if (
      volumeRisingStreakRef.current >= VOLUME_RISING_STREAK_THRESHOLD &&
      canNudge("volumeRising")
    ) {
      addMessage({
        text: "Bring your energy down — you're getting louder.",
        type: "RED_FLAG",
        urgency: "adjust",
        confidence: 1,
        timestamp: now,
        latencyMs: 0,
        source: "layer1",
      })
    }

    // 4. Pace too fast (> 1.3x baseline)
    if (m.paceVsBaseline > 1.3 && canNudge("paceTooFast")) {
      addMessage({
        text: "Slow down — you're speaking too fast.",
        type: "RED_FLAG",
        urgency: "adjust",
        confidence: 1,
        timestamp: now,
        latencyMs: 0,
        source: "layer1",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics, isAnalyzing])

  // ─── WebSocket message handler ────────────────────────────────────────────

  const handleWsMessage = useCallback(
    (event: MessageEvent) => {
      let payload: unknown
      try {
        payload = JSON.parse(event.data as string)
      } catch {
        console.warn("[useCoachingSession] Received non-JSON WS message:", event.data)
        return
      }

      if (!payload || typeof payload !== "object") return
      const msg = payload as Record<string, unknown>

      const type = msg.type as string | undefined

      switch (type) {
        case "status": {
          const status = msg.status as string | undefined
          if (status === "connected") {
            // Server confirmed the session — start audio streaming
            setState("active")
            if (resamplerRef.current && !resamplerRef.current.isActive) {
              resamplerRef.current.start()
            }
          } else if (status === "error") {
            const reason = typeof msg.reason === "string" ? msg.reason : "Session error"
            setError(reason)
          }
          break
        }

        case "coaching": {
          // Coaching message from Layer 2 (Gemini proxy)
          const now = Date.now()
          const sentAt = typeof msg.sentAt === "number" ? msg.sentAt : now
          const computedLatency = now - sentAt

          setLatency(computedLatency)

          // Map proxy urgency to our type (proxy may use lowercase or different keys)
          const urgencyRaw = (msg.urgency ?? msg.priority ?? "adjust") as string
          const urgency: CoachingMessage["urgency"] =
            urgencyRaw === "critical"
              ? "critical"
              : urgencyRaw === "positive"
              ? "positive"
              : "adjust"

          const nudgeType = (msg.nudgeType ?? "TACTIC") as string
          const messageType: CoachingMessage["type"] =
            nudgeType === "SIGNAL"
              ? "SIGNAL"
              : nudgeType === "RED_FLAG"
              ? "RED_FLAG"
              : nudgeType === "SILENT"
              ? "SILENT"
              : "TACTIC"

          addMessage({
            text: typeof msg.text === "string" ? msg.text : String(msg.text ?? ""),
            type: messageType,
            urgency,
            confidence: typeof msg.confidence === "number" ? msg.confidence : 0.8,
            timestamp: now,
            latencyMs: computedLatency,
            source: "layer2",
          })
          break
        }

        case "summary": {
          // Session summary — could be surfaced to UI in the future
          console.log("[useCoachingSession] Session summary received:", msg)
          break
        }

        default:
          console.log("[useCoachingSession] Unknown WS message type:", type, msg)
      }
    },
    [addMessage]
  )

  // ─── Session lifecycle ────────────────────────────────────────────────────

  const startSession = useCallback(async () => {
    setState("connecting")
    setError(null)
    setMessages([])
    nudgeCooldownRef.current = {}
    volumeRisingStreakRef.current = 0

    try {
      // 1. Capture microphone
      const capture = await startAudioCapture()
      captureRef.current = capture

      // 2. Start Layer 1 analyzer (no remote stream in V1)
      startAnalyzer(capture.localStream, null)

      // 3. Create audio resampler (doesn't start yet — waits for WS "connected" status)
      const resampler = createAudioResampler({
        localStream: capture.localStream,
        remoteStream: null,
        onChunk: (base64) => {
          const ws = wsRef.current
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({ type: "audio", data: base64, sentAt: Date.now() })
            )
          }
        },
      })
      resamplerRef.current = resampler

      // 4. Connect WebSocket for Layer 2
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("[useCoachingSession] WS connected — sending start signal.")
        ws.send(JSON.stringify({ type: "start", context: context ?? {} }))
      }

      ws.onmessage = handleWsMessage

      ws.onerror = (ev) => {
        console.error("[useCoachingSession] WS error:", ev)
        setError("WebSocket connection failed. Layer 2 coaching unavailable.")
        // Layer 1 continues — don't tear everything down on WS error
        setState("active")
        // Start resampler even without WS if it somehow hasn't started
        if (!resamplerRef.current?.isActive) {
          resamplerRef.current?.start()
        }
      }

      ws.onclose = (ev) => {
        console.log(`[useCoachingSession] WS closed (code=${ev.code}).`)
        // If we're still supposedly active, note the disconnect but keep Layer 1 going
        setState((prev) => (prev === "active" ? "active" : prev))
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start coaching session"
      setError(message)
      setState("idle")

      // Clean up anything partially initialized
      captureRef.current?.stop()
      captureRef.current = null
      stopAnalyzer()
    }
  }, [context, startAnalyzer, stopAnalyzer, handleWsMessage])

  const endSession = useCallback(() => {
    // 1. Stop audio resampler
    if (resamplerRef.current) {
      resamplerRef.current.stop()
      resamplerRef.current = null
    }

    // 2. Close WebSocket
    if (wsRef.current) {
      const ws = wsRef.current
      wsRef.current = null
      // Remove listeners before closing to prevent spurious state updates
      ws.onmessage = null
      ws.onerror = null
      ws.onclose = null
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        try {
          ws.send(JSON.stringify({ type: "stop" }))
        } catch {}
        ws.close(1000, "Session ended")
      }
    }

    // 3. Stop Layer 1 analyzer
    stopAnalyzer()

    // 4. Stop mic capture
    if (captureRef.current) {
      captureRef.current.stop()
      captureRef.current = null
    }

    setState("ended")
  }, [stopAnalyzer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endSession()
    }
    // We only want this to run on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    state,
    messages,
    metrics,
    isAnalyzing,
    error,
    latency,
    startSession,
    endSession,
    clearMessages: () => setMessages([]),
  }
}
