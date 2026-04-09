"use client"

import { motion, type TargetAndTransition } from "framer-motion"
import { useMemo } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrbMetrics {
  volume: number
  isSpeaking: boolean
  isProspectSpeaking: boolean
  pace: number
  paceVsBaseline: number
  talkRatio: number
  silenceDuration: number
}

export interface ReactiveOrbProps {
  metrics?: OrbMetrics | null
  sentiment?: string | null
  isActive?: boolean
  size?: "large" | "medium"
}

// ─── Color palette per sentiment ─────────────────────────────────────────────

interface OrbColors {
  core: [string, string]
  mid: [string, string]
  glow: string
  accent: string
}

function getColorsForSentiment(sentiment?: string | null): OrbColors {
  switch (sentiment) {
    case "hostile":
      return {
        core:   ["#FF2D2D", "#7C0000"],
        mid:    ["#EF4444", "#991B1B"],
        glow:   "#EF444440",
        accent: "#F97316",
      }
    case "cold":
      return {
        core:   ["#818CF8", "#1E1B4B"],
        mid:    ["#6366F1", "#312E81"],
        glow:   "#6366F130",
        accent: "#A5B4FC",
      }
    case "warm":
      return {
        core:   ["#FBBF24", "#78350F"],
        mid:    ["#F59E0B", "#92400E"],
        glow:   "#F59E0B35",
        accent: "#FCD34D",
      }
    case "hot":
      return {
        core:   ["#FF6B00", "#7C2D12"],
        mid:    ["#F97316", "#9A3412"],
        glow:   "#F9731640",
        accent: "#EF4444",
      }
    case "neutral":
    default:
      return {
        core:   ["#00D4FF", "#003B6B"],
        mid:    ["#0084FF", "#002B6B"],
        glow:   "#0084FF30",
        accent: "#38BDF8",
      }
  }
}

// ─── Repeated animation targets ───────────────────────────────────────────────

type AnimateTarget = TargetAndTransition

