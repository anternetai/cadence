import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Pricing } from "@/components/landing/pricing"
import { WaitlistForm } from "@/components/landing/waitlist-form"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[oklch(0.06_0_0)]">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <WaitlistForm />
      <Footer />
    </main>
  )
}
