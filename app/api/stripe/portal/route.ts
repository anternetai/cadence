import { NextResponse } from "next/server"
import { stripe, APP_URL } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID required" }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[stripe portal] Error creating portal session:", err)
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    )
  }
}