function makeAmbientL1(): AnimateTarget {
  return {
    scale: [0.95, 1.05, 0.95],
    y: [0, -10, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  }
}

function makeAmbientL2(): AnimateTarget {
  return {
    scale: [0.97, 1.03, 0.97],
    y: [0, -6, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut",
    },
  }
}

function makeAmbientL3(): AnimateTarget {
  return {
    scale: [0.96, 1.04, 0.96],
    opacity: [0.5, 0.65, 0.5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReactiveOrb({
  metrics,
  sentiment,
  isActive = false,
  size = "large",
}: ReactiveOrbProps) {
  const dimensions = size === "large" ? 400 : 250
  const half = dimensions / 2

  const colors = useMemo(() => getColorsForSentiment(sentiment), [sentiment])

  // ── Volume → scale ───────────────────────────────────────────────────────
  const baseScale = useMemo(() => {
    if (!metrics || !isActive) return 1.0
    return 1.0 + metrics.volume * 0.15
  }, [metrics, isActive])

  const scaleL1 = baseScale
  const scaleL2 = 1.0 + (baseScale - 1.0) * 1.05
  const scaleL3 = 1.0 + (baseScale - 1.0) * 1.1

  // ── Brightness from speaking state ──────────────────────────────────────
  const frontOpacity = useMemo(() => {
    if (!isActive || !metrics) return 0.6
    if (metrics.isSpeaking) return 0.85
    if (metrics.isProspectSpeaking) return 0.4
    return 0.6
  }, [metrics, isActive])

  const midOpacity = useMemo(() => {
    if (!isActive || !metrics) return 0.55
    if (metrics.isSpeaking) return 0.75
    if (metrics.isProspectSpeaking) return 0.35
    return 0.55
  }, [metrics, isActive])

  // ── Accent orbit speed from pace ────────────────────────────────────────
  const orbitDuration = useMemo(() => {
    if (!isActive || !metrics) return 20
    const paceRatio = metrics.paceVsBaseline || 1
    const clamped = Math.max(0.4, Math.min(2.0, paceRatio))
    return 20 / clamped
  }, [metrics, isActive])

  // ── Silence settling ────────────────────────────────────────────────────
  const inDeepSilence = isActive && !!metrics && metrics.silenceDuration > 2000

  // Spring for reactive mode
  const springTransition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  }

  // ── Per-layer animate targets ────────────────────────────────────────────
  // Each layer gets exactly one `animate` value — no spreads.

  const animateL1: AnimateTarget = isActive
    ? { scale: scaleL1, opacity: inDeepSilence ? 0.4 : 0.7 }
    : makeAmbientL1()

  const animateL2: AnimateTarget = isActive
    ? { scale: scaleL2, opacity: inDeepSilence ? 0.35 : midOpacity }
    : makeAmbientL2()

  const animateL3: AnimateTarget = isActive
    ? { scale: scaleL3, opacity: inDeepSilence ? 0.25 : frontOpacity }
    : makeAmbientL3()

  const transitionL1 = isActive ? springTransition : undefined
  const transitionL2 = isActive ? springTransition : undefined
  const transitionL3 = isActive ? springTransition : undefined

  return (
    <div
      className="pointer-events-none select-none"
      style={{ width: dimensions, height: dimensions, position: "relative" }}
      aria-hidden="true"
    >
      {/* ── Layer 1: Back glow — largest, most blurred ── */}
      <motion.div
        animate={animateL1}
        transition={transitionL1}
        style={{
          position: "absolute",
          inset: -half * 0.25,
          borderRadius: "50%",
          background: `radial-gradient(circle at 50% 50%, ${colors.mid[0]}33, ${colors.glow} 50%, transparent 80%)`,
          filter: `blur(${size === "large" ? 48 : 32}px)`,
          opacity: 0.7,
        }}
      />

      {/* ── Layer 2: Mid — main orb body ── */}
      <motion.div
        animate={animateL2}
        transition={transitionL2}
        style={{
          position: "absolute",
          inset: half * 0.08,
          borderRadius: "50%",
          background: `radial-gradient(circle at 38% 35%, ${colors.core[0]}, ${colors.mid[0]} 40%, ${colors.mid[1]} 75%, ${colors.core[1]})`,
          filter: `blur(${size === "large" ? 18 : 12}px)`,
          opacity: midOpacity,
        }}
      />

      {/* ── Layer 3: Inner core — bright highlight ── */}
      <motion.div
        animate={animateL3}
        transition={transitionL3}
        style={{
          position: "absolute",
          inset: half * 0.22,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, #ffffff55, ${colors.core[0]}cc 35%, ${colors.mid[0]}99 65%, transparent)`,
          filter: `blur(${size === "large" ? 8 : 5}px)`,
          opacity: frontOpacity,
          mixBlendMode: "screen",
        }}
      />

      {/* ── Layer 4: Specular highlight spot ── */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "25%",
          width: "30%",
          height: "20%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, #ffffff44, transparent 70%)",
          filter: `blur(${size === "large" ? 6 : 4}px)`,
          mixBlendMode: "screen",
          opacity: 0.8,
        }}
      />

      {/* ── Layer 5: Orbiting accent dot ── */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: orbitDuration,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            width: size === "large" ? 12 : 8,
            height: size === "large" ? 12 : 8,
            borderRadius: "50%",
            background: colors.accent,
            boxShadow: `0 0 ${size === "large" ? 16 : 10}px 4px ${colors.accent}88`,
            opacity: inDeepSilence ? 0.3 : 0.9,
          }}
        />
      </motion.div>

      {/* ── Ambient color pulse overlay — only in non-active mode ── */}
      {!isActive && (
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: half * 0.1,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${colors.accent}33, ${colors.mid[0]}22, transparent 70%)`,
            filter: `blur(${size === "large" ? 20 : 14}px)`,
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  )
}
