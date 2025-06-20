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
      .select("id, company_name")
      .eq("user_id", user.id)
      .single()

    if (startupError || !startup) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 })
    }

    // Parallel data fetching for better performance
    const [
      profileViewsResult,
      matchesResult,
      messagesResult,
      meetingsResult,
      upvotesResult,
      revenueResult,
      growthResult,
      conversionResult,
    ] = await Promise.all([
      // Profile views over time
      serviceSupabase
        .from("analytics")
        .select("timestamp")
        .eq("type", "profile-view")
        .eq("target_id", startup.id)
        .gte("timestamp", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Matches analytics
      serviceSupabase
        .from("matches")
        .select("status, created_at, match_score")
        .eq("startup_id", startup.id),

      // Messages analytics
      serviceSupabase
        .from("messages")
        .select("created_at, type")
        .eq("receiver_id", user.id)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Meetings analytics
      serviceSupabase
        .from("meetings")
        .select("status, created_at, scheduled_at, type")
        .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
        .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),

      // Upvotes over time
      serviceSupabase
        .from("startup_upvotes")
        .select("created_at")
        .eq("startup_id", startup.id)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Revenue data (from startup profile updates)
      serviceSupabase
        .from("startups")
        .select("revenue, users_count, growth_rate, updated_at")
        .eq("id", startup.id)
        .single(),

      // Growth metrics over time (mock data for now - would come from integrations)
      Promise.resolve({ data: generateGrowthData(), error: null }),

      // Conversion funnel
      serviceSupabase.rpc("get_startup_conversion_funnel", { startup_id: startup.id }),
    ])

    // Process profile views by day
    const profileViewsByDay = processTimeSeriesData(profileViewsResult.data || [], 30)

    // Process matches by status
    const matchesByStatus = (matchesResult.data || []).reduce((acc: any, match: any) => {
      acc[match.status] = (acc[match.status] || 0) + 1
      return acc
    }, {})

    // Process messages by day
    const messagesByDay = processTimeSeriesData(messagesResult.data || [], 30)

    // Process meetings by status
    const meetingsByStatus = (meetingsResult.data || []).reduce((acc: any, meeting: any) => {
      acc[meeting.status] = (acc[meeting.status] || 0) + 1
      return acc
    }, {})

    // Process upvotes by day
    const upvotesByDay = processTimeSeriesData(upvotesResult.data || [], 30)

    // Calculate key metrics
    const totalMatches = matchesResult.data?.length || 0
    const interestedMatches = matchesByStatus.interested || 0
    const conversionRate = totalMatches > 0 ? (interestedMatches / totalMatches) * 100 : 0

    const analytics = {
      overview: {
        totalProfileViews: profileViewsResult.data?.length || 0,
        totalMatches,
        interestedMatches,
        totalMeetings: meetingsResult.data?.length || 0,
        totalUpvotes: upvotesResult.data?.length || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
        currentRevenue: revenueResult.data?.revenue || 0,
        currentUsers: revenueResult.data?.users_count || 0,
        growthRate: revenueResult.data?.growth_rate || 0,
      },
      charts: {
        profileViews: profileViewsByDay,
        matches: Object.entries(matchesByStatus).map(([status, count]) => ({
          name: status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          value: count,
        })),
        messages: messagesByDay,
        meetings: Object.entries(meetingsByStatus).map(([status, count]) => ({
          name: status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          value: count,
        })),
        upvotes: upvotesByDay,
        growth: growthResult.data,
        conversion: conversionResult.data || [],
      },
      realtime: {
        lastUpdated: new Date().toISOString(),
        activeUsers: Math.floor(Math.random() * 50) + 10, // Would come from real-time tracking
        liveViews: Math.floor(Math.random() * 10) + 1,
      },
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Analytics API Error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}

function processTimeSeriesData(data: any[], days: number) {
  const result = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    const count = data.filter((item) => {
      const itemDate = new Date(item.timestamp || item.created_at).toISOString().split("T")[0]
      return itemDate === dateStr
    }).length

    result.push({
      date: dateStr,
      value: count,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    })
  }

  return result
}

function generateGrowthData() {
  const data = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now)
    date.setMonth(date.getMonth() - i)

    data.push({
      month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      revenue: Math.floor(Math.random() * 50000) + 10000,
      users: Math.floor(Math.random() * 1000) + 500,
      growth: Math.floor(Math.random() * 20) + 5,
    })
  }

  return data
}
