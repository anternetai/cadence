"use client"

interface Goal {
  id: string
  label: string
  description: string
}

const GOALS: Goal[] = [
  {
    id: "appointment",
    label: "Book an appointment",
    description: "Get them to commit to a meeting time",
  },
  {
    id: "sale",
    label: "Close a sale",
    description: "Sell the product or service on the call",
  },
  {
    id: "demo",
    label: "Schedule a demo",
    description: "Get them to see a product demonstration",
  },
  {
    id: "other",
    label: "Something else",
    description: "Custom call objective",
  },
]

interface CallGoalProps {
  value: string | null
  onChange: (goal: string) => void
}

export function CallGoal({ value, onChange }: CallGoalProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 text-center">
        <h2 className="text-2xl font-semibold text-zinc-100">What&apos;s your goal on each call?</h2>
        <p className="text-sm text-zinc-400">
          Cadence will tailor its coaching to your close objective.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {GOALS.map((goal) => {
          const isSelected = value === goal.id
          return (
            <button
              key={goal.id}
              onClick={() => onChange(goal.id)}
              className={`flex flex-col gap-0.5 rounded-2xl border px-5 py-4 text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "border-emerald-400 bg-emerald-400/[0.06] shadow-[0_0_16px_0_rgba(52,211,153,0.12)]"
                  : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              <span
                className={`text-base font-medium ${
                  isSelected ? "text-emerald-400" : "text-zinc-100"
                }`}
              >
                {goal.label}
              </span>
              <span className="text-sm text-zinc-400">{goal.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
