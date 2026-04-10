"use client"

import { motion } from "framer-motion"

const included = [
  "Live coaching on every call",
  "Post-call scorecards",
  "Personal skill dashboard",
  "Objection playbook",
  "Shareable score cards",
  "Works with any phone or video app",
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0084FF] mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
            Simple, honest pricing
          </h2>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/[0.03] border border-white/[0.06] rounded-2xl max-w-md mx-auto p-8"
        >
          {/* Plan name */}
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
            Pro Plan
          </p>

          {/* Price */}
          <div className="flex items-end gap-1.5 mb-6">
            <span className="text-5xl font-bold text-zinc-100 leading-none">
              $49
            </span>
            <span className="text-zinc-500 text-base mb-1">/month</span>
          </div>

          {/* Features list */}
          <ul className="flex flex-col gap-3 mb-8">
            {included.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="text-emerald-400 flex-shrink-0" aria-hidden="true">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <a
            href="#waitlist"
            className="block w-full text-center bg-[#0084FF]/80 hover:bg-[#0084FF] backdrop-blur text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_4px_rgba(0,132,255,0.3)]"
          >
            Join Waitlist for Early Access
          </a>

          {/* Free tier note */}
          <p className="mt-4 text-center text-xs text-zinc-600">
            Free tier: practice mode only
          </p>
        </motion.div>
      </div>
    </section>
  )
}
