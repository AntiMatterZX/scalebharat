import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

type Startup = Database["public"]["Tables"]["startups"]["Row"]
type Investor = Database["public"]["Tables"]["investors"]["Row"]

export interface MatchScore {
  total: number
  breakdown: {
    industry: number
    stage: number
    businessModel: number
    checkSize: number
    geography: number
  }
}

export interface MatchResult {
  startupId: string
  investorId: string
  score: MatchScore
  reasons: string[]
}

// Industry mapping for better matching
const INDUSTRY_CATEGORIES = {
  fintech: ["financial-services", "payments", "banking", "insurance"],
  healthtech: ["healthcare", "medical-devices", "biotechnology", "pharmaceuticals"],
  edtech: ["education", "e-learning", "training"],
  ecommerce: ["retail", "marketplace", "consumer-goods"],
  saas: ["software", "enterprise-software", "productivity"],
  "ai-ml": ["artificial-intelligence", "machine-learning", "data-analytics"],
  mobility: ["transportation", "automotive", "logistics"],
  proptech: ["real-estate", "construction", "property-management"],
  foodtech: ["food-beverage", "agriculture", "restaurant-tech"],
  cleantech: ["renewable-energy", "sustainability", "environment"],
}

// Stage progression mapping
const STAGE_PROGRESSION = {
  idea: ["pre-seed", "seed"],
  prototype: ["pre-seed", "seed"],
  mvp: ["seed", "series-a"],
  "early-stage": ["series-a", "series-b"],
  growth: ["series-b", "series-c"],
  expansion: ["series-c", "series-d", "growth", "late-stage"],
}

export function calculateMatchScore(startup: Startup, investor: Investor): MatchResult {
  const breakdown = {
    industry: 0,
    stage: 0,
    businessModel: 0,
    checkSize: 0,
    geography: 0,
  }
  const reasons: string[] = []

  // Industry alignment (35% weight)
  if (startup.industry && investor.investment_industries) {
    const startupIndustries = Array.isArray(startup.industry) ? startup.industry : [startup.industry]
    const investorIndustries = Array.isArray(investor.investment_industries)
      ? investor.investment_industries
      : [investor.investment_industries]

    // Direct match
    const directMatch = startupIndustries.some((ind) => investorIndustries.includes(ind))

    // Category match
    let categoryMatch = false
    for (const [category, industries] of Object.entries(INDUSTRY_CATEGORIES)) {
      const startupInCategory = startupIndustries.some((ind) => industries.includes(ind))
      const investorInCategory = investorIndustries.some((ind) => industries.includes(ind))
      if (startupInCategory && investorInCategory) {
        categoryMatch = true
        break
      }
    }

    if (directMatch) {
      breakdown.industry = 35
      reasons.push("Perfect industry alignment")
    } else if (categoryMatch) {
      breakdown.industry = 25
      reasons.push("Related industry focus")
    } else if (investorIndustries.includes("generalist") || investorIndustries.includes("sector-agnostic")) {
      breakdown.industry = 15
      reasons.push("Generalist investor")
    }
  }

  // Stage alignment (25% weight)
  if (startup.stage && investor.investment_stages) {
    const startupStages = STAGE_PROGRESSION[startup.stage as keyof typeof STAGE_PROGRESSION] || [startup.stage]
    const investorStages = Array.isArray(investor.investment_stages)
      ? investor.investment_stages
      : [investor.investment_stages]

    const hasStageMatch = startupStages.some((stage) => investorStages.includes(stage))

    if (hasStageMatch) {
      breakdown.stage = 25
      reasons.push(`Invests in ${startup.stage} stage`)
    } else {
      // Partial match for adjacent stages
      const adjacentStages = ["pre-seed", "seed", "series-a", "series-b"]
      const startupStageIndex = adjacentStages.indexOf(startup.stage)
      const hasAdjacentMatch = investorStages.some((stage) => {
        const investorStageIndex = adjacentStages.indexOf(stage)
        return Math.abs(startupStageIndex - investorStageIndex) <= 1
      })

      if (hasAdjacentMatch) {
        breakdown.stage = 15
        reasons.push("Adjacent stage match")
      }
    }
  }

  // Business model alignment (20% weight)
  if (startup.business_model && investor.business_models) {
    const modelMapping = {
      b2b: ["b2b", "enterprise", "saas"],
      b2c: ["b2c", "consumer", "marketplace"],
      b2b2c: ["b2b2c", "platform"],
      marketplace: ["marketplace", "platform", "b2c"],
      saas: ["saas", "b2b", "enterprise"],
    }

    const startupModels = modelMapping[startup.business_model as keyof typeof modelMapping] || [startup.business_model]
    const investorModels = Array.isArray(investor.business_models)
      ? investor.business_models
      : [investor.business_models]

    const hasModelMatch = startupModels.some((model) => investorModels.includes(model))

    if (hasModelMatch) {
      breakdown.businessModel = 20
      reasons.push(`Matches ${startup.business_model} business model`)
    }
  }

  // Check size alignment (15% weight)
  if (startup.target_amount && investor.check_size_min && investor.check_size_max) {
    const targetInK = startup.target_amount / 1000
    const minCheck = investor.check_size_min
    const maxCheck = investor.check_size_max

    if (targetInK >= minCheck && targetInK <= maxCheck) {
      breakdown.checkSize = 15
      reasons.push(`Check size matches funding needs`)
    } else if (targetInK >= minCheck * 0.5 && targetInK <= maxCheck * 1.5) {
      breakdown.checkSize = 10
      reasons.push("Partial check size alignment")
    }
  }

  // Geography alignment (5% weight)
  if (investor.investment_geographies) {
    const geographies = Array.isArray(investor.investment_geographies)
      ? investor.investment_geographies
      : [investor.investment_geographies]

    if (geographies.includes("global") || geographies.includes("worldwide")) {
      breakdown.geography = 5
      reasons.push("Global investment scope")
    } else {
      breakdown.geography = 3
      reasons.push("Regional investment focus")
    }
  }

  const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0)

  return {
    startupId: startup.id,
    investorId: investor.id,
    score: { total, breakdown },
    reasons,
  }
}

