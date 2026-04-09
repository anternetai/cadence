export interface IndustryDefaults {
  script: string
  objections: string[]
}

export const INDUSTRY_DEFAULTS: Record<string, IndustryDefaults> = {
  roofing: {
    script:
      "Hey [Name], this is [Your Name] with [Company]. I know you're busy so I'll be quick — I'm reaching out to homeowners in your area because we're doing some roof work in the neighborhood this month. Mind if I ask, when's the last time you had your roof inspected?",
    objections: [
      "I'm not interested",
      "I already have a roofer",
      "Send me some information",
      "I'm too busy right now",
      "How much does it cost?",
      "My roof is fine",
    ],
  },
  solar: {
    script:
      "Hi [Name], this is [Your Name] from [Company]. Quick question — have you looked into what the new solar incentives could save you on your electric bill? A lot of homeowners in [Area] are locking in rates before they change.",
    objections: [
      "Solar is too expensive",
      "I'm renting, not owning",
      "I don't get enough sun",
      "I've heard bad things about solar",
      "My electric bill isn't that high",
      "I need to talk to my spouse",
    ],
  },
  hvac: {
    script:
      "Hi [Name], this is [Your Name] calling from [Company]. I'll be quick — we're reaching out to homeowners in [Area] because summer's coming up fast, and we're doing free efficiency checks for your AC unit. Is your system keeping up okay, or have you noticed it running more than usual?",
    objections: [
      "My AC is working fine",
      "I just had it serviced",
      "I rent, I don't handle repairs",
      "I can't afford repairs right now",
      "How much does a tune-up cost?",
      "I'll wait until it actually breaks",
    ],
  },
  pest_control: {
    script:
      "Hey [Name], this is [Your Name] with [Company]. We're in your neighborhood this week treating homes for [common pest in area], and I wanted to reach out before we wrap up. Have you noticed any signs of activity around your property — anything in the garage, crawlspace, or around the foundation?",
    objections: [
      "I haven't seen any pests",
      "I already use [Competitor]",
      "I'll handle it myself",
      "How much does treatment cost?",
      "I'm not interested right now",
      "Send me information first",
    ],
  },
  pressure_washing: {
    script:
      "Hi [Name], this is [Your Name] with [Company]. We're actually doing some work on your street this week and I noticed your driveway and siding. We have a couple open slots if you'd want us to knock out a cleaning while we're already in the area — usually saves people a couple hundred bucks on the trip fee.",
    objections: [
      "How much does it cost?",
      "I can do it myself",
      "I just had it cleaned",
      "Not in my budget right now",
      "I need to check with my husband / wife",
      "Send me a quote first",
    ],
  },
  insurance: {
    script:
      "Hi [Name], this is [Your Name] with [Company]. The reason I'm calling is that a lot of folks in [Area] have been overpaying on their premiums since rates changed earlier this year. I do a free five-minute rate comparison — no obligation — and on average save people around [X] dollars a month. Is that something that'd be worth a quick look for you?",
    objections: [
      "I'm happy with my current provider",
      "I don't want to switch",
      "I don't have time right now",
      "What company are you with?",
      "Is this going to affect my credit?",
      "Just send me something in the mail",
    ],
  },
  real_estate: {
    script:
      "Hi [Name], this is [Your Name] with [Company]. I'm reaching out because we just sold a home on [Street] in your neighborhood for [X] over asking, and I know inventory is tight right now. I don't know if you've thought about it, but have you had any curiosity about what your home might be worth in today's market?",
    objections: [
      "We're not looking to sell",
      "We're already working with an agent",
      "The market is too uncertain right now",
      "What's your commission?",
      "We just refinanced, so we're staying put",
      "Send me a CMA and I'll look at it",
    ],
  },
  saas: {
    script:
      "Hey [Name], this is [Your Name] from [Company]. I'll be straight with you — I'm reaching out to [industry] teams because we built a tool that [core value prop in one sentence]. I know that's probably something you hear a lot, but we've got teams like [similar company] cutting [specific metric] by [X%]. Would it be worth 15 minutes to see if the math makes sense for your team?",
    objections: [
      "We already have a solution for that",
      "We don't have budget right now",
      "Send me more information",
      "We're locked into a contract",
      "I'm not the right person to talk to",
      "This isn't a priority for us",
    ],
  },
  financial: {
    script:
      "Hi [Name], this is [Your Name] with [Company]. I work specifically with [target client — e.g., business owners / retirees] in [Area], and I'm calling because we've been helping folks in your situation take advantage of some planning strategies that most people don't hear about until it's too late. I'm not here to sell anything today — just a quick 10-minute call to see if there's anything on your radar worth talking through. Is that fair?",
    objections: [
      "I already have a financial advisor",
      "I'm not interested in financial products",
      "I don't have money to invest right now",
      "How are you compensated?",
      "I'll just manage it myself",
      "Send me some information first",
    ],
  },
  other: {
    script:
      "Hi [Name], this is [Your Name] with [Company]. I'll keep it short — I'm reaching out because we work with [type of customer] in [Area] and I think there's a chance we could help you with [problem you solve]. Do you have two minutes for me to explain what we do?",
    objections: [
      "I'm not interested",
      "Now isn't a good time",
      "Send me information",
      "How much does it cost?",
      "I need to think about it",
      "I already have something in place",
    ],
  },
}

export function getDefaults(industry: string | null): IndustryDefaults {
  if (!industry) return INDUSTRY_DEFAULTS.other
  return INDUSTRY_DEFAULTS[industry] ?? INDUSTRY_DEFAULTS.other
}
