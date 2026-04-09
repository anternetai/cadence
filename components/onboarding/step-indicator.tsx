"use client"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-0">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1
          const isCompleted = stepNum < currentStep
          const isCurrent = stepNum === currentStep
          const isActive = isCompleted || isCurrent

          return (
            <div key={stepNum} className="flex items-center">
              {/* Connector line before (skip for first) */}
              {i > 0 && (
                <div
                  className={`h-px w-6 transition-colors duration-300 ${
                    isCompleted ? "bg-emerald-400/60" : "bg-white/[0.06]"
                  }`}
                />
              )}

              {/* Dot */}
              <div
                className={`rounded-full transition-all duration-300 ${
                  isCurrent
                    ? "h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.4)]"
                    : isCompleted
                    ? "h-2 w-2 bg-emerald-400"
                    : "h-2 w-2 bg-white/[0.1]"
                } ${isActive ? "" : ""}`}
              />
            </div>
          )
        })}
      </div>

      <span className="text-xs text-zinc-500 tabular-nums">
        Step {currentStep} of {totalSteps}
      </span>
    </div>
  )
}
