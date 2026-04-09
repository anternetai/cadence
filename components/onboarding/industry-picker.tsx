"use client"

interface Industry {
  id: string
  label: string
  icon: string
}

const INDUSTRIES: Industry[] = [
  { id: "roofing", label: "Roofing", icon: "🏠" },
  { id: "solar", label: "Solar", icon: "☀️" },
  { id: "hvac", label: "HVAC", icon: "❄️" },
  { id: "pest_control", label: "Pest Control", icon: "🐛" },
  { id: "pressure_washing", label: "Pressure Washing", icon: "💧" },
  { id: "insurance", label: "Insurance", icon: "🛡️" },
  { id: "real_estate", label: "Real Estate", icon: "🏡" },
  { id: "saas", label: "SaaS", icon: "💻" },
  { id: "financial", label: "Financial Services", icon: "💰" },
  { id: "other", label: "Other", icon: "📋" },
]

interface IndustryPickerProps {
  value: string | null
  onChange: (industry: string) => void
}

export function IndustryPicker({ value, onChange }: IndustryPickerProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 text-center">
        <h2 className="text-2xl font-semibold text-zinc-100">What do you sell?</h2>
        <p className="text-sm text-zinc-400">
          We&apos;ll pre-load scripts and objections to match your industry.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {INDUSTRIES.map((industry) => {
          const isSelected = value === industry.id
          return (
            <button
              key={industry.id}
              onClick={() => onChange(industry.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "border-emerald-400 bg-emerald-400/[0.06] shadow-[0_0_16px_0_rgba(52,211,153,0.12)]"
                  : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              <span className="text-3xl leading-none">{industry.icon}</span>
              <span
                className={`text-sm font-medium leading-tight ${
                  isSelected ? "text-emerald-400" : "text-zinc-300"
                }`}
              >
                {industry.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
