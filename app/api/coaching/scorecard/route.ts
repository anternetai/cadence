import { NextResponse } from "next/server"
import { generateScorecard, type ScorecardInput } from "@/lib/scoring/scorecard-generator"

export async function POST(request: Request) {
  let input: ScorecardInput

  try {
    input = (await request.json()) as ScorecardInput
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  // Validate required fields
  if (
    !Array.isArray(input.messages) ||
    typeof input.sessionDurationMs !== "number" ||
    typeof input.avgTalkRatio !== "number" ||
    typeof input.avgVolume !== "number" ||
    typeof input.avgPace !== "number" ||
    typeof input.interruptionCount !== "number" ||
    typeof input.totalSilenceMs !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid required fields in ScorecardInput" },
      { status: 400 }
    )
  }

  const scorecard = await generateScorecard(input)
  return NextResponse.json(scorecard)
}
