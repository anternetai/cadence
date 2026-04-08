"use client"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import NudgeCard, { type NudgeMessage } from "@/components/coach/nudge-card"

// ─── Types ────────────────────────────────────────────────────────────────────

interface NudgeFeedProps {
  messages: NudgeMessage[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NudgeFeed({ messages }: NudgeFeedProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(messages.length)

  function handleDismiss(id: string) {
    setDismissedIds((prev) => new Set([...prev, id]))
  }

  // Scroll to top when new messages arrive (newest first)
  useEffect(() => {
    if (messages.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
    prevCountRef.current = messages.length
  }, [messages.length])

  // Visible: non-SILENT, non-dismissed — newest first
  const visible = messages
    .filter((m) => m.type !== "SILENT" && !dismissedIds.has(m.id))
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div
      ref={scrollRef}
      className="flex flex-col gap-3 overflow-y-auto h-full pr-1"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.1) transparent",
      }}
    >
      <style>{`
        .nudge-feed-scroll::-webkit-scrollbar { width: 4px; }
        .nudge-feed-scroll::-webkit-scrollbar-track { background: transparent; }
        .nudge-feed-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      <AnimatePresence initial={false}>
        {visible.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex items-center gap-2 py-4 px-1"
          >
            {/* Pulsing dot */}
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-600 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-600" />
            </span>
            <span className="text-zinc-600 text-sm">Listening...</span>
          </motion.div>
        ) : (
          visible.map((message) => (
            <NudgeCard
              key={message.id}
              message={message}
              onDismiss={handleDismiss}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  )
}
