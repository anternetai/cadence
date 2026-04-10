"use client"

interface SubscriptionStatusProps {
  status: "free" | "pro" | "team" | null
  onManage?: () => void
}

export function SubscriptionStatus({ status, onManage }: SubscriptionStatusProps) {
  if (status === "pro") {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8.5 2.5L4 7.5L1.5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Pro
        </span>
        {onManage && (
          <button
            onClick={onManage}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
          >
            Manage
          </button>
        )}
      </div>
    )
  }

  if (status === "team") {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0084FF]/10 text-[#0084FF] border border-[#0084FF]/20 text-xs font-medium">
          Team
        </span>
        {onManage && (
          <button
            onClick={onManage}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
          >
            Manage
          </button>
        )}
      </div>
    )
  }

  // Free or null
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-medium">
        Free
      </span>
      <a
        href="/dashboard?upgrade=true"
        className="text-xs text-[#0084FF] hover:text-[#3399ff] transition-colors font-medium"
      >
        Upgrade
      </a>
    </div>
  )
}
