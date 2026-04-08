/**
 * Cadence WebSocket Proxy Server
 *
 * Accepts browser WebSocket connections, creates Gemini Live sessions,
 * and proxies audio/coaching between them.
 *
 * Port: 8765 (matches NEXT_PUBLIC_GEMINI_WS_URL default)
 */

import { WebSocketServer, WebSocket } from "ws"
import { randomUUID } from "crypto"
import dotenv from "dotenv"
import { SessionManager } from "./session-manager.js"
import type {
  WSMessageFromBrowser,
  WSCoachingResponse,
  WSStatusMessage,
  WSSessionSummary,
  WSMessageToClient,
} from "./types.js"

dotenv.config({ path: "../.env.local" })

// ─── Config ────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.WS_PORT ?? "8765", 10)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.error("[Cadence] FATAL: GEMINI_API_KEY is not set. Set it in .env.local or the environment.")
  process.exit(1)
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function send(ws: WebSocket, msg: WSMessageToClient): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

function sendStatus(
  ws: WebSocket,
  status: WSStatusMessage["status"],
  message?: string
): void {
  send(ws, { type: "status", status, message })
}

// ─── Server ─────────────────────────────────────────────────────────────────

const manager = new SessionManager(50)

const wss = new WebSocketServer({ port: PORT })

wss.on("connection", (ws: WebSocket, req) => {
  const connId = randomUUID()
  const remoteAddr = req.socket.remoteAddress ?? "unknown"
  console.log(`[Cadence] Client connected: ${connId} from ${remoteAddr} (active: ${wss.clients.size})`)

  // Each connection starts with no session — session is created on "start" message
  let sessionId: string | null = null

  ws.on("message", async (raw) => {
    let msg: WSMessageFromBrowser

    try {
      msg = JSON.parse(raw.toString()) as WSMessageFromBrowser
    } catch {
      console.warn(`[Cadence:${connId}] Received invalid JSON, ignoring`)
      return
    }

    switch (msg.type) {
      case "start": {
        // If a session is already running, stop it first
        if (sessionId) {
          console.log(`[Cadence:${connId}] Restarting — stopping existing session ${sessionId}`)
          await manager.removeSession(sessionId)
          sessionId = null
        }

        sessionId = randomUUID()
        console.log(`[Cadence:${connId}] Starting session ${sessionId}`)

        try {
          const session = manager.createSession({
            id: sessionId,
            apiKey: GEMINI_API_KEY!,
            context: msg.context,
            useFallback: false,
            onCoaching: (coaching: WSCoachingResponse) => {
              send(ws, coaching)
            },
            onError: (err: string) => {
              console.error(`[Cadence:${connId}] Session error: ${err}`)
              sendStatus(ws, "error", err)
            },
            onDisconnect: () => {
              console.log(`[Cadence:${connId}] Session ${sessionId} disconnected`)
              // Don't send "disconnected" status here — it fires on normal close too
            },
          })

          await session.connect()
          sendStatus(ws, "connected", `Session ${sessionId} ready`)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.error(`[Cadence:${connId}] Failed to start session: ${msg}`)
          sendStatus(ws, "error", `Failed to connect to Gemini: ${msg}`)
          // Try fallback if live fails
          if (sessionId) {
            await manager.removeSession(sessionId)
          }
          sessionId = randomUUID()
          console.log(`[Cadence:${connId}] Retrying with fallback session ${sessionId}`)
          try {
            const fallback = manager.createSession({
              id: sessionId,
              apiKey: GEMINI_API_KEY!,
              context: (msg as unknown as WSMessageFromBrowser & { type: "start" }).context,
              useFallback: true,
              onCoaching: (coaching: WSCoachingResponse) => {
                send(ws, coaching)
              },
              onError: (e: string) => {
                console.error(`[Cadence:${connId}] Fallback error: ${e}`)
                sendStatus(ws, "error", e)
              },
              onDisconnect: () => {
                console.log(`[Cadence:${connId}] Fallback session disconnected`)
              },
            })
            await fallback.connect()
            sendStatus(ws, "reconnecting", `Connected via fallback mode`)
          } catch (fallbackErr) {
            const fe = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
            console.error(`[Cadence:${connId}] Fallback also failed: ${fe}`)
            sendStatus(ws, "error", `All connection methods failed: ${fe}`)
            sessionId = null
          }
        }
        break
      }

      case "audio": {
        if (!sessionId) {
          // Silently drop audio before session starts
          return
        }
        const session = manager.getSession(sessionId)
        if (!session) return
        session.sendAudio(msg.data, msg.sentAt)
        break
      }

      case "stop": {
        if (!sessionId) return

        const session = manager.getSession(sessionId)
        const summary = session?.getSummary()

        await manager.removeSession(sessionId)
        sessionId = null

        if (summary) {
          const summaryMsg: WSSessionSummary = {
            type: "summary",
            totalMessages: summary.messageCount,
            criticalCount: summary.criticalCount,
            adjustCount: summary.adjustCount,
            positiveCount: summary.positiveCount,
            sessionDurationMs: Date.now() - summary.startedAt,
          }
          send(ws, summaryMsg)
        }

        sendStatus(ws, "disconnected", "Session ended")
        break
      }

      default: {
        console.warn(`[Cadence:${connId}] Unknown message type:`, (msg as { type: string }).type)
      }
    }
  })

  ws.on("close", async (code, reason) => {
    console.log(`[Cadence:${connId}] Connection closed — code ${code}, reason: ${reason.toString() || "none"}`)
    if (sessionId) {
      await manager.removeSession(sessionId)
      sessionId = null
    }
  })

  ws.on("error", (err) => {
    console.error(`[Cadence:${connId}] WebSocket error:`, err.message)
  })

  // Send initial greeting
  sendStatus(ws, "connected", "Cadence proxy ready — send 'start' to begin")
})

wss.on("error", (err) => {
  console.error("[Cadence] WebSocketServer error:", err)
})

console.log(`[Cadence] WS Proxy listening on port ${PORT}`)
console.log(`[Cadence] Gemini API key: ${GEMINI_API_KEY.slice(0, 8)}...`)

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[Cadence] ${signal} received — shutting down gracefully...`)

  // Close all active Gemini sessions
  await manager.removeAll()

  // Stop accepting new connections
  wss.close((err) => {
    if (err) {
      console.error("[Cadence] Error closing WebSocket server:", err)
      process.exit(1)
    }
    console.log("[Cadence] WebSocket server closed. Bye.")
    process.exit(0)
  })

  // Force exit after 5s if graceful shutdown hangs
  setTimeout(() => {
    console.error("[Cadence] Forced shutdown after timeout")
    process.exit(1)
  }, 5000).unref()
}

process.on("SIGINT", () => void shutdown("SIGINT"))
process.on("SIGTERM", () => void shutdown("SIGTERM"))
