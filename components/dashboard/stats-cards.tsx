"use client"

import { motion } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsCardsProps {
  totalCalls: number
  avgScore: number
  bestScore: number
  totalCoachingMinutes: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCoachingTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

// ─── Individual Card ──────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  subtitle: string
  index: number
}

function StatCard({ label, value, subtitle, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.1 }}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5"
    >
      <p className="text-zinc-500 text-xs uppercase tracking-wider font-medium mb-3">
        {label}
      </p>
      <p className="text-zinc-100 text-3xl font-bold tabular-nums leading-none mb-1.5">
        {value}
      </p>
      <p className="text-zinc-600 text-xs">{subtitle}</p>
    </motion.div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StatsCards({
  totalCalls,
  avgScore,
  bestScore,
  totalCoachingMinutes,
}: StatsCardsProps) {
  const cards = [
    {
      label: "Total Calls",
      value: String(totalCalls),
      subtitle: "this month",
    },
    {
      label: "Avg Score",
      value: `${avgScore}/100`,
      subtitle: "overall",
    },
    {
      label: "Best Score",
      value: `${bestScore}/100`,
      subtitle: "personal best",
    },
    {
      label: "Coaching Time",
      value: formatCoachingTime(totalCoachingMinutes),
      subtitle: "total",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} index={i} />
      ))}
    </div>
  )
}
