"use client"

import { motion } from "framer-motion"

const features = [
  {
    icon: "🎯",
    title: "Coaching in real-time",
    description:
      "Get tactical nudges on your screen while you're on the call. Not after — during.",
  },
  {
    icon: "📊",
    title: "Scorecard in 30 seconds",
    description:
      "Every call graded across 7 dimensions. Know exactly what to improve, call by call.",
  },
  {
    icon: "📈",
    title: "Your skills, tracked",
    description:
      "Watch your objection handling, tone, and close rate improve over weeks — with data.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0084FF] mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
            Everything you need to close more deals
          </h2>
          <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
            Cadence sits quietly in the background and activates the moment
            you need it — no setup, no friction.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/[0.10] transition-all duration-300"
            >
              <div className="text-3xl mb-4" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="text-zinc-100 font-semibold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
