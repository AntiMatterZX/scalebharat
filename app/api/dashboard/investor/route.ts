import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createSupabaseServerClient(cookieStore)

    // Try to get the user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      // If cookie-based auth fails, try Bearer token
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7)
        const {
          data: { user: tokenUser },
          error: tokenError,
        } = await supabase.auth.getUser(token)

        if (tokenError || !tokenUser) {
          console.error("API Investor Dashboard - Token auth error:", tokenError?.message)
          return NextResponse.json(
            { error: "Unauthorized: Invalid token - " + (tokenError?.message || "No user found") },
            { status: 401 },
          )
        }

        // Use the token user
        const authenticatedUser = tokenUser
        return await fetchInvestorDashboardData(supabase, authenticatedUser)
      }

      console.error("API Investor Dashboard - Auth error:", authError?.message)
      return NextResponse.json({ error: "Unauthorized: " + (authError?.message || "No user session") }, { status: 401 })
    }

    return await fetchInvestorDashboardData(supabase, user)
  } catch (error: any) {
    console.error("API Investor Dashboard - Catch error:", error.message)
    return NextResponse.json({ error: "Failed to load investor dashboard data: " + error.message }, { status: 500 })
  }
}

async function fetchInvestorDashboardData(supabase: any, user: any) {
  // Use service role client for some operations to bypass RLS issues
  const serviceSupabase = createSupabaseServiceRoleClient()

  const { data: investor, error: investorError } = await supabase
    .from("investors")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (investorError || !investor) {
    console.error("API Investor Dashboard - Investor profile not found or error:", investorError?.message)
    return NextResponse.json({ error: "Investor profile not found for the authenticated user." }, { status: 404 })
  }

  // Fetch match stats using service role
  const { count: totalMatches, error: totalMatchesError } = await serviceSupabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("investor_id", investor.id)

  const { count: interestedStartups, error: interestedError } = await serviceSupabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("investor_id", investor.id)
    .eq("status", "interested")

  // Fetch meeting stats using service role
  const { count: meetingsScheduled, error: meetingsError } = await serviceSupabase
    .from("meetings")
    .select("*", { count: "exact", head: true })
    .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
    .in("status", ["pending", "confirmed"])

  // Fetch upcoming meetings using service role
  const { data: upcomingMeetingsData, error: upcomingMeetingsFetchError } = await serviceSupabase
    .from("meetings")
    .select("*, match_id")
    .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
    .gte("scheduled_at", new Date().toISOString())
    .in("status", ["pending", "confirmed"])
    .order("scheduled_at", { ascending: true })
    .limit(5)

  // Process meetings to get startup names if needed
  let processedMeetings = []
  if (upcomingMeetingsData && upcomingMeetingsData.length > 0) {
    // Get match IDs from meetings
    const matchIds = upcomingMeetingsData.map((meeting) => meeting.match_id).filter(Boolean)

    // Get startup information for these matches using service role
    if (matchIds.length > 0) {
      const { data: matchesData, error: matchesError } = await serviceSupabase
        .from("matches")
        .select("id, startup_id")
        .in("id", matchIds)

      if (!matchesError && matchesData) {
        // Create a map of match_id to startup_id
        const matchToStartupMap = matchesData.reduce((acc, match) => {
          acc[match.id] = match.startup_id
          return acc
        }, {})

        // Get startup names
        const startupIds = matchesData.map((match) => match.startup_id).filter(Boolean)
        if (startupIds.length > 0) {
          const { data: startupsData, error: startupsError } = await serviceSupabase
            .from("startups")
            .select("id, company_name")
            .in("id", startupIds)

          if (!startupsError && startupsData) {
            // Create a map of startup_id to company_name
            const startupNameMap = startupsData.reduce((acc, startup) => {
              acc[startup.id] = startup.company_name
              return acc
            }, {})

            // Process meetings with startup names
            processedMeetings = upcomingMeetingsData.map((meeting) => {
              const matchId = meeting.match_id
              const startupId = matchToStartupMap[matchId]
              const startupName = startupNameMap[startupId] || "Startup"

              return {
                id: meeting.id,
                startup: startupName,
                date: meeting.scheduled_at,
                status: meeting.status,
              }
            })
          }
        }
      }
    }
  }

  // If we couldn't get startup names, just return basic meeting info
  if (processedMeetings.length === 0 && upcomingMeetingsData) {
    processedMeetings = upcomingMeetingsData.map((meeting) => ({
      id: meeting.id,
      startup: "Startup", // Default name if we couldn't get the actual name
      date: meeting.scheduled_at,
      status: meeting.status,
    }))
  }

  if (totalMatchesError || interestedError || meetingsError || upcomingMeetingsFetchError) {
    console.error("API Investor Dashboard - Error fetching stats:", {
      totalMatchesError,
      interestedError,
      meetingsError,
      upcomingMeetingsFetchError,
    })
  }

  // Get wishlist count using service role
  const { count: wishlistCount, error: wishlistError } = await serviceSupabase
    .from("investor_wishlist")
    .select("*", { count: "exact", head: true })
    .eq("investor_id", investor.id)

  const dashboardData = {
    investorData: investor,
    stats: {
      profileViews: investor.views || 0,
      totalMatches: totalMatches || 0,
      interestedStartups: interestedStartups || 0,
      meetingsScheduled: meetingsScheduled || 0,
      wishlistCount: wishlistCount || 0,
    },
    upcomingMeetings: processedMeetings,
    recentActivity: [],
  }

  return NextResponse.json(dashboardData)
}
