"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ClientAudioAnalyzer } from "@/lib/audio/client-analyzer"
import type { AudioMetrics } from "@/lib/audio/client-analyzer"

const MAX_DURATION = 30 // seconds

interface Baseline {
  pace: number
  volume: number
}

interface PracticeRecordProps {
  onComplete: (baseline: Baseline) => void
}

type RecordState = "idle" | "recording" | "done"

export function PracticeRecord({ onComplete }: PracticeRecordProps) {
  const [recordState, setRecordState] = useState<RecordState>("idle")
  const [elapsed, setElapsed] = useState(0)
  const [baseline, setBaseline] = useState<Baseline | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzerRef = useRef<ClientAudioAnalyzer | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Accumulated metrics for averaging
  const metricsAccRef = useRef<{ pace: number; volume: number }[]>([])

  const stopRecording = useCallback(() => {
    // Stop timers
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }

    // Stop analyzer
    if (analyzerRef.current) {
      analyzerRef.current.stop()
      analyzerRef.current = null
    }

    // Stop mic stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    // Compute averages
    const samples = metricsAccRef.current
    if (samples.length === 0) {
      setBaseline({ pace: 15, volume: 0.05 })
    } else {
      const avgPace = samples.reduce((s, m) => s + m.pace, 0) / samples.length
      const avgVolume = samples.reduce((s, m) => s + m.volume, 0) / samples.length
      setBaseline({
        pace: Math.max(1, Math.round(avgPace)),
        volume: parseFloat(avgVolume.toFixed(4)),
      })
    }

    metricsAccRef.current = []
    setRecordState("done")
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    setElapsed(0)
    metricsAccRef.current = []

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch {
      setError("Microphone access denied. Please allow mic access and try again.")
      return
    }

    streamRef.current = stream
    setRecordState("recording")

    const onMetrics = (metrics: AudioMetrics) => {
      metricsAccRef.current.push({ pace: metrics.pace, volume: metrics.volume })
    }

    const analyzer = new ClientAudioAnalyzer({
      onMetrics,
      baselinePace: 15,
      baselineVolume: 0.05,
    })
    analyzer.start(stream, null)
    analyzerRef.current = analyzer

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)

    // Auto-stop at MAX_DURATION
    stopTimerRef.current = setTimeout(() => {
      stopRecording()
    }, MAX_DURATION * 1000)
  }, [stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
      if (analyzerRef.current) analyzerRef.current.stop()
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function handleSkip() {
    onComplete({ pace: 15, volume: 0.05 })
  }

  function handleContinue() {
    if (baseline) onComplete(baseline)
  }

  function handleRedo() {
    setBaseline(null)
    setElapsed(0)
    setRecordState("idle")
  }

  const progressPercent = Math.min((elapsed / MAX_DURATION) * 100, 100)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h2 className="text-2xl font-semibold text-zinc-100">Let&apos;s calibrate your baseline.</h2>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
          Record a 30-second practice pitch so Cadence can learn your natural pace and volume. This
          helps it give you more accurate coaching.
        </p>
      </div>

      {/* Record button area */}
      <div className="flex flex-col items-center gap-5">
        {recordState !== "done" && (
          <>
            {/* Circular record button */}
            <div className="relative flex items-center justify-center">
              {/* Pulsing ring when recording */}
              {recordState === "recording" && (
                <>
                  <span className="absolute inline-flex h-28 w-28 rounded-full bg-red-500/20 animate-ping" />
                  <span className="absolute inline-flex h-24 w-24 rounded-full bg-red-500/10 animate-pulse" />
                </>
              )}

              <button
                onClick={recordState === "idle" ? startRecording : stopRecording}
                className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200 ${
                  recordState === "recording"
                    ? "bg-red-500 hover:bg-red-400 shadow-[0_0_24px_4px_rgba(239,68,68,0.3)]"
                    : "bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.10]"
                }`}
                aria-label={recordState === "recording" ? "Stop recording" : "Start recording"}
              >
                {recordState === "recording" ? (
                  // Square = stop
                  <span className="h-6 w-6 rounded-sm bg-white" />
                ) : (
                  // Circle = mic / record
                  <span className="h-6 w-6 rounded-full bg-red-500" />
                )}
              </button>
            </div>

            {/* Timer */}
            <div className="flex flex-col items-center gap-2 w-full max-w-xs">
              {recordState === "recording" && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm text-zinc-300 tabular-nums font-medium">
                      {elapsed}s / {MAX_DURATION}s
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </>
              )}

              {recordState === "idle" && (
                <p className="text-xs text-zinc-500">Press the button and start your pitch</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center max-w-xs">{error}</p>
            )}

            {recordState === "idle" && (
              <button
                onClick={handleSkip}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-150 underline underline-offset-2"
              >
                Skip — use defaults
              </button>
            )}
          </>
        )}

        {/* Results after recording */}
        {recordState === "done" && baseline && (
          <div className="flex flex-col items-center gap-5 w-full">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-emerald-400/10 border border-emerald-400/20 mb-1">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-sm text-zinc-400">Baseline recorded</p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              <div className="flex flex-col gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <span className="text-xs text-zinc-500 uppercase tracking-wide">Pace</span>
                <span className="text-xl font-semibold text-zinc-100 tabular-nums">
                  {baseline.pace}
                </span>
                <span className="text-xs text-zinc-600">segments / min</span>
              </div>
              <div className="flex flex-col gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <span className="text-xs text-zinc-500 uppercase tracking-wide">Volume</span>
                <span className="text-xl font-semibold text-zinc-100 tabular-nums">
                  {(baseline.volume * 100).toFixed(1)}%
                </span>
                <span className="text-xs text-zinc-600">normalized RMS</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleRedo}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 underline underline-offset-2"
              >
                Redo
              </button>
              <button
                onClick={handleContinue}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-black transition-colors duration-150"
              >
                Start Coaching
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
