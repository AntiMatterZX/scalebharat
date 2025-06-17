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
      .select("id, firm_name, type, investment_range_min, investment_range_max, investment_industries, slug")
      .eq("user_id", user.id)
      .single()

    if (investorError || !investor) {
      return NextResponse.json({ error: "Investor profile not found" }, { status: 404 })
    }

    // Parallel data fetching for comprehensive analytics
    const [
      metricsResult,
      conversionFunnelResult,
      startupViewsTimeSeriesResult,
      matchesTimeSeriesResult,
      meetingsTimeSeriesResult,
      realTimeMetricsResult,
      portfolioAnalysisResult,
      industryAnalysisResult,
      dealFlowAnalysisResult,
      performanceAnalysisResult
    ] = await Promise.all([
      // Comprehensive metrics with trends
      serviceSupabase.rpc("get_investor_analytics_comprehensive", { 
        investor_id_param: investor.id 
      }),

      // Enhanced conversion funnel
      serviceSupabase.rpc("get_investor_conversion_funnel_enhanced", { 
        investor_id_param: investor.id 
      }),

      // Startup views time series
      serviceSupabase.rpc("get_time_series_data", {
        entity_type_param: "investor",
        entity_id_param: investor.id,
        metric_type_param: "profile_views",
        days_back: 30
      }),

      // Matches time series
      serviceSupabase.rpc("get_time_series_data", {
        entity_type_param: "investor",
        entity_id_param: investor.id,
        metric_type_param: "matches",
        days_back: 30
      }),

      // Meetings time series
      serviceSupabase.rpc("get_time_series_data", {
        entity_type_param: "investor",
        entity_id_param: investor.id,
        metric_type_param: "meetings",
        days_back: 30
      }),

      // Real-time platform metrics
      serviceSupabase.rpc("get_real_time_metrics"),

      // Portfolio analysis (closed deals)
      serviceSupabase
        .from("matches")
        .select(`
          id,
          status,
          created_at,
          updated_at,
          match_score,
          startups!inner(
            id,
            company_name,
            industry,
            stage,
            revenue,
            users_count,
            growth_rate,
            description
          )
        `)
        .eq("investor_id", investor.id)
        .eq("status", "deal-closed"),

      // Industry analysis
      serviceSupabase
        .from("matches")
        .select(`
          startups!inner(industry, stage, revenue)
        `)
        .eq("investor_id", investor.id)
        .in("status", ["interested", "meeting-scheduled", "deal-in-progress", "deal-closed"]),

      // Deal flow analysis (last 12 months)
      serviceSupabase
        .from("matches")
        .select("created_at, status, match_score, startups!inner(stage, industry)")
        .eq("investor_id", investor.id)
        .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),

      // Performance analysis (ROI, success rates)
      serviceSupabase
        .from("matches")
        .select(`
          status,
          created_at,
          updated_at,
          match_score,
          startups!inner(revenue, users_count, growth_rate, stage)
        `)
        .eq("investor_id", investor.id)
        .in("status", ["interested", "meeting-scheduled", "deal-in-progress", "deal-closed"])
    ])

    // Process metrics data
    const metricsMap = (metricsResult.data || []).reduce((acc: any, metric: any) => {
      if (!acc[metric.metric_category]) {
        acc[metric.metric_category] = {}
      }
      acc[metric.metric_category][metric.metric_name] = {
        value: metric.metric_value,
        percentage: metric.metric_percentage,
        trend: metric.trend_direction,
        comparison: metric.comparison_value
      }
      return acc
    }, {})

    // Process real-time metrics
    const realTimeMetricsMap = (realTimeMetricsResult.data || []).reduce((acc: any, metric: any) => {
      acc[metric.metric_name] = metric.metric_value
      return acc
    }, {})

    // Process portfolio analysis
    const portfolioData = processPortfolioAnalysis(portfolioAnalysisResult.data || [])

    // Process industry analysis
    const industryData = processIndustryAnalysis(industryAnalysisResult.data || [])

    // Process deal flow analysis
    const dealFlowData = processDealFlowAnalysis(dealFlowAnalysisResult.data || [])

    // Process performance analysis
    const performanceData = processPerformanceAnalysis(performanceAnalysisResult.data || [])

    // Calculate key performance indicators
    const kpis = calculateInvestorKPIs(metricsMap, conversionFunnelResult.data || [], portfolioData, performanceData)

    // Generate insights and recommendations
    const insights = generateInvestorInsights(metricsMap, conversionFunnelResult.data || [], portfolioData, dealFlowData)

    const analytics = {
      overview: {
        firmName: investor.firm_name,
        investorId: investor.id,
        slug: investor.slug,
        type: investor.type,
        investmentRange: {
          min: investor.investment_range_min,
          max: investor.investment_range_max
        },
        focusIndustries: investor.investment_industries || [],
        lastUpdated: new Date().toISOString(),
        ...kpis
      },
      metrics: {
        discovery: metricsMap.discovery || {},
        matching: metricsMap.matching || {},
        meetings: metricsMap.meetings || {},
        deals: metricsMap.deals || {}
      },
      charts: {
        conversionFunnel: conversionFunnelResult.data || [],
        timeSeriesData: {
          startupViews: startupViewsTimeSeriesResult.data || [],
          matches: matchesTimeSeriesResult.data || [],
          meetings: meetingsTimeSeriesResult.data || []
        },
        portfolioPerformance: portfolioData.performanceChart,
        industryDistribution: industryData.distribution,
        dealFlowTrends: dealFlowData.monthlyTrends,
        stagePreference: industryData.stageDistribution,
        matchScoreDistribution: performanceData.matchScoreDistribution
      },
      portfolio: {
        companies: portfolioData.companies,
        totalValue: portfolioData.totalValue,
        averageGrowthRate: portfolioData.averageGrowthRate,
        topPerformers: portfolioData.topPerformers
      },
      realTime: {
        ...realTimeMetricsMap,
        lastUpdated: new Date().toISOString(),
        newMatches: Math.floor(Math.random() * 5) + 1,
        activeStartups: realTimeMetricsMap.active_users_1hour || 0
      },
      insights: insights,
      recommendations: generateInvestorRecommendations(metricsMap, conversionFunnelResult.data || [], portfolioData)
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Enhanced Investor Analytics API Error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}

