export type NudgeType = "TACTIC" | "SIGNAL" | "RED_FLAG" | "SILENT"
export type CoachingUrgency = "critical" | "adjust" | "positive"

// Messages from browser → proxy
export interface WSAudioChunk {
  type: "audio"
  data: string  // base64 PCM 16kHz mono
  sentAt: number
}

export interface WSStartMessage {
  type: "start"
  context?: SessionContext
}

export interface WSStopMessage {
  type: "stop"
}

export type WSMessageFromBrowser = WSAudioChunk | WSStartMessage | WSStopMessage

// Messages from proxy → browser
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

export type WSMessageToClient = WSCoachingResponse | WSStatusMessage | WSSessionSummary

// Session context from onboarding
export interface SessionContext {
  industry?: string
  callGoal?: string
  script?: string
  objections?: string[]
}

// Internal session tracking
export interface CoachingSession {
  id: string
  startedAt: number
  context: SessionContext
  messageCount: number
  criticalCount: number
  adjustCount: number
  positiveCount: number
  lastAudioAt: number
}
