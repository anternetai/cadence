/**
 * ClientAudioAnalyzer — Real-time browser-side audio analysis (Layer 1)
 *
 * Analyzes local (rep) and remote (prospect) audio channels independently.
 * Produces: talk ratio, volume, pace, silence detection, interruption detection.
 * All metrics computed locally — zero API cost, <100ms latency.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const SPEAKING_THRESHOLD = 0.015   // RMS below this = silence
const TALK_RATIO_WINDOW = 30000    // 30 second rolling window (ms)
const VOLUME_WINDOW = 5000         // 5 second rolling average (ms)
const SILENCE_SHORT = 3000         // < 3s = natural
const SILENCE_LONG = 5000          // > 5s = flag
const SPEECH_GAP_MS = 300          // gap between speech segments before new one counts
const ANALYSIS_INTERVAL = 50       // 50ms analysis loop (20 Hz)
const FFT_SIZE = 2048              // AnalyserNode FFT size

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AudioMetrics {
  /** Fraction of combined speaking time that is local (rep). 0–1. */
  talkRatio: number
  /** Normalized RMS of local channel. 0–1. */
  volume: number
  /** Whether local volume is trending up, down, or stable over the last 5s vs prior 5s. */
  volumeTrend: "rising" | "falling" | "stable"
  /** Speech-to-silence transitions per minute for local channel (pace proxy). */
  pace: number
  /** Current pace divided by baseline pace. 1 = on-baseline. */
  paceVsBaseline: number
  /** How long both channels have been silent (ms). 0 when speech is detected. */
  silenceDuration: number
  /** Is the local (rep) channel currently above the speaking threshold? */
  isSpeaking: boolean
  /** Is the remote (prospect) channel currently above the speaking threshold? */
  isProspectSpeaking: boolean
  /** Cumulative count of interruptions (both channels active simultaneously). */
  interruptionCount: number
}

export type MetricsCallback = (metrics: AudioMetrics) => void

// ─── Rolling buffer helper ────────────────────────────────────────────────────

interface TimestampedValue {
  ts: number
  value: number
}

function trimOlderThan(arr: TimestampedValue[], windowMs: number, now: number) {
  const cutoff = now - windowMs
  while (arr.length > 0 && arr[0].ts < cutoff) arr.shift()
}

// ─── Class ───────────────────────────────────────────────────────────────────

export class ClientAudioAnalyzer {
  private onMetrics: MetricsCallback
  private baselinePace: number
  private baselineVolume: number

  private audioCtx: AudioContext | null = null
  private localAnalyser: AnalyserNode | null = null
  private remoteAnalyser: AnalyserNode | null = null
  private intervalId: ReturnType<typeof setInterval> | null = null

  // --- Talk ratio tracking ---
  // Rolling windows of { ts, value: 1 } stamps pushed while speaking
  private localSpeakingStamps: TimestampedValue[] = []
  private remoteSpeakingStamps: TimestampedValue[] = []

  // --- Volume tracking ---
  private volumeSamples: TimestampedValue[] = [] // local rms samples over VOLUME_WINDOW*2

  // --- Pace tracking ---
  // Each entry is a timestamp of a speech-start transition (local channel)
  private speechTransitions: number[] = []   // timestamps of speech starts within last 60s
  private localWasSpeaking = false
  private lastSpeechEndTime = 0

  // --- Silence tracking ---
  private silenceStartTime = 0
  private inSilence = false

  // --- Interruption tracking ---
  private interruptionCount = 0
  private wasInterrupting = false

