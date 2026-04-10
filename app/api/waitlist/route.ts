import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  let email: string | undefined
  let industry: string | undefined

  try {
    const body = (await request.json()) as { email?: string; industry?: string }
    email = body.email
    industry = body.industry
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("cadence_waitlist")
    .insert({ email, industry: industry ?? null, source: "landing" })

  if (error) {
    // Duplicate email — treat as success to avoid exposing existing users
    if (error.code === "23505") {
      return NextResponse.json({ message: "You're already on the list!" })
    }
    console.error("[waitlist] Insert error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }

  return NextResponse.json({ message: "You're on the list!" })
}
