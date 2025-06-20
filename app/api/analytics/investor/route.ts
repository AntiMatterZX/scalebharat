import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Use service role for analytics queries
    const serviceSupabase = createSupabaseServiceRoleClient()

    // Get investor profile
    const { data: investor, error: investorError } = await serviceSupabase
      .from("investors")
      .select("id, firm_name")
      .eq("user_id", user.id)
      .single()

    if (investorError || !investor) {
      return NextResponse.json({ error: "Investor profile not found" }, { status: 404 })
    }

    // Parallel data fetching
    const [matchesResult, meetingsResult, portfolioResult, dealFlowResult, performanceResult, industryResult] =
      await Promise.all([
        // Matches analytics
        serviceSupabase
          .from("matches")
          .select("status, created_at, match_score, startups!inner(company_name, industry, stage)")
          .eq("investor_id", investor.id),

        // Meetings analytics
        serviceSupabase
          .from("meetings")
          .select("status, created_at, scheduled_at, type")
          .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
          .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),

        // Portfolio companies (deals closed)
        serviceSupabase
          .from("matches")
          .select("startups!inner(company_name, industry, stage, revenue, users_count)")
          .eq("investor_id", investor.id)
          .eq("status", "deal-closed"),

        // Deal flow by month
        serviceSupabase
          .from("matches")
          .select("created_at, status")
          .eq("investor_id", investor.id)
          .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),

        // Investment performance (mock data)
        Promise.resolve({ data: generateInvestmentPerformance(), error: null }),

        // Industry distribution
        serviceSupabase
          .from("matches")
          .select("startups!inner(industry)")
          .eq("investor_id", investor.id)
          .eq("status", "interested"),
      ])

    // Process data
    const matchesByStatus = (matchesResult.data || []).reduce((acc: any, match: any) => {
      acc[match.status] = (acc[match.status] || 0) + 1
      return acc
    }, {})

    const meetingsByStatus = (meetingsResult.data || []).reduce((acc: any, meeting: any) => {
      acc[meeting.status] = (acc[meeting.status] || 0) + 1
      return acc
    }, {})

    const dealFlowByMonth = processDealFlowData(dealFlowResult.data || [])
    const industryDistribution = processIndustryData(industryResult.data || [])

    const analytics = {
      overview: {
        totalMatches: matchesResult.data?.length || 0,
        interestedDeals: matchesByStatus.interested || 0,
        closedDeals: matchesByStatus["deal-closed"] || 0,
        totalMeetings: meetingsResult.data?.length || 0,
        portfolioCompanies: portfolioResult.data?.length || 0,
        averageMatchScore: calculateAverageMatchScore(matchesResult.data || []),
        conversionRate: calculateConversionRate(matchesResult.data || []),
        activeDeals: matchesByStatus["meeting-scheduled"] || 0,
      },
      charts: {
        matches: Object.entries(matchesByStatus).map(([status, count]) => ({
          name: status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          value: count,
        })),
        meetings: Object.entries(meetingsByStatus).map(([status, count]) => ({
          name: status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          value: count,
        })),
        dealFlow: dealFlowByMonth,
        industries: industryDistribution,
        performance: performanceResult.data,
        portfolio: processPortfolioData(portfolioResult.data || []),
      },
      realtime: {
        lastUpdated: new Date().toISOString(),
        newMatches: Math.floor(Math.random() * 5) + 1,
        activeStartups: Math.floor(Math.random() * 20) + 10,
      },
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Investor Analytics API Error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}

function processDealFlowData(data: any[]) {
  const result = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now)
    date.setMonth(date.getMonth() - i)
    const monthStr = date.toISOString().slice(0, 7)

    const monthData = data.filter((item) => {
      const itemMonth = new Date(item.created_at).toISOString().slice(0, 7)
      return itemMonth === monthStr
    })

    result.push({
      month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      total: monthData.length,
      interested: monthData.filter((item) => item.status === "interested").length,
      closed: monthData.filter((item) => item.status === "deal-closed").length,
    })
  }

  return result
}

function processIndustryData(data: any[]) {
  const industries: { [key: string]: number } = {}

  data.forEach((item) => {
    const startup = item.startups
    if (startup && startup.industry) {
      startup.industry.forEach((ind: string) => {
        industries[ind] = (industries[ind] || 0) + 1
      })
    }
  })

  return Object.entries(industries).map(([name, value]) => ({ name, value }))
}

function processPortfolioData(data: any[]) {
  return data.map((item) => ({
    name: item.startups.company_name,
    stage: item.startups.stage,
    revenue: item.startups.revenue || 0,
    users: item.startups.users_count || 0,
    industry: item.startups.industry?.[0] || "Other",
  }))
}

function calculateAverageMatchScore(matches: any[]) {
  if (matches.length === 0) return 0
  const total = matches.reduce((sum, match) => sum + (match.match_score || 0), 0)
  return Math.round((total / matches.length) * 100) / 100
}

function calculateConversionRate(matches: any[]) {
  if (matches.length === 0) return 0
  const interested = matches.filter((match) =>
    ["interested", "meeting-scheduled", "deal-closed"].includes(match.status),
  ).length
  return Math.round((interested / matches.length) * 100 * 100) / 100
}

function generateInvestmentPerformance() {
  const data = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now)
    date.setMonth(date.getMonth() - i)

    data.push({
      month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      invested: Math.floor(Math.random() * 500000) + 100000,
      returns: Math.floor(Math.random() * 200000) + 50000,
      deals: Math.floor(Math.random() * 5) + 1,
    })
  }

  return data
}
