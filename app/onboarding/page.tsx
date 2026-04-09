"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { IndustryPicker } from "@/components/onboarding/industry-picker"
import { CallGoal } from "@/components/onboarding/call-goal"
import { ScriptEditor } from "@/components/onboarding/script-editor"
import { ObjectionEditor } from "@/components/onboarding/objection-editor"
import { PracticeRecord } from "@/components/onboarding/practice-record"
import { getDefaults } from "@/lib/onboarding/industry-defaults"

const TOTAL_STEPS = 5

export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = back
  const [industry, setIndustry] = useState<string | null>(null)
  const [callGoal, setCallGoal] = useState<string | null>(null)
  const [script, setScript] = useState("")
  const [objections, setObjections] = useState<string[]>([])

  // Can the user continue from the current step?
  function canContinue(): boolean {
    switch (step) {
      case 1:
        return industry !== null
      case 2:
        return callGoal !== null
      case 3:
        return true // script is optional
      case 4:
        return objections.length > 0
      case 5:
        return false // step 5 manages its own completion
      default:
        return false
    }
  }

  function advance() {
    if (step === 1 && industry !== null) {
      // Auto-populate script and objections from industry defaults
      const defaults = getDefaults(industry)
      if (!script) setScript(defaults.script)
      if (objections.length === 0) setObjections(defaults.objections)
    }
    setDirection(1)
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  function back() {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 1))
  }

  function handlePracticeComplete(baseline: { pace: number; volume: number }) {
    // TODO: Save profile to Supabase
    console.log("Onboarding complete:", {
      industry,
      callGoal,
      script,
      objections,
      baselinePace: baseline.pace,
      baselineVolume: baseline.volume,
    })
    router.push("/coach")
  }

  const variants = {
    initial: (dir: number) => ({ opacity: 0, x: dir * 50 }),
    animate: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -50 }),
  }

  return (
    <div className="min-h-screen bg-[oklch(0.06_0_0)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg flex flex-col gap-8">
        {/* Header wordmark */}
        <div className="flex items-center justify-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-zinc-100">Cadence</span>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center">
          <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {step === 1 && (
              <IndustryPicker value={industry} onChange={setIndustry} />
            )}
            {step === 2 && (
              <CallGoal value={callGoal} onChange={setCallGoal} />
            )}
            {step === 3 && (
              <ScriptEditor value={script} onChange={setScript} industry={industry} />
            )}
            {step === 4 && (
              <ObjectionEditor
                value={objections}
                onChange={setObjections}
                industry={industry}
              />
            )}
            {step === 5 && (
              <PracticeRecord onComplete={handlePracticeComplete} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation (hidden on step 5 — PracticeRecord owns its own CTA) */}
        {step < 5 && (
          <div className="flex items-center justify-between">
            {/* Back */}
            {step > 1 ? (
              <button
                onClick={back}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {/* Continue */}
            <button
              onClick={advance}
              disabled={!canContinue()}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-black transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* Skip link on step 3 (script) */}
        {step === 3 && (
          <div className="flex justify-center -mt-4">
            <button
              onClick={advance}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
