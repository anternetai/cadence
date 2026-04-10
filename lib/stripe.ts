import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
})

// Price IDs — set via env vars
export const PRICES = {
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
}

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
