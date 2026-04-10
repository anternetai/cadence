"use client"

import { motion } from "framer-motion"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreChartProps {
  data: Array<{
    date: string
    overall: number
    toneControl: number
    objectionHandling: number
  }>
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const labelMap: Record<string, string> = {
    overall: "Overall",
    toneControl: "Tone",
    objectionHandling: "Objections",
  }

  return (
    <div className="bg-[oklch(0.12_0_0)] border border-white/[0.08] rounded-xl px-3.5 py-3 shadow-xl">
      <p className="text-zinc-500 text-xs mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-zinc-400">{labelMap[entry.name] ?? entry.name}</span>
          <span className="text-zinc-100 font-semibold tabular-nums ml-auto pl-4">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Legend Dot ───────────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-zinc-400 text-xs">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScoreChart({ data }: ScoreChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-zinc-300 text-sm font-medium">Score Trends</p>
          <div className="flex items-center gap-3 mt-1.5">
            <LegendDot color="#34d399" label="Overall" />
            <LegendDot color="#fbbf24" label="Tone" />
            <LegendDot color="#60a5fa" label="Objections" />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickCount={5}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)" }} />
            {/* Overall — emerald primary */}
            <Line
              type="monotone"
              dataKey="overall"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#34d399", strokeWidth: 0 }}
            />
            {/* Tone Control — amber dashed */}
            <Line
              type="monotone"
              dataKey="toneControl"
              stroke="#fbbf24"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 3, fill: "#fbbf24", strokeWidth: 0 }}
            />
            {/* Objection Handling — blue dashed */}
            <Line
              type="monotone"
              dataKey="objectionHandling"
              stroke="#60a5fa"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 3, fill: "#60a5fa", strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
