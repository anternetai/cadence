// Coaching message types
export type CoachingUrgency = "critical" | "adjust" | "positive"
export type NudgeType = "TACTIC" | "SIGNAL" | "RED_FLAG" | "SILENT"

export interface CoachingMessage {
  id: string
  text: string
  type: NudgeType
  urgency: CoachingUrgency
  confidence: number
  timestamp: number
  latencyMs: number
  sentiment?: string
  transcriptChunk?: string
}

// Audio metrics from Layer 1 (client-side)
export interface AudioMetrics {
  talkRatio: number          // 0-1, your talk vs prospect
  volume: number             // 0-1 normalized RMS
  volumeTrend: "rising" | "falling" | "stable"
  pace: number               // speech segments per minute
  paceVsBaseline: number     // ratio vs calibrated baseline (1.0 = normal)
  silenceDuration: number    // current silence in ms
  isSpeaking: boolean        // local mic active
  isProspectSpeaking: boolean
  interruptionCount: number
}

// User profile from Supabase
export interface CadenceProfile {
  id: string
  email: string
  industry: string | null
  callGoal: string | null
  script: string | null
  objections: string[] | null
  baselinePace: number | null
  baselineVolume: number | null
  baselineEnergy: number | null
  stripeCustomerId: string | null
  subscriptionStatus: "free" | "pro" | "team" | null
  createdAt: string
}

// Call record
export interface CadenceCall {
  id: string
  userId: string
  startedAt: string
  endedAt: string | null
  duration: number | null
  scores: CallScores | null
  transcript: string | null
  nudgeCount: number
  disposition: string | null
}

// Scorecard dimensions
export interface CallScores {
  toneControl: number       // 1-100
  paceManagement: number
  objectionHandling: number
  closeQuality: number
  talkRatio: number
  energyMatching: number
  silenceUsage: number
  overall: number           // weighted average
}

// WebSocket message types (browser <-> proxy)
export interface WSAudioChunk {
  type: "audio"
  data: string  // base64 PCM 16kHz mono
  sentAt: number
}

export interface WSCoachingResponse {
  type: "coaching"
  text: string
  nudgeType: NudgeType
  urgency: CoachingUrgency
  confidence: number
  sentiment: string | null
  transcriptChunk: string | null
  sentAt: number
}

export interface WSStatusMessage {
  type: "status"
  status: "connected" | "disconnected" | "error" | "reconnecting"
  message?: string
}

export interface WSSessionSummary {
  type: "summary"
  totalMessages: number
  criticalCount: number
  adjustCount: number
  positiveCount: number
  sessionDurationMs: number
}

export type WSMessageFromProxy = WSCoachingResponse | WSStatusMessage | WSSessionSummary
export type WSMessageFromBrowser = WSAudioChunk | { type: "start"; context?: SessionContext } | { type: "stop" }

export interface SessionContext {
  industry?: string
  callGoal?: string
  script?: string
  objections?: string[]
}

// Audio config constants
export const AUDIO_CONFIG = {
  sampleRate: 16000,
  channels: 1,
  encoding: "pcm16" as const,
  chunkIntervalMs: 30,
} as const
