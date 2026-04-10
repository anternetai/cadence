"use client"

import { useState } from "react"

interface PricingCardProps {
  email?: string
  userId?: string
  currentPlan?: "free" | "pro" | null
}

const FEATURES = [
  "Live coaching on every call",
  "Post-call scorecards",
  "Personal skill dashboard",
  "Objection playbook",
  "Shareable score cards",
  "Unlimited calls",
]

export function PricingCard({ email, userId, currentPlan }: PricingCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error("[pricing-card] No checkout URL returned:", data)
      }
    } catch (err) {
      console.error("[pricing-card] Checkout error:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleManage() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: undefined }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error("[pricing-card] Portal error:", err)
    } finally {
      setLoading(false)
    }
  }

  const isPro = currentPlan === "pro"

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 flex flex-col gap-6 max-w-sm w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#0084FF] text-lg">✦</span>
          <span className="text-zinc-100 font-semibold text-lg">Pro Plan</span>
        </div>
        {isPro && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Current Plan
          </span>
        )}
      </div>

      {/* Price */}
      <div className="flex items-end gap-1">
        <span className="text-zinc-100 text-4xl font-bold">$49</span>
        <span className="text-zinc-400 text-sm mb-1">/month</span>
      </div>

      {/* Features */}
      <ul className="flex flex-col gap-3">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-3">
            <span className="text-emerald-400 text-sm flex-shrink-0">✓</span>
            <span className="text-zinc-300 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="flex flex-col gap-3 mt-2">
        {isPro ? (
          <button
            onClick={handleManage}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-medium text-zinc-300 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Manage Subscription"}
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={loading || !email}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#0084FF] hover:bg-[#0073e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Redirecting..." : "Upgrade to Pro"}
          </button>
        )}
      </div>
    </div>
  )
}
