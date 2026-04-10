import { NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error("[stripe webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const customerId = session.customer as string

        if (userId && customerId) {
          const { error } = await supabase
            .from("cadence_profiles")
            .update({
              stripe_customer_id: customerId,
              subscription_status: "pro",
            })
            .eq("id", userId)

          if (error) {
            console.error("[stripe webhook] Error updating profile after checkout:", error)
          }
        } else {
          console.warn("[stripe webhook] checkout.session.completed missing userId or customerId", {
            userId,
            customerId,
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        if (customerId) {
          const { error } = await supabase
            .from("cadence_profiles")
            .update({ subscription_status: "free" })
            .eq("stripe_customer_id", customerId)

          if (error) {
            console.error("[stripe webhook] Error updating profile after subscription deleted:", error)
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const status = subscription.status === "active" ? "pro" : "free"

        if (customerId) {
          const { error } = await supabase
            .from("cadence_profiles")
            .update({ subscription_status: status })
            .eq("stripe_customer_id", customerId)

          if (error) {
            console.error("[stripe webhook] Error updating profile after subscription updated:", error)
          }
        }
        break
      }

      default:
        // Unhandled event type — ignore
        break
    }
  } catch (err) {
    console.error("[stripe webhook] Error handling event:", event.type, err)
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
