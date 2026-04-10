import { NextResponse } from "next/server"
import { stripe, PRICES, APP_URL } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const { email, userId } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: PRICES.pro_monthly, quantity: 1 }],
      success_url: `${APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${APP_URL}/dashboard`,
      metadata: { userId: userId || "" },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[stripe checkout] Error creating session:", err)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