export async function generateMatches(supabase: any, userId: string, userType: string): Promise<any[]> {
  try {
    console.log(`Generating matches for ${userType} user: ${userId}`)

    if (userType === "startup") {
      // Get startup profile
      const { data: startup, error: startupError } = await supabase
        .from("startups")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (startupError) {
        console.error("Error fetching startup:", startupError)
        throw new Error(`Failed to fetch startup profile: ${startupError.message}`)
      }

      if (!startup) {
        throw new Error("Startup profile not found")
      }

      console.log("Found startup:", startup.id)

      // Get active investors
      const { data: investors, error: investorsError } = await supabase
        .from("investors")
        .select("*")
        .eq("status", "active")

      if (investorsError) {
        console.error("Error fetching investors:", investorsError)
        throw new Error(`Failed to fetch investors: ${investorsError.message}`)
      }

      if (!investors || investors.length === 0) {
        console.log("No active investors found")
        return []
      }

      console.log(`Found ${investors.length} active investors`)

      // Calculate matches
      const matchResults = investors
        .map((investor) => calculateMatchScore(startup, investor))
        .filter((match) => match.score.total >= 30) // Minimum 30% match
        .sort((a, b) => b.score.total - a.score.total)
        .slice(0, 20) // Top 20 matches

      console.log(`Generated ${matchResults.length} potential matches`)

      // Store matches in database
      const createdMatches = []
      for (const match of matchResults) {
        try {
          // Check if match already exists
          const { data: existingMatch } = await supabase
            .from("matches")
            .select("id")
            .eq("startup_id", match.startupId)
            .eq("investor_id", match.investorId)
            .maybeSingle()

          if (!existingMatch) {
            const { data: newMatch, error: matchError } = await supabase
              .from("matches")
              .insert({
                startup_id: match.startupId,
                investor_id: match.investorId,
                match_score: match.score.total,
                status: "pending",
                initiated_by: "system",
                match_reasons: match.reasons,
              })
              .select()
              .single()

            if (matchError) {
              console.error("Error creating match:", matchError)
            } else {
              createdMatches.push(newMatch)
            }
          }
        } catch (error) {
          console.error("Error processing match:", error)
        }
      }

      console.log(`Created ${createdMatches.length} new matches`)
      return createdMatches
    } else if (userType === "investor") {
      // Get investor profile
      const { data: investor, error: investorError } = await supabase
        .from("investors")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (investorError) {
        console.error("Error fetching investor:", investorError)
        throw new Error(`Failed to fetch investor profile: ${investorError.message}`)
      }

      if (!investor) {
        throw new Error("Investor profile not found")
      }

      console.log("Found investor:", investor.id)

      // Get published startups
      const { data: startups, error: startupsError } = await supabase
        .from("startups")
        .select("*")
        .eq("status", "published")

      if (startupsError) {
        console.error("Error fetching startups:", startupsError)
        throw new Error(`Failed to fetch startups: ${startupsError.message}`)
      }

      if (!startups || startups.length === 0) {
        console.log("No published startups found")
        return []
      }

      console.log(`Found ${startups.length} published startups`)

      // Calculate matches
      const matchResults = startups
        .map((startup) => calculateMatchScore(startup, investor))
        .filter((match) => match.score.total >= 30) // Minimum 30% match
        .sort((a, b) => b.score.total - a.score.total)
        .slice(0, 20) // Top 20 matches

      console.log(`Generated ${matchResults.length} potential matches`)

      // Store matches in database
      const createdMatches = []
      for (const match of matchResults) {
        try {
          // Check if match already exists
          const { data: existingMatch } = await supabase
            .from("matches")
            .select("id")
            .eq("startup_id", match.startupId)
            .eq("investor_id", match.investorId)
            .maybeSingle()

          if (!existingMatch) {
            const { data: newMatch, error: matchError } = await supabase
              .from("matches")
              .insert({
                startup_id: match.startupId,
                investor_id: match.investorId,
                match_score: match.score.total,
                status: "pending",
                initiated_by: "system",
                match_reasons: match.reasons,
              })
              .select()
              .single()

            if (matchError) {
              console.error("Error creating match:", matchError)
            } else {
              createdMatches.push(newMatch)
            }
          }
        } catch (error) {
          console.error("Error processing match:", error)
        }
      }

      console.log(`Created ${createdMatches.length} new matches`)
      return createdMatches
    }

    throw new Error("Invalid user type")
  } catch (error: any) {
    console.error("Error in generateMatches:", error)
    throw error
  }
}

