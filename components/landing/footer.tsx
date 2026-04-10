export function Footer() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 opacity-70" />
          <span className="text-zinc-600 text-sm font-medium">Cadence</span>
        </div>
        <p className="text-zinc-600 text-sm text-center">
          &copy; 2026 Cadence. Built by a closer who taught himself to code.
        </p>
        <p className="text-zinc-700 text-xs">All rights reserved.</p>
      </div>
    </footer>
  )
}
