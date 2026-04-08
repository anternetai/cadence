/**
 * Gemini Fallback — Standard generateContent with batched 10-second audio windows.
 * Used when Gemini Live API is unavailable or degraded.
 *
 * Same public interface as GeminiLiveSession so the proxy can swap between them.
 */

import { GoogleGenAI } from "@google/genai"
import type { WSCoachingResponse, SessionContext, CoachingSession, NudgeType, CoachingUrgency } from "./types.js"
import { buildCoachingPrompt } from "./coaching-prompt.js"

const FALLBACK_MODEL = "gemini-2.0-flash"
const WINDOW_MS = 10_000 // 10-second batch window

interface GeminiRawCoaching {
  nudgeType?: string
  urgency?: string
  text?: string
  confidence?: number
  sentiment?: string | null
  transcriptChunk?: string | null
}

function parseCoachingJSON(raw: string): GeminiRawCoaching | null {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
  try {
    return JSON.parse(stripped) as GeminiRawCoaching
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0]) as GeminiRawCoaching
      } catch {
        return null
      }
    }
    return null
  }
}

function isValidNudgeType(v: unknown): v is NudgeType {
  return v === "TACTIC" || v === "SIGNAL" || v === "RED_FLAG" || v === "SILENT"
}

function isValidUrgency(v: unknown): v is CoachingUrgency {
  return v === "critical" || v === "adjust" || v === "positive"
}

export class GeminiFallbackSession {
  private ai: GoogleGenAI
  private coachingSession: CoachingSession
  private context: SessionContext | undefined
  private onCoaching: (msg: WSCoachingResponse) => void
  private onError: (err: string) => void
  private onDisconnect: () => void
  private systemInstruction: string

  // Audio accumulator
  private audioChunks: string[] = []
  private windowTimer: ReturnType<typeof setTimeout> | null = null
  private active = false

  constructor(options: {
    apiKey: string
    sessionId: string
    context?: SessionContext
    onCoaching: (msg: WSCoachingResponse) => void
    onError: (err: string) => void
    onDisconnect: () => void
  }) {
    this.ai = new GoogleGenAI({ apiKey: options.apiKey })
    this.context = options.context
    this.onCoaching = options.onCoaching
    this.onError = options.onError
    this.onDisconnect = options.onDisconnect
    this.systemInstruction = buildCoachingPrompt(options.context)

    this.coachingSession = {
      id: options.sessionId,
      startedAt: Date.now(),
      context: options.context ?? {},
      messageCount: 0,
      criticalCount: 0,
      adjustCount: 0,
      positiveCount: 0,
      lastAudioAt: 0,
    }
  }

  async connect(): Promise<void> {
    this.active = true
    console.log(`[FallbackSession:${this.coachingSession.id}] Started (batched 10s window mode)`)
    // Kick off first window
    this.scheduleWindow()
  }

  sendAudio(base64Pcm: string, sentAt: number): void {
    if (!this.active) return
    this.coachingSession.lastAudioAt = sentAt
    this.audioChunks.push(base64Pcm)
  }

  async disconnect(): Promise<void> {
    this.active = false
    if (this.windowTimer) {
      clearTimeout(this.windowTimer)
      this.windowTimer = null
    }
    // Flush any remaining audio
    if (this.audioChunks.length > 0) {
      await this.flushWindow()
    }
    console.log(`[FallbackSession:${this.coachingSession.id}] Disconnected`)
    this.onDisconnect()
  }

  getSummary(): CoachingSession {
    return { ...this.coachingSession }
  }

  isConnected(): boolean {
    return this.active
  }

  private scheduleWindow(): void {
    if (!this.active) return
    this.windowTimer = setTimeout(async () => {
      await this.flushWindow()
      this.scheduleWindow() // Schedule next window
    }, WINDOW_MS)
  }

  private async flushWindow(): Promise<void> {
    if (this.audioChunks.length === 0) return

    // Concatenate all base64 chunks into a single audio blob
    const combinedBase64 = this.audioChunks.join("")
    this.audioChunks = []

    try {
      const response = await this.ai.models.generateContent({
        model: FALLBACK_MODEL,
        config: {
          systemInstruction: this.systemInstruction,
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "audio/pcm;rate=16000",
                  data: combinedBase64,
                },
              },
              {
                text: "Listen to this sales call audio and respond with your coaching JSON.",
              },
            ],
          },
        ],
      })

      const rawText = response.text?.trim() ?? ""
      if (!rawText) return

      const parsed = parseCoachingJSON(rawText)
      if (!parsed) {
        console.warn(`[FallbackSession:${this.coachingSession.id}] Non-JSON response:`, rawText.slice(0, 100))
        return
      }

      const nudgeType: NudgeType = isValidNudgeType(parsed.nudgeType) ? parsed.nudgeType : "SILENT"
      if (nudgeType === "SILENT") return

      const urgency: CoachingUrgency = isValidUrgency(parsed.urgency) ? parsed.urgency : "adjust"
      const confidence = typeof parsed.confidence === "number"
        ? Math.min(1, Math.max(0, parsed.confidence))
        : 0.5

      const coaching: WSCoachingResponse = {
        type: "coaching",
        text: typeof parsed.text === "string" ? parsed.text : "",
        nudgeType,
        urgency,
        confidence,
        sentiment: parsed.sentiment ?? null,
        transcriptChunk: parsed.transcriptChunk ?? null,
        sentAt: Date.now(),
      }

      // Update stats
      this.coachingSession.messageCount++
      if (urgency === "critical") this.coachingSession.criticalCount++
      else if (urgency === "adjust") this.coachingSession.adjustCount++
      else if (urgency === "positive") this.coachingSession.positiveCount++

      this.onCoaching(coaching)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[FallbackSession:${this.coachingSession.id}] generateContent error:`, msg)
      this.onError(`Fallback generation failed: ${msg}`)
    }
  }
}
