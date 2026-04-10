import Link from "next/link"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ScoreChart } from "@/components/dashboard/score-chart"
import { CallList, type DashboardCall } from "@/components/dashboard/call-list"
import { StreakCounter } from "@/components/dashboard/streak-counter"
import { WeakSpot } from "@/components/dashboard/weak-spot"

// ─── Mock Data ────────────────────────────────────────────────────────────────
// 18 calls over the last 30 days. Scores trend upward with realistic noise.

const MOCK_CALLS: DashboardCall[] = [
  {
    id: "call-01",
    date: "2026-03-09T14:22:00Z",
    duration: 214,
    scores: {
      toneControl: 52, paceManagement: 48, objectionHandling: 44,
      closeQuality: 50, talkRatio: 58, energyMatching: 55, silenceUsage: 47,
      overall: 51,
    },
    grade: "C",
    nudgeCount: 9,
    headline: "Rushed the opener — prospect went cold before the pitch landed",
  },
  {
    id: "call-02",
    date: "2026-03-11T10:05:00Z",
    duration: 187,
    scores: {
      toneControl: 55, paceManagement: 51, objectionHandling: 49,
      closeQuality: 47, talkRatio: 54, energyMatching: 58, silenceUsage: 52,
      overall: 52,
    },
    grade: "C",
    nudgeCount: 8,
    headline: "Talk ratio too high — give the prospect room to breathe",
  },
  {
    id: "call-03",
    date: "2026-03-12T16:45:00Z",
    duration: 342,
    scores: {
      toneControl: 60, paceManagement: 57, objectionHandling: 53,
      closeQuality: 55, talkRatio: 60, energyMatching: 63, silenceUsage: 50,
      overall: 57,
    },
    grade: "C",
    nudgeCount: 7,
    headline: "Better energy today — close still needs more confidence",
  },
  {
    id: "call-04",
    date: "2026-03-14T09:30:00Z",
    duration: 278,
    scores: {
      toneControl: 63, paceManagement: 59, objectionHandling: 57,
      closeQuality: 60, talkRatio: 62, energyMatching: 65, silenceUsage: 55,
      overall: 60,
    },
    grade: "C",
    nudgeCount: 6,
    headline: "Solid pace but missed a clear buying signal near the end",
  },
  {
    id: "call-05",
    date: "2026-03-16T11:15:00Z",
    duration: 396,
    scores: {
      toneControl: 65, paceManagement: 62, objectionHandling: 64,
      closeQuality: 58, talkRatio: 65, energyMatching: 68, silenceUsage: 60,
      overall: 63,
    },
    grade: "C",
    nudgeCount: 5,
    headline: "Good objection pivot — close timing was a beat too late",
  },
  {
    id: "call-06",
    date: "2026-03-18T15:00:00Z",
    duration: 451,
    scores: {
      toneControl: 70, paceManagement: 65, objectionHandling: 62,
      closeQuality: 63, talkRatio: 68, energyMatching: 71, silenceUsage: 58,
      overall: 65,
    },
    grade: "C",
    nudgeCount: 4,
    headline: "Controlled tone throughout — talk ratio crept up in the middle",
  },
  {
    id: "call-07",
    date: "2026-03-20T13:40:00Z",
    duration: 523,
    scores: {
      toneControl: 72, paceManagement: 68, objectionHandling: 70,
      closeQuality: 65, talkRatio: 70, energyMatching: 73, silenceUsage: 63,
      overall: 69,
    },
    grade: "C",
    nudgeCount: 4,
    headline: "Best objection handling this week — push harder on the close",
  },
  {
    id: "call-08",
    date: "2026-03-21T10:20:00Z",
    duration: 312,
    scores: {
      toneControl: 68, paceManagement: 65, objectionHandling: 67,
      closeQuality: 70, talkRatio: 66, energyMatching: 70, silenceUsage: 65,
      overall: 67,
    },
    grade: "C",
    nudgeCount: 5,
    headline: "Talked past the close — once you get a yes, stop selling",
  },
  {
    id: "call-09",
    date: "2026-03-23T14:55:00Z",
    duration: 489,
    scores: {
      toneControl: 74, paceManagement: 70, objectionHandling: 72,
      closeQuality: 73, talkRatio: 72, energyMatching: 75, silenceUsage: 68,
      overall: 72,
    },
    grade: "B",
    nudgeCount: 3,
    headline: "Sharp opener, strong pace — this is the standard to hold",
  },
  {
    id: "call-10",
    date: "2026-03-25T09:10:00Z",
    duration: 267,
    scores: {
      toneControl: 76, paceManagement: 72, objectionHandling: 71,
      closeQuality: 75, talkRatio: 74, energyMatching: 77, silenceUsage: 70,
      overall: 74,
    },
    grade: "B",
    nudgeCount: 3,
    headline: "Clean call — silences were strategic, not nervous",
  },
  {
    id: "call-11",
    date: "2026-03-26T16:00:00Z",
    duration: 601,
    scores: {
      toneControl: 73, paceManagement: 74, objectionHandling: 75,
      closeQuality: 72, talkRatio: 71, energyMatching: 76, silenceUsage: 72,
      overall: 73,
    },
    grade: "B",
    nudgeCount: 4,
    headline: "Handled the pricing objection well — energy matched prospect throughout",
  },
  {
    id: "call-12",
    date: "2026-03-28T11:30:00Z",
    duration: 445,
    scores: {
      toneControl: 78, paceManagement: 76, objectionHandling: 77,
      closeQuality: 76, talkRatio: 75, energyMatching: 79, silenceUsage: 74,
      overall: 77,
    },
    grade: "B",
    nudgeCount: 2,
    headline: "Confident and measured — minor pace spike after the objection",
  },
  {
    id: "call-13",
    date: "2026-03-30T14:05:00Z",
    duration: 534,
    scores: {
      toneControl: 80, paceManagement: 77, objectionHandling: 79,
      closeQuality: 78, talkRatio: 77, energyMatching: 81, silenceUsage: 76,
      overall: 79,
    },
    grade: "B",
    nudgeCount: 2,
    headline: "Best call of the month — owned every stage from opener to close",
  },
  {
    id: "call-14",
    date: "2026-04-01T10:45:00Z",
    duration: 388,
    scores: {
      toneControl: 79, paceManagement: 78, objectionHandling: 80,
      closeQuality: 77, talkRatio: 76, energyMatching: 80, silenceUsage: 75,
      overall: 78,
    },
    grade: "B",
    nudgeCount: 3,
    headline: "Smooth recovery after early resistance — talk ratio spot on",
  },
  {
    id: "call-15",
    date: "2026-04-03T15:20:00Z",
    duration: 472,
    scores: {
      toneControl: 82, paceManagement: 79, objectionHandling: 81,
      closeQuality: 80, talkRatio: 78, energyMatching: 83, silenceUsage: 77,
      overall: 80,
    },
    grade: "B",
    nudgeCount: 2,
    headline: "Strong opener, strong close — energy matching was textbook",
  },
  {
    id: "call-16",
    date: "2026-04-04T09:55:00Z",
    duration: 316,
    scores: {
      toneControl: 84, paceManagement: 81, objectionHandling: 83,
      closeQuality: 82, talkRatio: 80, energyMatching: 84, silenceUsage: 79,
      overall: 82,
    },
    grade: "B",
    nudgeCount: 1,
    headline: "Cleanest call this quarter — kept pace even when prospect stalled",
  },
  {
    id: "call-17",
    date: "2026-04-06T13:10:00Z",
    duration: 557,
    scores: {
      toneControl: 86, paceManagement: 83, objectionHandling: 85,
      closeQuality: 84, talkRatio: 82, energyMatching: 86, silenceUsage: 81,
      overall: 84,
    },
    grade: "B",
    nudgeCount: 1,
    headline: "Laser-focused from start to finish — near-perfect talk ratio",
  },
  {
    id: "call-18",
    date: "2026-04-08T11:00:00Z",
    duration: 421,
    scores: {
      toneControl: 88, paceManagement: 85, objectionHandling: 87,
      closeQuality: 86, talkRatio: 84, energyMatching: 88, silenceUsage: 83,
      overall: 86,
    },
    grade: "A",
    nudgeCount: 1,
    headline: "Dialed in — closed confidently with zero wasted words",
  },
]