export async function generateMatchesForStartup(startupId: string): Promise<MatchResult[]> {
  try {
    const supabase = createSupabaseServerClient()

    // Get startup details
    const { data: startup } = await supabase.from("startups").select("*").eq("id", startupId).single()

    if (!startup) return []

    // Get active investors
    const { data: investors } = await supabase.from("investors").select("*").eq("status", "active")

    if (!investors) return []

    // Calculate matches
    const matches = investors
      .map((investor) => calculateMatchScore(startup, investor))
      .filter((match) => match.score.total >= 30) // Minimum 30% match
      .sort((a, b) => b.score.total - a.score.total)

    return matches.slice(0, 50) // Top 50 matches
  } catch (error) {
    console.error("Error generating matches for startup:", error)
    return []
  }
}

export async function generateMatchesForInvestor(investorId: string): Promise<MatchResult[]> {
  try {
    const supabase = createSupabaseServerClient()

    // Get investor details
    const { data: investor } = await supabase.from("investors").select("*").eq("id", investorId).single()

    if (!investor) return []

    // Get published startups
    const { data: startups } = await supabase.from("startups").select("*").eq("status", "published")

    if (!startups) return []

    // Calculate matches
    const matches = startups
      .map((startup) => calculateMatchScore(startup, investor))
      .filter((match) => match.score.total >= 30) // Minimum 30% match
      .sort((a, b) => b.score.total - a.score.total)

    return matches.slice(0, 50) // Top 50 matches
  } catch (error) {
    console.error("Error generating matches for investor:", error)
    return []
  }
}

export async function createMatch(
  startupId: string,
  investorId: string,
  score: number,
  initiatedBy: "startup" | "investor" | "system",
) {
  try {
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from("matches")
      .insert({
        startup_id: startupId,
        investor_id: investorId,
        match_score: score,
        status: "pending",
        initiated_by: initiatedBy,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating match:", error)
    return null
  }
}
