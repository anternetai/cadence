"use client"

import { useState, type FormEvent } from "react"
import { motion } from "framer-motion"

const industries = [
  "Solar",
  "Roofing",
  "Windows & Doors",
  "HVAC",
  "Real Estate",
  "Insurance",
  "SaaS",
  "Financial Services",
  "Home Services",
  "Other",
]

type Status = "idle" | "loading" | "success" | "error"

export function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [industry, setIndustry] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email || !email.includes("@")) return

    setStatus("loading")

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, industry: industry || undefined }),
      })

      const data = (await res.json()) as { message?: string; error?: string }

      if (res.ok || res.status === 200) {
        setStatus("success")
        setMessage(data.message ?? "You're on the list!")
        setEmail("")
        setIndustry("")
      } else {
        setStatus("error")
        setMessage(data.error ?? "Something went wrong. Try again.")
      }
    } catch {
      setStatus("error")
      setMessage("Network error. Please try again.")
    }
  }

  return (
    <section id="waitlist" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0084FF] mb-3">
            Early access
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight mb-4">
            Be the first to try Cadence.
          </h2>
          <p className="text-zinc-400 mb-10">
            We&apos;re onboarding a small group of closers first. Get early
            access, locked-in pricing, and direct input into the product.
          </p>

          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-8"
            >
              <span className="text-3xl" aria-hidden="true">✓</span>
              <p className="text-emerald-400 font-semibold text-lg">{message}</p>
              <p className="text-zinc-400 text-sm">We&apos;ll reach out when your spot opens up.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Industry dropdown */}
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-zinc-300 appearance-none focus:outline-none focus:border-[#0084FF]/50 focus:bg-white/[0.06] transition-all"
                style={{ colorScheme: "dark" }}
              >
                <option value="" className="bg-zinc-900 text-zinc-400">
                  Your industry (optional)
                </option>
                {industries.map((ind) => (
                  <option key={ind} value={ind} className="bg-zinc-900 text-zinc-100">
                    {ind}
                  </option>
                ))}
              </select>

              {/* Email + button row */}
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 min-w-0 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#0084FF]/50 focus:bg-white/[0.06] transition-all"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex-shrink-0 bg-[#0084FF] hover:bg-[#0073dd] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 text-sm whitespace-nowrap hover:shadow-[0_0_16px_4px_rgba(0,132,255,0.3)]"
                >
                  {status === "loading" ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Joining…
                    </span>
                  ) : (
                    "Get Early Access"
                  )}
                </button>
              </div>

              {/* Error message */}
              {status === "error" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm text-left"
                >
                  {message}
                </motion.p>
              )}
            </form>
          )}

          <p className="mt-6 text-xs text-zinc-600">
            Join others on the waitlist · No spam, ever
          </p>
        </motion.div>
      </div>
    </section>
  )
}
