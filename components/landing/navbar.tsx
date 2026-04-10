"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/[0.04] border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]" />
          <span className="text-zinc-100 font-semibold text-lg tracking-tight">Cadence</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-8">
          <a
            href="#features"
            className="text-zinc-400 hover:text-zinc-100 text-sm font-medium transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-zinc-400 hover:text-zinc-100 text-sm font-medium transition-colors"
          >
            Pricing
          </a>
          <a
            href="#waitlist"
            className="bg-[#0084FF]/80 hover:bg-[#0084FF] backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Join Waitlist
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-px bg-zinc-300 transition-all duration-200 ${
              menuOpen ? "rotate-45 translate-y-[7px]" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-zinc-300 transition-all duration-200 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-zinc-300 transition-all duration-200 ${
              menuOpen ? "-rotate-45 -translate-y-[7px]" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden overflow-hidden border-t border-white/[0.06]"
          >
            <nav className="flex flex-col gap-1 px-4 py-3">
              <a
                href="#features"
                onClick={() => setMenuOpen(false)}
                className="text-zinc-300 hover:text-zinc-100 text-sm font-medium py-2.5 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                onClick={() => setMenuOpen(false)}
                className="text-zinc-300 hover:text-zinc-100 text-sm font-medium py-2.5 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#waitlist"
                onClick={() => setMenuOpen(false)}
                className="bg-[#0084FF]/80 hover:bg-[#0084FF] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors mt-1 text-center"
              >
                Join Waitlist
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
