"use client"

import { motion } from "framer-motion"
import ReactiveOrb from "@/components/coach/reactive-orb"

export function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Subtle background radial */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 50%, #0084FF08 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left: Copy */}
          <div className="flex flex-col items-start gap-6 relative z-10">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0 }}
            >
              <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 bg-white/[0.06] border border-white/[0.08] rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Now accepting waitlist applications
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-100 leading-[1.05]"
            >
              Never sell
              <br />
              alone again.
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg text-zinc-400 max-w-md leading-relaxed"
            >
              Real-time AI sales coach on your screen during every cold call,
              demo, and close. Hear exactly what to say — as it&apos;s happening.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <a
                href="#waitlist"
                className="bg-[#0084FF]/80 hover:bg-[#0084FF] backdrop-blur text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-200 hover:shadow-[0_0_24px_4px_rgba(0,132,255,0.35)] text-base"
              >
                Join the Waitlist →
              </a>
            </motion.div>

            {/* Compatibility */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="text-xs text-zinc-600 flex items-center gap-2 flex-wrap"
            >
              <span>Works with</span>
              <span className="text-zinc-500 font-medium">Zoom</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500 font-medium">Phone</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500 font-medium">Google Meet</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500 font-medium">Any dialer</span>
            </motion.p>
          </div>

          {/* Right: Orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            className="flex items-center justify-center lg:justify-end relative"
          >
            {/* Orb glow backdrop */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 420,
                height: 420,
                background:
                  "radial-gradient(circle, #0084FF12 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
              aria-hidden="true"
            />
            <ReactiveOrb isActive={false} size="large" />
          </motion.div>
        </div>
      </div>

      {/* Mobile: orb behind text at reduced opacity */}
      <div
        className="lg:hidden pointer-events-none absolute top-12 right-0 opacity-20 -translate-x-8 -z-0"
        aria-hidden="true"
      >
        <ReactiveOrb isActive={false} size="medium" />
      </div>
    </section>
  )
}
