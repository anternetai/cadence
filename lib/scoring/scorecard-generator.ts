/**
 * scorecard-generator.ts — Server-side scorecard generation from session data.
 *
 * Takes coaching session data (messages + audio metrics) and calls Gemini to
 * produce a structured 7-dimension scorecard with coaching feedback.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScorecardInput {
  messages: Array<{
    text: string
    type: string
    urgency: string
    confidence: number
    timestamp: number
    source: string
  }>
  sessionDurationMs: number
  // Layer 1 aggregate metrics
  avgTalkRatio: number
  avgVolume: number
  avgPace: number
  interruptionCount: number
  totalSilenceMs: number
}

export interface Scorecard {
  scores: {
    toneControl: number
    paceManagement: number
    objectionHandling: number
    closeQuality: number
    talkRatio: number
    energyMatching: number
    silenceUsage: number
    overall: number
  }
  didWell: string[]       // 3 things done well
  toImprove: string[]     // 3 things to improve
  priorityFocus: string   // 1 sentence for next call
  headline: string        // punchy 1-line verdict
  grade: "A" | "B" | "C" | "D" | "F"
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

// Dimension weights for overall score
const WEIGHTS = {
  toneControl:        0.15,
  paceManagement:     0.15,
  objectionHandling:  0.20,
  closeQuality:       0.20,
  talkRatio:          0.10,
  energyMatching:     0.10,
  silenceUsage:       0.10,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clampScore(score: unknown): number {
  const n = typeof score === "number" ? score : Number(score)
  return Math.max(1, Math.min(100, isNaN(n) ? 50 : Math.round(n)))
}

function computeOverall(scores: Omit<Scorecard["scores"], "overall">): number {
  const weighted =
    scores.toneControl       * WEIGHTS.toneControl +
    scores.paceManagement    * WEIGHTS.paceManagement +
    scores.objectionHandling * WEIGHTS.objectionHandling +
    scores.closeQuality      * WEIGHTS.closeQuality +
    scores.talkRatio         * WEIGHTS.talkRatio +
    scores.energyMatching    * WEIGHTS.energyMatching +
    scores.silenceUsage      * WEIGHTS.silenceUsage

  // Sum of weights is 1.0, but verify by dividing anyway
  const weightSum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
  return clampScore(weighted / weightSum)
}

function overallToGrade(overall: number): Scorecard["grade"] {
  if (overall >= 85) return "A"
  if (overall >= 70) return "B"
  if (overall >= 55) return "C"
  if (overall >= 40) return "D"
  return "F"
}

function buildFallback(): Scorecard {
  const scores = {
    toneControl:        50,
    paceManagement:     50,
    objectionHandling:  50,
    closeQuality:       50,
    talkRatio:          50,
    energyMatching:     50,
    silenceUsage:       50,
  }
  return {
    scores: { ...scores, overall: 50 },
    didWell: [
      "You completed the call — that counts.",
      "Your energy stayed consistent throughout.",
      "You stayed on track with the core message.",
    ],
    toImprove: [
      "Build more specific objection responses for your prospect's industry.",
      "Work on your talk-to-listen ratio — aim for 50/50.",
      "Add a sharper close attempt before wrapping up.",
    ],
    priorityFocus: "Focus on listening more — let the prospect guide the conversation.",
    headline: "Solid effort. Keep building.",
    grade: "C",
  }
}

function buildPrompt(input: ScorecardInput): string {
  const durationMin = (input.sessionDurationMs / 60000).toFixed(1)
  const talkRatioPct = Math.round(input.avgTalkRatio * 100)
  const silenceSec = (input.totalSilenceMs / 1000).toFixed(1)

  const nudgeSummary = input.messages.map((m, i) =>
    `${i + 1}. [${m.type}/${m.urgency}] (src: ${m.source}) "${m.text}"`
  ).join("\n")

  return `You are an expert sales coach reviewing a completed sales call. Score the rep across 7 dimensions based on the coaching nudges received and audio metrics.

## CALL METRICS
- Duration: ${durationMin} minutes
- Talk ratio (rep speaking): ${talkRatioPct}%
- Average pace: ${input.avgPace.toFixed(1)} segments/min
- Average volume: ${(input.avgVolume * 100).toFixed(0)}/100
- Interruption count: ${input.interruptionCount}
- Total silence: ${silenceSec}s

## COACHING NUDGES RECEIVED DURING CALL (${input.messages.length} total)
${nudgeSummary || "(No nudges triggered — session was clean or very short)"}

## SCORING TASK
Score each of these 7 dimensions from 1–100:

1. **toneControl** — Was the rep's tone confident, calm, and controlled? Did they stay composed?
2. **paceManagement** — Was speech pace appropriate? Did they slow down for emphasis? Avoid rushing?
3. **objectionHandling** — Did RED_FLAG nudges indicate poor objection handling? Were objection-related nudges frequent?
4. **closeQuality** — Did the rep show closing signals? Were there missed close opportunities flagged?
5. **talkRatio** — Was the talk ratio balanced? 50% is ideal; 70%+ is penalized.
6. **energyMatching** — Did the rep's volume/energy stay appropriate? No "too loud" or "too quiet" warnings?
7. **silenceUsage** — Were silences strategic or awkward? Long silence nudges indicate problems.

## RESPONSE FORMAT
Respond with ONLY valid JSON matching this exact structure. No markdown, no code fences, just raw JSON:

{
  "scores": {
    "toneControl": <1-100>,
    "paceManagement": <1-100>,
    "objectionHandling": <1-100>,
    "closeQuality": <1-100>,
    "talkRatio": <1-100>,
    "energyMatching": <1-100>,
    "silenceUsage": <1-100>
  },
  "didWell": ["<specific observation>", "<specific observation>", "<specific observation>"],
  "toImprove": ["<specific actionable>", "<specific actionable>", "<specific actionable>"],
  "priorityFocus": "<1 sentence focus for next call>",
  "headline": "<punchy 1-line verdict, max 12 words>"
}

Rules:
- didWell and toImprove MUST each have exactly 3 items
- Be specific to the actual nudge data, not generic
- If talk ratio was high, penalize talkRatio score (60%+ = below 50, 70%+ = below 30)
- If no objection nudges were fired, give objectionHandling a high score (80+)
- If no longSilence nudges, give silenceUsage a high score
- headline must be punchy and specific, not "Good call overall"`
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function generateScorecard(input: ScorecardInput): Promise<Scorecard> {
  if (!GEMINI_API_KEY) {
    console.warn("[scorecard-generator] GEMINI_API_KEY not set — returning fallback.")
    return buildFallback()
  }

  const prompt = buildPrompt(input)

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "You are an expert sales performance coach. You analyze sales calls and provide accurate, specific, actionable feedback. Always respond with valid JSON only — no markdown, no code fences." }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[scorecard-generator] Gemini API error:", response.status, errorText)
      return buildFallback()
    }

    const data = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>
        }
      }>
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    if (!rawText) {
      console.error("[scorecard-generator] Empty response from Gemini.")
      return buildFallback()
    }

    // Strip markdown code fences if Gemini includes them despite instruction
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim()

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>
    } catch {
      console.error("[scorecard-generator] Failed to parse Gemini JSON:", cleaned)
      return buildFallback()
    }

    // Validate and extract scores
    const rawScores = (parsed.scores ?? {}) as Record<string, unknown>
    const scores = {
      toneControl:        clampScore(rawScores.toneControl),
      paceManagement:     clampScore(rawScores.paceManagement),
      objectionHandling:  clampScore(rawScores.objectionHandling),
      closeQuality:       clampScore(rawScores.closeQuality),
      talkRatio:          clampScore(rawScores.talkRatio),
      energyMatching:     clampScore(rawScores.energyMatching),
      silenceUsage:       clampScore(rawScores.silenceUsage),
    }
    const overall = computeOverall(scores)
    const grade = overallToGrade(overall)

    // Validate arrays — ensure exactly 3 items each
    const rawDidWell = Array.isArray(parsed.didWell)
      ? (parsed.didWell as unknown[]).slice(0, 3).map(String)
      : []
    const rawToImprove = Array.isArray(parsed.toImprove)
      ? (parsed.toImprove as unknown[]).slice(0, 3).map(String)
      : []

    const fallback = buildFallback()
    const didWell: string[] = rawDidWell.length === 3 ? rawDidWell : fallback.didWell
    const toImprove: string[] = rawToImprove.length === 3 ? rawToImprove : fallback.toImprove

    const priorityFocus =
      typeof parsed.priorityFocus === "string" && parsed.priorityFocus.trim()
        ? parsed.priorityFocus.trim()
        : fallback.priorityFocus

    const headline =
      typeof parsed.headline === "string" && parsed.headline.trim()
        ? parsed.headline.trim()
        : fallback.headline

    return {
      scores: { ...scores, overall },
      didWell,
      toImprove,
      priorityFocus,
      headline,
      grade,
    }
  } catch (err) {
    console.error("[scorecard-generator] Unexpected error:", err)
    return buildFallback()
  }
}