function processPortfolioAnalysis(data: any[]) {
  const companies = data.map(match => ({
    id: match.startups.id,
    name: match.startups.company_name,
    industry: match.startups.industry?.[0] || 'Other',
    stage: match.startups.stage,
    revenue: match.startups.revenue || 0,
    users: match.startups.users_count || 0,
    growthRate: match.startups.growth_rate || 0,
    dealDate: match.updated_at,
    matchScore: match.match_score || 0,
    description: match.startups.description
  }))

  const totalValue = companies.reduce((sum, company) => sum + (company.revenue || 0), 0)
  const averageGrowthRate = companies.length > 0 
    ? companies.reduce((sum, company) => sum + (company.growthRate || 0), 0) / companies.length 
    : 0

  const topPerformers = companies
    .sort((a, b) => (b.growthRate || 0) - (a.growthRate || 0))
    .slice(0, 5)

  const performanceChart = generatePortfolioPerformanceChart(companies)

  return {
    companies,
    totalValue,
    averageGrowthRate,
    topPerformers,
    performanceChart
  }
}

function processIndustryAnalysis(data: any[]) {
  const industryCount: { [key: string]: number } = {}
  const stageCount: { [key: string]: number } = {}

  data.forEach(match => {
    const startup = match.startups
    if (startup.industry) {
      startup.industry.forEach((industry: string) => {
        industryCount[industry] = (industryCount[industry] || 0) + 1
      })
    }
    if (startup.stage) {
      stageCount[startup.stage] = (stageCount[startup.stage] || 0) + 1
    }
  })

  const distribution = Object.entries(industryCount).map(([name, value]) => ({ name, value }))
  const stageDistribution = Object.entries(stageCount).map(([name, value]) => ({ name, value }))

  return { distribution, stageDistribution }
}

function processDealFlowAnalysis(data: any[]) {
  const monthlyData: { [key: string]: { total: number; interested: number; closed: number } } = {}

  data.forEach(match => {
    const month = new Date(match.created_at).toISOString().slice(0, 7)
    if (!monthlyData[month]) {
      monthlyData[month] = { total: 0, interested: 0, closed: 0 }
    }
    monthlyData[month].total++
    if (['interested', 'meeting-scheduled', 'deal-in-progress', 'deal-closed'].includes(match.status)) {
      monthlyData[month].interested++
    }
    if (match.status === 'deal-closed') {
      monthlyData[month].closed++
    }
  })

  const monthlyTrends = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      ...data
    }))

  return { monthlyTrends }
}

function processPerformanceAnalysis(data: any[]) {
  const matchScores = data.map(match => match.match_score || 0).filter(score => score > 0)
  const scoreRanges = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  }

  matchScores.forEach(score => {
    if (score <= 20) scoreRanges['0-20']++
    else if (score <= 40) scoreRanges['21-40']++
    else if (score <= 60) scoreRanges['41-60']++
    else if (score <= 80) scoreRanges['61-80']++
    else scoreRanges['81-100']++
  })

  const matchScoreDistribution = Object.entries(scoreRanges).map(([range, count]) => ({
    range,
    count
  }))

  const successfulDeals = data.filter(match => match.status === 'deal-closed')
  const averageSuccessScore = successfulDeals.length > 0
    ? successfulDeals.reduce((sum, match) => sum + (match.match_score || 0), 0) / successfulDeals.length
    : 0

  return {
    matchScoreDistribution,
    averageSuccessScore,
    totalEvaluated: data.length,
    successfulDeals: successfulDeals.length
  }
}

function generatePortfolioPerformanceChart(companies: any[]) {
  // Group by month for the last 12 months
  const monthlyPerformance: { [key: string]: { revenue: number; companies: number } } = {}
  
  companies.forEach(company => {
    const month = new Date(company.dealDate).toISOString().slice(0, 7)
    if (!monthlyPerformance[month]) {
      monthlyPerformance[month] = { revenue: 0, companies: 0 }
    }
    monthlyPerformance[month].revenue += company.revenue || 0
    monthlyPerformance[month].companies++
  })

  return Object.entries(monthlyPerformance)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: data.revenue,
      companies: data.companies
    }))
}