  // --- Current metrics snapshot ---
  private currentMetrics: AudioMetrics = {
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

  constructor(options: {
    onMetrics: MetricsCallback
    baselinePace?: number
    baselineVolume?: number
  }) {
    this.onMetrics = options.onMetrics
    this.baselinePace = options.baselinePace ?? 15   // ~15 transitions/min is conversational
    this.baselineVolume = options.baselineVolume ?? 0.05
  }

  /** Start analyzing the given streams. Call stop() before calling start() again. */
  start(localStream: MediaStream, remoteStream: MediaStream | null): void {
    if (this.audioCtx) {
      console.warn("[ClientAudioAnalyzer] Already running — call stop() first.")
      return
    }

    this.audioCtx = new AudioContext()

    // --- Local analyser ---
    if (localStream.getAudioTracks().length > 0) {
      this.localAnalyser = this.audioCtx.createAnalyser()
      this.localAnalyser.fftSize = FFT_SIZE
      this.localAnalyser.smoothingTimeConstant = 0.3
      const localSource = this.audioCtx.createMediaStreamSource(localStream)
      localSource.connect(this.localAnalyser)
    }

    // --- Remote analyser ---
    if (remoteStream && remoteStream.getAudioTracks().length > 0) {
      try {
        this.remoteAnalyser = this.audioCtx.createAnalyser()
        this.remoteAnalyser.fftSize = FFT_SIZE
        this.remoteAnalyser.smoothingTimeConstant = 0.3
        const remoteSource = this.audioCtx.createMediaStreamSource(remoteStream)
        remoteSource.connect(this.remoteAnalyser)
      } catch (e) {
        console.warn("[ClientAudioAnalyzer] Failed to connect remote stream:", e)
      }
    }

    // Reset all state
    this.reset()

    // Start the analysis loop
    this.intervalId = setInterval(() => this._tick(), ANALYSIS_INTERVAL)
    console.log("[ClientAudioAnalyzer] Started.")
  }

  /** Stop analysis and close AudioContext. */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      try { this.audioCtx.close() } catch {}
    }
    this.audioCtx = null
    this.localAnalyser = null
    this.remoteAnalyser = null
    console.log("[ClientAudioAnalyzer] Stopped.")
  }

  /** Reset all rolling statistics without stopping. */
  reset(): void {
    this.localSpeakingStamps = []
    this.remoteSpeakingStamps = []
    this.volumeSamples = []
    this.speechTransitions = []
    this.localWasSpeaking = false
    this.lastSpeechEndTime = 0
    this.silenceStartTime = 0
    this.inSilence = false
    this.interruptionCount = 0
    this.wasInterrupting = false
    this.currentMetrics = {
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
  }

  /** Return the most recently computed metrics snapshot. */
  getMetrics(): AudioMetrics {
    return { ...this.currentMetrics }
  }

  // ─── Private: main analysis tick ───────────────────────────────────────────

  private _tick(): void {
    const now = Date.now()

    // Compute RMS for both channels
    const localRms = this.localAnalyser ? this._computeRms(this.localAnalyser) : 0
    const remoteRms = this.remoteAnalyser ? this._computeRms(this.remoteAnalyser) : 0

    const isSpeaking = localRms >= SPEAKING_THRESHOLD
    const isProspectSpeaking = remoteRms >= SPEAKING_THRESHOLD

    // --- Talk ratio ---
    if (isSpeaking) {
      this.localSpeakingStamps.push({ ts: now, value: 1 })
    }
    if (isProspectSpeaking) {
      this.remoteSpeakingStamps.push({ ts: now, value: 1 })
    }
    trimOlderThan(this.localSpeakingStamps, TALK_RATIO_WINDOW, now)
    trimOlderThan(this.remoteSpeakingStamps, TALK_RATIO_WINDOW, now)

    // Each stamp represents ANALYSIS_INTERVAL ms of speaking time
    const localMs = this.localSpeakingStamps.length * ANALYSIS_INTERVAL
    const remoteMs = this.remoteSpeakingStamps.length * ANALYSIS_INTERVAL
    const totalMs = localMs + remoteMs
    const talkRatio = totalMs > 0 ? localMs / totalMs : 0

    // --- Volume ---
    // Normalized: clamp at 0.3 RMS → maps to 1.0 (screaming)
    const normalizedVolume = Math.min(localRms / 0.3, 1)
    this.volumeSamples.push({ ts: now, value: localRms })
    // Keep double the window so we can compare first half vs second half
    trimOlderThan(this.volumeSamples, VOLUME_WINDOW * 2, now)

    const volumeTrend = this._computeVolumeTrend(now)

    // --- Pace ---
    // Detect speech-start transitions (local channel)
    if (isSpeaking && !this.localWasSpeaking) {
      const gapSinceLastEnd = now - this.lastSpeechEndTime
      if (gapSinceLastEnd >= SPEECH_GAP_MS || this.lastSpeechEndTime === 0) {
        // New speech segment — record transition
        this.speechTransitions.push(now)
      }
    }
    if (!isSpeaking && this.localWasSpeaking) {
      this.lastSpeechEndTime = now
    }
    this.localWasSpeaking = isSpeaking

    // Trim transitions older than 60 seconds
    const PACE_WINDOW = 60000
    const cutoff = now - PACE_WINDOW
    while (this.speechTransitions.length > 0 && this.speechTransitions[0] < cutoff) {
      this.speechTransitions.shift()
    }

    // pace = transitions in last 60s (per minute)
    const pace = this.speechTransitions.length

    // --- Silence detection ---
    const bothSilent = !isSpeaking && !isProspectSpeaking
    let silenceDuration = 0
    if (bothSilent) {
      if (!this.inSilence) {
        this.inSilence = true
        this.silenceStartTime = now
      }
      silenceDuration = now - this.silenceStartTime
    } else {
      this.inSilence = false
      silenceDuration = 0
    }

    // --- Interruption detection ---
    const isInterrupting = isSpeaking && isProspectSpeaking
    if (isInterrupting && !this.wasInterrupting) {
      this.interruptionCount++
    }
    this.wasInterrupting = isInterrupting

    // --- Assemble metrics ---
    const metrics: AudioMetrics = {
      talkRatio,
      volume: normalizedVolume,
      volumeTrend,
      pace,
      paceVsBaseline: this.baselinePace > 0 ? pace / this.baselinePace : 1,
      silenceDuration,
      isSpeaking,
      isProspectSpeaking,
      interruptionCount: this.interruptionCount,
    }

    this.currentMetrics = metrics
    this.onMetrics(metrics)
  }

  // ─── Private: RMS computation ───────────────────────────────────────────────

  private _computeRms(analyser: AnalyserNode): number {
    const bufferLength = analyser.fftSize
    const dataArray = new Float32Array(bufferLength)
    analyser.getFloatTimeDomainData(dataArray)

    let sumOfSquares = 0
    for (let i = 0; i < bufferLength; i++) {
      sumOfSquares += dataArray[i] * dataArray[i]
    }
    return Math.sqrt(sumOfSquares / bufferLength)
  }

  // ─── Private: volume trend ──────────────────────────────────────────────────

  private _computeVolumeTrend(now: number): "rising" | "falling" | "stable" {
    if (this.volumeSamples.length < 4) return "stable"

    const halfWindowStart = now - VOLUME_WINDOW * 2
    const halfWindowMid = now - VOLUME_WINDOW

    const prevSamples = this.volumeSamples.filter(
      (s) => s.ts >= halfWindowStart && s.ts < halfWindowMid
    )
    const recentSamples = this.volumeSamples.filter((s) => s.ts >= halfWindowMid)

    if (prevSamples.length === 0 || recentSamples.length === 0) return "stable"

    const prevAvg = prevSamples.reduce((s, v) => s + v.value, 0) / prevSamples.length
    const recentAvg = recentSamples.reduce((s, v) => s + v.value, 0) / recentSamples.length

    const delta = recentAvg - prevAvg
    const threshold = prevAvg * 0.15 // 15% change = meaningful trend

    if (delta > threshold) return "rising"
    if (delta < -threshold) return "falling"
    return "stable"
  }
}
