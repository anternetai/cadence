"use client"

/**
 * useAudioMetrics — React hook for real-time audio metrics (Layer 1).
 * Wraps ClientAudioAnalyzer and provides reactive state, throttled to 100ms
 * to avoid excessive React renders (analyzer fires at 50ms internally).
 */

import { useState, useCallback, useRef, useEffect } from "react"
import { ClientAudioAnalyzer, type AudioMetrics } from "./client-analyzer"

const DEFAULT_METRICS: AudioMetrics = {
  talkRatio: 0,
  volume: 0,
  volumeTrend: "stable",
  pace: 0,
  paceVsBaseline: 1,
  silenceDuration: 0,
  isSpeaking: false,
  isProspectSpeaking: false,
  interruptionCount: 0,
}

export function useAudioMetrics(options?: {
  baselinePace?: number
  baselineVolume?: number
}) {
  const [metrics, setMetrics] = useState<AudioMetrics>(DEFAULT_METRICS)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzerRef = useRef<ClientAudioAnalyzer | null>(null)

  // Throttle React state updates to 100ms even though the analyzer fires at 50ms.
  // We hold the latest metrics in a ref and flush it on a 100ms interval.
  const pendingMetricsRef = useRef<AudioMetrics | null>(null)
  const throttleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(
    (localStream: MediaStream, remoteStream: MediaStream | null) => {
      // Tear down any existing analyzer first
      if (analyzerRef.current) {
        analyzerRef.current.stop()
        analyzerRef.current = null
      }
      if (throttleIntervalRef.current !== null) {
        clearInterval(throttleIntervalRef.current)
        throttleIntervalRef.current = null
      }

      const analyzer = new ClientAudioAnalyzer({
        onMetrics: (m) => {
          // Don't call setMetrics directly — stash into ref and let the
          // throttle interval flush it at 100ms cadence.
          pendingMetricsRef.current = m
        },
        baselinePace: options?.baselinePace,
        baselineVolume: options?.baselineVolume,
      })

      analyzerRef.current = analyzer
      analyzer.start(localStream, remoteStream)
      setIsAnalyzing(true)
      setMetrics(DEFAULT_METRICS)

      // Flush latest metrics into React state every 100ms
      throttleIntervalRef.current = setInterval(() => {
        if (pendingMetricsRef.current !== null) {
          setMetrics(pendingMetricsRef.current)
          pendingMetricsRef.current = null
        }
      }, 100)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options?.baselinePace, options?.baselineVolume]
  )

  const stop = useCallback(() => {
    if (throttleIntervalRef.current !== null) {
      clearInterval(throttleIntervalRef.current)
      throttleIntervalRef.current = null
    }
    if (analyzerRef.current) {
      analyzerRef.current.stop()
      analyzerRef.current = null
    }
    pendingMetricsRef.current = null
    setIsAnalyzing(false)
    setMetrics(DEFAULT_METRICS)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (throttleIntervalRef.current !== null) {
        clearInterval(throttleIntervalRef.current)
      }
      analyzerRef.current?.stop()
    }
  }, [])

  return { metrics, isAnalyzing, start, stop }
}
