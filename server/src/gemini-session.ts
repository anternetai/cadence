/**
 * GeminiSession — Manages a real-time bidirectional session with Gemini Live API.
 *
 * Uses @google/genai SDK's `ai.live.connect()` for WebSocket streaming.
 * Receives PCM audio, sends to Gemini, parses coaching JSON responses.
 */

import { GoogleGenAI, Modality } from "@google/genai"
import type { LiveServerMessage } from "@google/genai"
import type { WSCoachingResponse, SessionContext, CoachingSession, NudgeType, CoachingUrgency } from "./types.js"
import { buildCoachingPrompt } from "./coaching-prompt.js"

const GEMINI_MODEL = "gemini-2.0-flash-live-001"

interface GeminiRawCoaching {
  nudgeType?: string
  urgency?: string
  text?: string
  confidence?: number
  sentiment?: string | null
  transcriptChunk?: string | null
}

function parseCoachingJSON(raw: string): GeminiRawCoaching | null {
  // Strip markdown fences if Gemini wraps it anyway
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
  try {
    return JSON.parse(stripped) as GeminiRawCoaching
  } catch {
    // Try to extract a JSON object from the string
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

function buildCoachingResponse(
  parsed: GeminiRawCoaching,
  rawText: string
): WSCoachingResponse {
  const nudgeType: NudgeType = isValidNudgeType(parsed.nudgeType)
    ? parsed.nudgeType
    : "SILENT"

  const urgency: CoachingUrgency = isValidUrgency(parsed.urgency)
    ? parsed.urgency
    : "adjust"

  const confidence = typeof parsed.confidence === "number"
    ? Math.min(1, Math.max(0, parsed.confidence))
    : 0.5

  return {
    type: "coaching",
    text: typeof parsed.text === "string" ? parsed.text : rawText,
    nudgeType,
    urgency,
    confidence,
    sentiment: parsed.sentiment ?? null,
    transcriptChunk: parsed.transcriptChunk ?? null,
    sentAt: Date.now(),
  }
}

export class GeminiLiveSession {
  private ai: GoogleGenAI
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private session: any
  private coachingSession: CoachingSession
  private context: SessionContext | undefined
  private onCoaching: (msg: WSCoachingResponse) => void
  private onError: (err: string) => void
  private onDisconnect: () => void
  private connected = false
  // Buffer for partial text chunks before turnComplete
  private textBuffer = ""

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
    const systemInstruction = buildCoachingPrompt(this.context)

    this.session = await this.ai.live.connect({
      model: GEMINI_MODEL,
      config: {
        responseModalities: [Modality.TEXT],
        systemInstruction,
      },
      callbacks: {
        onopen: () => {
          this.connected = true
          console.log(`[GeminiSession:${this.coachingSession.id}] Live session opened`)
        },
        onmessage: (message: LiveServerMessage) => {
          this.handleMessage(message)
        },
        onerror: (e: ErrorEvent) => {
          console.error(`[GeminiSession:${this.coachingSession.id}] Error:`, e.message ?? e)
          this.onError(e.message ?? "Gemini session error")
        },
        onclose: (e: CloseEvent) => {
          this.connected = false
          console.log(`[GeminiSession:${this.coachingSession.id}] Session closed — code ${e.code}`)
          this.onDisconnect()
        },
      },
    })
  }

  private handleMessage(message: LiveServerMessage): void {
    // Accumulate text parts into buffer
    const serverContent = message.serverContent
    if (!serverContent) return

    const parts = serverContent.modelTurn?.parts ?? []
    for (const part of parts) {
      if (part.text) {
        this.textBuffer += part.text
      }
    }

    // Only process when the turn is complete (full JSON is assembled)
    if (!serverContent.turnComplete) return

    const fullText = this.textBuffer.trim()
    this.textBuffer = ""

    if (!fullText) return

    const parsed = parseCoachingJSON(fullText)

    let coaching: WSCoachingResponse

    if (parsed) {
      coaching = buildCoachingResponse(parsed, fullText)
    } else {
      // Gemini returned something non-JSON — treat as plain TACTIC text
      console.warn(`[GeminiSession:${this.coachingSession.id}] Non-JSON response, treating as plain text:`, fullText.slice(0, 100))
      coaching = {
        type: "coaching",
        text: fullText.slice(0, 80),
        nudgeType: "TACTIC",
        urgency: "adjust",
        confidence: 0.6,
        sentiment: null,
        transcriptChunk: null,
        sentAt: Date.now(),
      }
    }

    // Skip SILENT nudges — no need to forward those to the client
    if (coaching.nudgeType === "SILENT") return

    // Update session stats
    this.coachingSession.messageCount++
    if (coaching.urgency === "critical") this.coachingSession.criticalCount++
    else if (coaching.urgency === "adjust") this.coachingSession.adjustCount++
    else if (coaching.urgency === "positive") this.coachingSession.positiveCount++

    this.onCoaching(coaching)
  }

  sendAudio(base64Pcm: string, sentAt: number): void {
    if (!this.connected || !this.session) {
      console.warn(`[GeminiSession:${this.coachingSession.id}] Attempted sendAudio when not connected`)
      return
    }
    this.coachingSession.lastAudioAt = sentAt
    this.session.sendRealtimeInput({
      media: {
        mimeType: "audio/pcm;rate=16000",
        data: base64Pcm,
      },
    })
  }

  async disconnect(): Promise<void> {
    if (this.session) {
      try {
        this.session.close()
      } catch (err) {
        console.warn(`[GeminiSession:${this.coachingSession.id}] Error closing session:`, err)
      }
      this.session = null
    }
    this.connected = false
    console.log(`[GeminiSession:${this.coachingSession.id}] Disconnected`)
  }

  getSummary(): CoachingSession {
    return { ...this.coachingSession }
  }

  isConnected(): boolean {
    return this.connected
  }
}
