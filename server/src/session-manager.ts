/**
 * SessionManager — Tracks active coaching sessions.
 * Handles session creation, cleanup, and concurrency limits.
 */

import { GeminiLiveSession } from "./gemini-session.js"
import { GeminiFallbackSession } from "./gemini-fallback.js"
import type { WSCoachingResponse, SessionContext } from "./types.js"

type AnySession = GeminiLiveSession | GeminiFallbackSession

export class SessionManager {
  private sessions: Map<string, AnySession> = new Map()
  private maxSessions: number

  constructor(maxSessions = 50) {
    this.maxSessions = maxSessions
  }

  createSession(options: {
    id: string
    apiKey: string
    context?: SessionContext
    useFallback?: boolean
    onCoaching: (msg: WSCoachingResponse) => void
    onError: (err: string) => void
    onDisconnect: () => void
  }): AnySession {
    if (this.sessions.size >= this.maxSessions) {
      throw new Error(`Session limit reached (max ${this.maxSessions})`)
    }

    const SessionClass = options.useFallback ? GeminiFallbackSession : GeminiLiveSession

    const session = new SessionClass({
      apiKey: options.apiKey,
      sessionId: options.id,
      context: options.context,
      onCoaching: options.onCoaching,
      onError: options.onError,
      onDisconnect: options.onDisconnect,
    })

    this.sessions.set(options.id, session)
    console.log(`[SessionManager] Created session ${options.id} (${options.useFallback ? "fallback" : "live"}). Active: ${this.sessions.size}`)
    return session
  }

  getSession(id: string): AnySession | undefined {
    return this.sessions.get(id)
  }

  async removeSession(id: string): Promise<void> {
    const session = this.sessions.get(id)
    if (!session) return
    try {
      await session.disconnect()
    } catch (err) {
      console.warn(`[SessionManager] Error disconnecting session ${id}:`, err)
    }
    this.sessions.delete(id)
    console.log(`[SessionManager] Removed session ${id}. Active: ${this.sessions.size}`)
  }

  getActiveCount(): number {
    return this.sessions.size
  }

  async removeAll(): Promise<void> {
    const ids = [...this.sessions.keys()]
    await Promise.allSettled(ids.map(id => this.removeSession(id)))
  }
}