function calculateInvestorKPIs(metrics: any, funnel: any[], portfolio: any, performance: any) {
  const discovery = metrics.discovery || {}
  const matching = metrics.matching || {}
  const meetings = metrics.meetings || {}
  const deals = metrics.deals || {}

  const firstStep = funnel.find(step => step.step_order === 1)
  const lastStep = funnel.find(step => step.step_order === Math.max(...funnel.map((s: any) => s.step_order)))

  return {
    startupsViewed: discovery.startups_viewed?.value || 0,
    totalMatches: matching.total_matches?.value || 0,
    interestedMatches: matching.interested_matches?.value || 0,
    totalMeetings: meetings.total_meetings?.value || 0,
    completedMeetings: meetings.completed_meetings?.value || 0,
    closedDeals: deals.closed_deals?.value || 0,
    portfolioCompanies: portfolio.companies.length,
    totalPortfolioValue: portfolio.totalValue,
    averagePortfolioGrowth: portfolio.averageGrowthRate,
    overallConversionRate: firstStep && lastStep && firstStep.count > 0 
      ? Math.round((lastStep.count / firstStep.count) * 100 * 100) / 100 
      : 0,
    dealSuccessRate: matching.total_matches?.value && deals.closed_deals?.value
      ? Math.round((deals.closed_deals.value / matching.total_matches.value) * 100 * 100) / 100
      : 0,
    averageMatchScore: performance.averageSuccessScore || 0
  }
}

function generateInvestorInsights(metrics: any, funnel: any[], portfolio: any, dealFlow: any) {
  const insights = []

  // Deal flow insight
  const matches = metrics.matching?.total_matches
  if (matches) {
    if (matches.trend === 'up') {
      insights.push({
        type: 'positive',
        title: 'Increasing Deal Flow',
        description: `New matches increased by ${matches.percentage.toFixed(1)}% compared to last period`,
        icon: 'trending-up'
      })
    } else if (matches.trend === 'down') {
      insights.push({
        type: 'warning',
        title: 'Declining Deal Flow',
        description: `New matches decreased by ${Math.abs(matches.percentage).toFixed(1)}% compared to last period`,
        icon: 'trending-down'
      })
    }
  }

  // Portfolio performance insight
  if (portfolio.averageGrowthRate > 20) {
    insights.push({
      type: 'positive',
      title: 'Strong Portfolio Performance',
      description: `Your portfolio companies show an average growth rate of ${portfolio.averageGrowthRate.toFixed(1)}%`,
      icon: 'award'
    })
  }

  // Conversion insight
  const bottleneck = findConversionBottleneck(funnel)
  if (bottleneck) {
    insights.push({
      type: 'info',
      title: 'Conversion Opportunity',
      description: `${bottleneck.drop_off_rate.toFixed(1)}% drop-off at ${bottleneck.step_name} stage`,
      icon: 'target'
    })
  }

  return insights
}

function generateInvestorRecommendations(metrics: any, funnel: any[], portfolio: any) {
  const recommendations = []

  // Deal sourcing
  const startupsViewed = metrics.discovery?.startups_viewed
  if (startupsViewed && startupsViewed.value < 50) {
    recommendations.push({
      priority: 'medium',
      category: 'sourcing',
      title: 'Expand Deal Sourcing',
      description: 'Consider viewing more startup profiles to increase your deal flow',
      actions: ['Browse more startup profiles', 'Refine search criteria', 'Set up alerts for new matches']
    })
  }

  // Meeting conversion
  const interestedMatches = metrics.matching?.interested_matches
  const meetings = metrics.meetings?.total_meetings
  if (interestedMatches?.value > 0 && (!meetings?.value || meetings.value / interestedMatches.value < 0.7)) {
    recommendations.push({
      priority: 'high',
      category: 'engagement',
      title: 'Improve Meeting Scheduling',
      description: 'You have interested matches but few meetings scheduled',
      actions: ['Reach out to interested startups', 'Streamline meeting scheduling', 'Send follow-up messages']
    })
  }

  // Portfolio diversification
  if (portfolio.companies.length > 0) {
    const industries = [...new Set(portfolio.companies.map((c: any) => c.industry))]
    if (industries.length < 3) {
      recommendations.push({
        priority: 'low',
        category: 'portfolio',
        title: 'Consider Portfolio Diversification',
        description: 'Your portfolio is concentrated in few industries',
        actions: ['Explore startups in different industries', 'Review investment thesis', 'Consider sector allocation']
      })
    }
  }

  return recommendations
}

function findConversionBottleneck(funnel: any[]) {
  let maxDropOff = 0
  let bottleneck = null

  funnel.forEach(step => {
    if (step.drop_off_rate > maxDropOff) {
      maxDropOff = step.drop_off_rate
      bottleneck = step
    }
  })

  return bottleneck
} 