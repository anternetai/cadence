"use client"

import { motion } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────

// Accepts both the 5-point spec scale and the legacy 3-point scale from coaching-overlay
type SentimentValue =
  | "hostile"
  | "cold"
  | "neutral"
  | "warm"
  | "hot"
  | "positive"
  | "negative"
  | null

interface SentimentMeterProps {
  sentiment: SentimentValue
}

// ─── Config ───────────────────────────────────────────────────────────────────

const POSITIONS: Record<string, number> = {
  hostile: 0,
  cold: 0.25,
  neutral: 0.5,
  warm: 0.75,
  hot: 1.0,
  // Legacy 3-point map
  negative: 0.125,  // between hostile and cold
  positive: 0.875,  // between warm and hot
}

type ZoneKey = "hostile" | "cold" | "neutral" | "warm" | "hot"

const ZONES: { key: ZoneKey; label: string; color: string; trackColor: string }[] = [
  { key: "hostile", label: "Hostile", color: "bg-blue-500",    trackColor: "bg-blue-500/30" },
  { key: "cold",    label: "Cold",    color: "bg-blue-400",    trackColor: "bg-blue-500/20" },
  { key: "neutral", label: "Neutral", color: "bg-zinc-400",    trackColor: "bg-zinc-500/30" },
  { key: "warm",    label: "Warm",    color: "bg-amber-400",   trackColor: "bg-amber-500/30" },
  { key: "hot",     label: "Hot",     color: "bg-red-400",     trackColor: "bg-red-500/30" },
]

function getZone(position: number): ZoneKey {
  if (position <= 0.125) return "hostile"
  if (position <= 0.375) return "cold"
  if (position <= 0.625) return "neutral"
  if (position <= 0.875) return "warm"
  return "hot"
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SentimentMeter({ sentiment }: SentimentMeterProps) {
  const isNull = sentiment === null
  const position = isNull ? 0.5 : (POSITIONS[sentiment] ?? 0.5)
  const zone = getZone(position)
  const zoneConfig = ZONES.find((z) => z.key === zone) ?? ZONES[2]

  return (
    <div className={["flex flex-col gap-2.5 transition-opacity duration-300", isNull ? "opacity-40" : "opacity-100"].join(" ")}>
      {/* Label row */}
      <div className="flex items-center justify-between">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium">
          Prospect Sentiment
        </p>
        {isNull && (
          <p className="text-zinc-600 text-xs">Analyzing...</p>
        )}
        {!isNull && (
          <p className={["text-xs font-medium", zoneConfig.color.replace("bg-", "text-")].join(" ")}>
            {zoneConfig.label}
          </p>
        )}
      </div>

      {/* Track */}
      <div className="relative h-5 flex items-center">
        {/* Segmented track background */}
        <div className="absolute inset-x-0 flex h-1 rounded-full overflow-hidden gap-px">
          {ZONES.map((z) => (
            <div key={z.key} className={["flex-1 h-full", z.trackColor].join(" ")} />
          ))}
        </div>

        {/* Indicator dot */}
        <motion.div
          className={[
            "absolute w-3 h-3 rounded-full -translate-x-1/2 shadow-sm",
            zoneConfig.color,
          ].join(" ")}
          animate={{ left: `${position * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ top: "50%", transform: "translate(-50%, -50%)" }}
        />
      </div>

      {/* Zone labels */}
      <div className="flex justify-between">
        {ZONES.map((z) => (
          <span
            key={z.key}
            className={[
              "text-[10px] transition-colors duration-300",
              zone === z.key && !isNull ? "text-zinc-400" : "text-zinc-700",
            ].join(" ")}
          >
            {z.label}
          </span>
        ))}
      </div>
    </div>
  )
}
