"use client"

import type { AudioMetrics } from "@/lib/audio/client-analyzer"

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricsPanelProps {
  metrics: AudioMetrics
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-2 min-w-0">
      {children}
    </div>
  )
}

function MetricLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-medium">
      {children}
    </p>
  )
}

function MetricValue({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={["text-zinc-100 text-lg font-semibold tabular-nums leading-none", className].join(" ")}>
      {children}
    </p>
  )
}

function MetricSub({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={["text-zinc-500 text-xs leading-none", className].join(" ")}>
      {children}
    </p>
  )
}

// ─── Talk Ratio Card ─────────────────────────────────────────────────────────

function TalkRatioCard({ talkRatio }: { talkRatio: number }) {
  const percent = Math.round(talkRatio * 100)
  const tooMuch = talkRatio > 0.7

  return (
    <MetricCard>
      <MetricLabel>Talk</MetricLabel>

      {/* Split bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-800">
        <div
          className={[
            "h-full transition-all duration-500 rounded-l-full",
            tooMuch ? "bg-red-400" : "bg-zinc-300",
          ].join(" ")}
          style={{ width: `${percent}%` }}
        />
        <div
          className="h-full bg-zinc-700 flex-1 rounded-r-full"
        />
      </div>

      <MetricValue>{percent}%</MetricValue>

      {tooMuch ? (
        <MetricSub className="text-red-400">too much</MetricSub>
      ) : (
        <div className="flex justify-between">
          <MetricSub>you</MetricSub>
          <MetricSub>them</MetricSub>
        </div>
      )}
    </MetricCard>
  )
}

// ─── Volume Card ─────────────────────────────────────────────────────────────

function VolumeCard({
  volume,
  volumeTrend,
  isSpeaking,
}: {
  volume: number
  volumeTrend: "rising" | "falling" | "stable"
  isSpeaking: boolean
}) {
  const label =
    volume < 0.3 ? "Low" : volume < 0.6 ? "Med" : "High"

  const trendIcon =
    volumeTrend === "rising" ? "↑" : volumeTrend === "falling" ? "↓" : "—"

  const trendColor =
    volumeTrend === "rising"
      ? "text-amber-400"
      : volumeTrend === "falling"
      ? "text-emerald-400"
      : "text-zinc-500"

  const barHeight = Math.max(2, Math.round(volume * 100))

  return (
    <MetricCard>
      <MetricLabel>Volume</MetricLabel>

      {/* Vertical bar */}
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={[
            "h-full rounded-full transition-all duration-300",
            isSpeaking ? "bg-zinc-300" : "bg-zinc-600",
          ].join(" ")}
          style={{ width: `${barHeight}%` }}
        />
      </div>

      <div className="flex items-center gap-1">
        <MetricValue
          className={isSpeaking ? "text-zinc-100" : "text-zinc-400"}
        >
          {label}
        </MetricValue>
        <span className={["text-lg font-semibold", trendColor].join(" ")}>
          {trendIcon}
        </span>
      </div>

      {isSpeaking ? (
        <MetricSub className="text-emerald-400">active</MetricSub>
      ) : (
        <MetricSub>silent</MetricSub>
      )}
    </MetricCard>
  )
}

// ─── Pace Card ───────────────────────────────────────────────────────────────

function PaceCard({ paceVsBaseline }: { paceVsBaseline: number }) {
  const fast = paceVsBaseline > 1.2
  const slow = paceVsBaseline < 0.8
  const label = fast ? "fast" : slow ? "slow" : "normal"

  const valueColor = fast
    ? "text-amber-400"
    : slow
    ? "text-blue-400"
    : "text-emerald-400"

  return (
    <MetricCard>
      <MetricLabel>Pace</MetricLabel>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={[
            "h-full rounded-full transition-all duration-500",
            fast ? "bg-amber-500" : slow ? "bg-blue-500" : "bg-emerald-500",
          ].join(" ")}
          style={{ width: `${Math.min(100, Math.round((paceVsBaseline / 2) * 100))}%` }}
        />
      </div>
      <MetricValue className={valueColor}>
        {paceVsBaseline.toFixed(1)}x
      </MetricValue>
      <MetricSub className={valueColor}>{label}</MetricSub>
    </MetricCard>
  )
}

// ─── Silence Card ─────────────────────────────────────────────────────────────

function SilenceCard({ silenceDuration }: { silenceDuration: number }) {
  const seconds = silenceDuration / 1000
  const long = seconds > 5
  const pause = seconds >= 3 && seconds <= 5
  const sublabel = long ? "long" : pause ? "pause" : "natural"

  return (
    <MetricCard>
      <MetricLabel>Silence</MetricLabel>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={[
            "h-full rounded-full transition-all duration-300",
            long ? "bg-amber-500" : "bg-zinc-600",
          ].join(" ")}
          style={{ width: `${Math.min(100, Math.round((seconds / 10) * 100))}%` }}
        />
      </div>
      <MetricValue className={long ? "text-amber-400" : undefined}>
        {seconds.toFixed(1)}s
      </MetricValue>
      <MetricSub className={long ? "text-amber-400" : undefined}>
        {sublabel}
      </MetricSub>
    </MetricCard>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      <TalkRatioCard talkRatio={metrics.talkRatio} />
      <VolumeCard
        volume={metrics.volume}
        volumeTrend={metrics.volumeTrend}
        isSpeaking={metrics.isSpeaking}
      />
      <PaceCard paceVsBaseline={metrics.paceVsBaseline} />
      <SilenceCard silenceDuration={metrics.silenceDuration} />
    </div>
  )
}
