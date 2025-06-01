import type { Database } from "@/types/database"

type Startup = Database["public"]["Tables"]["startups"]["Row"]
type Investor = Database["public"]["Tables"]["investors"]["Row"]

export interface MatchResult {
  startupId: string
  investorId: string
  score: number
  factors: {
    industryAlignment: number
    stagePreference: number
    businessModelFit: number
    checkSizeMatch: number
    geographyMatch: number
  }
}

export function calculateMatchScore(startup: Startup, investor: Investor): MatchResult {
  let totalScore = 0
  const factors = {
    industryAlignment: 0,
    stagePreference: 0,
    businessModelFit: 0,
    checkSizeMatch: 0,
    geographyMatch: 0,
  }

  // Industry Alignment (30%)
  const industryMatch = startup.industry.some((ind) => investor.investment_industries?.includes(ind))
  if (industryMatch) {
    factors.industryAlignment = 30
    totalScore += 30
  }

  // Stage Preference (25%)
  const stageMapping: Record<string, string[]> = {
    idea: ["Pre-seed", "Seed"],
    prototype: ["Pre-seed", "Seed"],
    mvp: ["Seed", "Series A"],
    "early-stage": ["Series A", "Series B"],
    growth: ["Series B", "Series C"],
    expansion: ["Series C", "Series D+", "Growth", "Late Stage"],
  }

  const startupStages = stageMapping[startup.stage] || []
  const hasStageMatch = startupStages.some((stage) => investor.investment_stages?.includes(stage))
  if (hasStageMatch) {
    factors.stagePreference = 25
    totalScore += 25
  }

  // Business Model Fit (20%)
  const businessModelMapping: Record<string, string[]> = {
    b2b: ["B2B"],
    b2c: ["B2C"],
    b2b2c: ["B2B2C"],
    marketplace: ["Marketplace"],
    saas: ["SaaS", "B2B"],
    other: ["Other"],
  }

  const startupModels = businessModelMapping[startup.business_model] || []
  const hasBusinessModelMatch = startupModels.some((model) => investor.business_models?.includes(model))
  if (hasBusinessModelMatch) {
    factors.businessModelFit = 20
    totalScore += 20
  }

  // Check Size Match (15%)
  if (investor.check_size_min && investor.check_size_max && startup.target_amount) {
    const targetInK = startup.target_amount / 1000
    if (targetInK >= investor.check_size_min && targetInK <= investor.check_size_max) {
      factors.checkSizeMatch = 15
      totalScore += 15
    }
  }

  // Geography Match (10%) - simplified for now
  if (investor.investment_geographies?.includes("Global")) {
    factors.geographyMatch = 10
    totalScore += 10
  }

  return {
    startupId: startup.id,
    investorId: investor.id,
    score: Math.min(totalScore, 100),
    factors,
  }
}

export async function generateMatches(
  supabase: any,
  userId: string,
  userType: "startup" | "investor",
): Promise<MatchResult[]> {
  try {
    if (userType === "startup") {
      // Get startup profile
      const { data: startup } = await supabase.from("startups").select("*").eq("user_id", userId).single()

      if (!startup) return []

      // Get all active investors
      const { data: investors } = await supabase.from("investors").select("*").eq("status", "active")

      if (!investors) return []

      // Calculate matches
      const matches = investors
        .map((investor) => calculateMatchScore(startup, investor))
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score)

      return matches
    } else {
      // Get investor profile
      const { data: investor } = await supabase.from("investors").select("*").eq("user_id", userId).single()

      if (!investor) return []

      // Get all published startups
      const { data: startups } = await supabase.from("startups").select("*").eq("status", "published")

      if (!startups) return []

      // Calculate matches
      const matches = startups
        .map((startup) => calculateMatchScore(startup, investor))
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score)

      return matches
    }
  } catch (error) {
    console.error("Error generating matches:", error)
    return []
  }
}