// ─── Derived Stats ────────────────────────────────────────────────────────────

function computeStats(calls: DashboardCall[]) {
  const totalCalls = calls.length
  const avgScore = Math.round(calls.reduce((s, c) => s + c.scores.overall, 0) / totalCalls)
  const bestScore = Math.max(...calls.map((c) => c.scores.overall))
  const totalCoachingMinutes = Math.round(calls.reduce((s, c) => s + c.duration, 0) / 60)

  // Chart data — one point per call (date formatted M/D)
  const chartData = calls.map((c) => {
    const d = new Date(c.date)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    return {
      date: label,
      overall: c.scores.overall,
      toneControl: c.scores.toneControl,
      objectionHandling: c.scores.objectionHandling,
    }
  })

  // Streak — count backwards from most recent call date
  // For demo: 5-day current streak, 7-day best
  const currentStreak = 5
  const longestStreak = 7
  // Last 7 days: days 1-5 had sessions, days 6-7 did not
  const recentDays = [true, true, true, true, true, false, false]

  // Weakest dimension — average each dimension across all calls
  const dimensionKeys: Array<keyof DashboardCall["scores"]> = [
    "toneControl", "paceManagement", "objectionHandling",
    "closeQuality", "talkRatio", "energyMatching", "silenceUsage",
  ]
  const dimensionLabels: Record<string, string> = {
    toneControl: "Tone Control",
    paceManagement: "Pace Management",
    objectionHandling: "Objection Handling",
    closeQuality: "Close Quality",
    talkRatio: "Talk Ratio",
    energyMatching: "Energy Matching",
    silenceUsage: "Silence Usage",
  }
  const dimensionTips: Record<string, string> = {
    toneControl: "Practice recording your opener and replaying it. Notice where confidence dips — that's where your voice tells the truth.",
    paceManagement: "When you feel the urge to speed up, pause for one breath instead. Slow is smooth, smooth is persuasive.",
    objectionHandling: "Treat every objection as a question in disguise. Restate it back before answering — it buys time and shows you heard them.",
    closeQuality: "After your close line, stay silent. The next person to speak loses. Practice sitting with the silence.",
    talkRatio: "Set a mental alarm: if you've spoken for 30 seconds straight, it's the prospect's turn. Ask a question and shut up.",
    energyMatching: "Mirror their energy level for the first 60 seconds, then gradually lead them upward. Don't start at 10 when they're at a 4.",
    silenceUsage: "Silence after a key point isn't awkward — it's emphasis. Let your words land before you add more.",
  }

  const avgByDimension = dimensionKeys.map((key) => ({
    key,
    avg: Math.round(calls.reduce((s, c) => s + c.scores[key], 0) / totalCalls),
  }))
  const weakest = avgByDimension.reduce((a, b) => (a.avg < b.avg ? a : b))

  return {
    totalCalls,
    avgScore,
    bestScore,
    totalCoachingMinutes,
    chartData,
    currentStreak,
    longestStreak,
    recentDays,
    weakestDimension: dimensionLabels[weakest.key],
    weakestAvg: weakest.avg,
    weakestTip: dimensionTips[weakest.key],
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const stats = computeStats(MOCK_CALLS)

  return (
    <div className="min-h-screen bg-[oklch(0.06_0_0)] text-zinc-100">
      <div className="max-w-6xl mx-auto px-5 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-zinc-100 text-xl font-bold tracking-tight">Cadence</span>
            <span className="text-zinc-700 text-sm">/</span>
            <span className="text-zinc-500 text-sm">Dashboard</span>
          </div>
          <Link
            href="/coach"
            className="
              inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30
              text-emerald-400 text-sm font-medium
              transition-colors duration-150
            "
          >
            <span className="text-base leading-none">▶</span>
            Start Session
          </Link>
        </div>

        {/* ── Stats Cards ── */}
        <div className="mb-4">
          <StatsCards
            totalCalls={stats.totalCalls}
            avgScore={stats.avgScore}
            bestScore={stats.bestScore}
            totalCoachingMinutes={stats.totalCoachingMinutes}
          />
        </div>

        {/* ── Middle Row: Chart + Streak/WeakSpot ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Score chart — 2/3 width */}
          <div className="lg:col-span-2">
            <ScoreChart data={stats.chartData} />
          </div>

          {/* Right column — streak + weak spot stacked */}
          <div className="flex flex-col gap-4">
            <StreakCounter
              currentStreak={stats.currentStreak}
              longestStreak={stats.longestStreak}
              recentDays={stats.recentDays}
            />
            <WeakSpot
              weakestDimension={stats.weakestDimension}
              avgScore={stats.weakestAvg}
              tip={stats.weakestTip}
            />
          </div>
        </div>

        {/* ── Call List ── */}
        <CallList calls={MOCK_CALLS} />

      </div>
    </div>
  )
}
