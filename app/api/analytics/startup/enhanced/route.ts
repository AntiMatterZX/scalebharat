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

    // Get startup profile
    const { data: startup, error: startupError } = await serviceSupabase
      .from("startups")
      .select("id, company_name, slug")
      .eq("user_id", user.id)
      .single()

    if (startupError || !startup) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 })
    }

    // Parallel data fetching for comprehensive analytics
    const [
      metricsResult,
      conversionFunnelResult,
      profileViewsTimeSeriesResult,
      matchesTimeSeriesResult,
      meetingsTimeSeriesResult,
      realTimeMetricsResult,
      industryAnalysisResult,
      competitorAnalysisResult,
      engagementAnalysisResult
    ] = await Promise.all([
      // Comprehensive metrics with trends
      serviceSupabase.rpc("get_startup_analytics_comprehensive", { 
        startup_id_param: startup.id 
      }),

      // Enhanced conversion funnel
      serviceSupabase.rpc("get_startup_conversion_funnel_enhanced", { 
        startup_id_param: startup.id 
      }),

      // Profile views time series
      serviceSupabase.rpc("get_time_series_data", {
        entity_type_param: "startup",
        entity_id_param: startup.id,
        metric_type_param: "profile_views",
        days_back: 30
      }),

      // Matches time series
      serviceSupabase.rpc("get_time_series_data", {
        entity_type_param: "startup",
        entity_id_param: startup.id,
        metric_type_param: "matches",
        days_back: 30
      }),

      // Meetings time series
      serviceSupabase.rpc("get_time_series_data", {
        entity_type_param: "startup",
        entity_id_param: startup.id,
        metric_type_param: "meetings",
        days_back: 30
      }),

      // Real-time platform metrics
      serviceSupabase.rpc("get_real_time_metrics"),

      // Industry analysis
      serviceSupabase
        .from("startups")
        .select("industry")
        .eq("id", startup.id)
        .single()
        .then(async (result) => {
          if (result.data?.industry) {
            return serviceSupabase
              .from("startups")
              .select("id, company_name, upvote_count, view_count")
              .contains("industry", result.data.industry)
              .neq("id", startup.id)
              .limit(10)
          }
          return { data: [], error: null }
        }),

      // Competitor analysis (similar stage/industry)
      serviceSupabase
        .from("startups")
        .select("stage, industry")
        .eq("id", startup.id)
        .single()
        .then(async (result) => {
          if (result.data) {
            return serviceSupabase
              .from("startups")
              .select("id, company_name, stage, upvote_count, view_count")
              .eq("stage", result.data.stage)
              .contains("industry", result.data.industry || [])
              .neq("id", startup.id)
              .limit(5)
          }
          return { data: [], error: null }
        }),

      // Engagement analysis (investor types viewing profile)
      serviceSupabase
        .from("analytics")
        .select(`
          user_id,
          timestamp,
          users!inner(
            id,
            investors(
              id,
              type,
              investment_range_min,
              investment_range_max,
              investment_industries
            )
          )
        `)
        .eq("type", "profile-view")
        .eq("target_id", startup.id)
        .gte("timestamp", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100)
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

    // Process engagement analysis
    const investorEngagement = processInvestorEngagement(engagementAnalysisResult.data || [])

    // Calculate key performance indicators
    const kpis = calculateKPIs(metricsMap, conversionFunnelResult.data || [])

    // Generate insights and recommendations
    const insights = generateInsights(metricsMap, conversionFunnelResult.data || [], investorEngagement)

    const analytics = {
      overview: {
        companyName: startup.company_name,
        startupId: startup.id,
        slug: startup.slug,
        lastUpdated: new Date().toISOString(),
        ...kpis
      },
      metrics: {
        engagement: metricsMap.engagement || {},
        matching: metricsMap.matching || {},
        meetings: metricsMap.meetings || {},
        social: metricsMap.social || {}
      },
      charts: {
        conversionFunnel: conversionFunnelResult.data || [],
        timeSeriesData: {
          profileViews: profileViewsTimeSeriesResult.data || [],
          matches: matchesTimeSeriesResult.data || [],
          meetings: meetingsTimeSeriesResult.data || []
        },
        investorEngagement: investorEngagement,
        industryComparison: processIndustryComparison(industryAnalysisResult.data || []),
        competitorAnalysis: competitorAnalysisResult.data || []
      },
      realTime: {
        ...realTimeMetricsMap,
        lastUpdated: new Date().toISOString(),
        liveViews: Math.floor(Math.random() * 10) + 1, // Would be from real-time tracking
        activeUsers: realTimeMetricsMap.active_users_5min || 0
      },
      insights: insights,
      recommendations: generateRecommendations(metricsMap, conversionFunnelResult.data || [])
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Enhanced Startup Analytics API Error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}

function processInvestorEngagement(data: any[]) {
  const engagement = {
    byInvestorType: {} as any,
    byInvestmentRange: {} as any,
    byIndustry: {} as any,
    totalUniqueInvestors: 0
  }

  const uniqueInvestors = new Set()

  data.forEach(item => {
    if (item.users?.investors?.[0]) {
      const investor = item.users.investors[0]
      uniqueInvestors.add(investor.id)

      // By investor type
      const type = investor.type || 'unknown'
      engagement.byInvestorType[type] = (engagement.byInvestorType[type] || 0) + 1

      // By investment range
      const range = getInvestmentRangeLabel(investor.investment_range_min, investor.investment_range_max)
      engagement.byInvestmentRange[range] = (engagement.byInvestmentRange[range] || 0) + 1

      // By industry focus
      if (investor.investment_industries) {
        investor.investment_industries.forEach((industry: string) => {
          engagement.byIndustry[industry] = (engagement.byIndustry[industry] || 0) + 1
        })
      }
    }
  })

  engagement.totalUniqueInvestors = uniqueInvestors.size

  return engagement
}

function getInvestmentRangeLabel(min?: number, max?: number): string {
  if (!min && !max) return 'Unspecified'
  if (!max && min) return `$${formatCurrency(min)}+`
  if (!min && max) return `Up to $${formatCurrency(max)}`
  if (min && max) return `$${formatCurrency(min)} - $${formatCurrency(max)}`
  return 'Unspecified'
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
  return amount.toString()
}

function processIndustryComparison(competitors: any[]) {
  return competitors.map(comp => ({
    name: comp.company_name,
    upvotes: comp.upvote_count || 0,
    views: comp.view_count || 0,
    engagement: ((comp.upvote_count || 0) / Math.max(comp.view_count || 1, 1)) * 100
  }))
}

function calculateKPIs(metrics: any, funnel: any[]) {
  const engagement = metrics.engagement || {}
  const matching = metrics.matching || {}
  const meetings = metrics.meetings || {}

  const firstStep = funnel.find(step => step.step_order === 1)
  const lastStep = funnel.find(step => step.step_order === Math.max(...funnel.map((s: any) => s.step_order)))

  return {
    totalProfileViews: engagement.profile_views?.value || 0,
    uniqueViewers: engagement.unique_viewers?.value || 0,
    totalMatches: matching.total_matches?.value || 0,
    interestedMatches: matching.interested_matches?.value || 0,
    totalMeetings: meetings.total_meetings?.value || 0,
    completedMeetings: meetings.completed_meetings?.value || 0,
    overallConversionRate: firstStep && lastStep && firstStep.count > 0 
      ? Math.round((lastStep.count / firstStep.count) * 100 * 100) / 100 
      : 0,
    engagementRate: engagement.profile_views?.value && engagement.unique_viewers?.value
      ? Math.round((engagement.unique_viewers.value / engagement.profile_views.value) * 100 * 100) / 100
      : 0,
    meetingConversionRate: matching.interested_matches?.value && meetings.total_meetings?.value
      ? Math.round((meetings.total_meetings.value / matching.interested_matches.value) * 100 * 100) / 100
      : 0
  }
}

function generateInsights(metrics: any, funnel: any[], engagement: any) {
  const insights = []

  // Profile views insight
  const profileViews = metrics.engagement?.profile_views
  if (profileViews) {
    if (profileViews.trend === 'up') {
      insights.push({
        type: 'positive',
        title: 'Growing Visibility',
        description: `Profile views increased by ${profileViews.percentage.toFixed(1)}% compared to last period`,
        icon: 'trending-up'
      })
    } else if (profileViews.trend === 'down') {
      insights.push({
        type: 'warning',
        title: 'Declining Visibility',
        description: `Profile views decreased by ${Math.abs(profileViews.percentage).toFixed(1)}% compared to last period`,
        icon: 'trending-down'
      })
    }
  }

  // Investor engagement insight
  if (engagement.totalUniqueInvestors > 0) {
    const topInvestorType = Object.entries(engagement.byInvestorType)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]
    
    if (topInvestorType) {
      insights.push({
        type: 'info',
        title: 'Investor Interest',
        description: `${topInvestorType[0]} investors show the most interest in your startup`,
        icon: 'users'
      })
    }
  }

  // Conversion funnel insight
  const bottleneck = findConversionBottleneck(funnel) as any
  if (bottleneck && bottleneck.drop_off_rate > 0) {
    insights.push({
      type: 'warning',
      title: 'Conversion Bottleneck',
      description: `${bottleneck.drop_off_rate.toFixed(1)}% drop-off at ${bottleneck.step_name}`,
      icon: 'alert-triangle'
    })
  }

  return insights
}

function generateRecommendations(metrics: any, funnel: any[]) {
  const recommendations = []

  // Profile optimization
  const profileViews = metrics.engagement?.profile_views
  if (profileViews && profileViews.value < 100) {
    recommendations.push({
      priority: 'high',
      category: 'visibility',
      title: 'Improve Profile Visibility',
      description: 'Consider updating your startup description, adding more compelling visuals, and engaging more with the community',
      actions: ['Update company description', 'Add high-quality images', 'Share updates regularly']
    })
  }

  // Matching optimization
  const matches = metrics.matching?.total_matches
  if (matches && matches.value < 10) {
    recommendations.push({
      priority: 'medium',
      category: 'matching',
      title: 'Enhance Matching Potential',
      description: 'Optimize your startup profile to attract more relevant investors',
      actions: ['Review industry tags', 'Update funding stage', 'Clarify value proposition']
    })
  }

  // Meeting conversion
  const interestedMatches = metrics.matching?.interested_matches
  const meetings = metrics.meetings?.total_meetings
  if (interestedMatches?.value > 0 && (!meetings?.value || meetings.value / interestedMatches.value < 0.5)) {
    recommendations.push({
      priority: 'high',
      category: 'engagement',
      title: 'Improve Meeting Conversion',
      description: 'You have interested investors but few meetings scheduled',
      actions: ['Follow up on interested matches', 'Improve pitch deck', 'Be more proactive in scheduling']
    })
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