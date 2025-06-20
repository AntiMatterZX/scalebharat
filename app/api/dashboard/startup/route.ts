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
          console.error("API Startup Dashboard - Token auth error:", tokenError?.message)
          return NextResponse.json(
            { error: "Unauthorized: Invalid token - " + (tokenError?.message || "No user found") },
            { status: 401 },
          )
        }

        // Use the token user
        const authenticatedUser = tokenUser
        return await fetchStartupDashboardData(supabase, authenticatedUser)
      }

      console.error("API Startup Dashboard - Auth error:", authError?.message)
      return NextResponse.json({ error: "Unauthorized: " + (authError?.message || "No user session") }, { status: 401 })
    }

    return await fetchStartupDashboardData(supabase, user)
  } catch (error: any) {
    console.error("API Startup Dashboard - Catch error:", error.message)
    return NextResponse.json({ error: "Failed to load startup dashboard data: " + error.message }, { status: 500 })
  }
}

async function fetchStartupDashboardData(supabase: any, user: any) {
  // Use service role client for some operations to bypass RLS issues
  const serviceSupabase = createSupabaseServiceRoleClient()

  const { data: startup, error: startupError } = await supabase
    .from("startups")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (startupError || !startup) {
    console.error("API Startup Dashboard - Startup profile not found or error:", startupError?.message)
    return NextResponse.json({ error: "Startup profile not found for the authenticated user." }, { status: 404 })
  }

  // Fetch match stats using service role to avoid RLS issues
  const { count: totalMatches, error: totalMatchesError } = await serviceSupabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("startup_id", startup.id)

  const { count: interestedInvestors, error: interestedError } = await serviceSupabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("startup_id", startup.id)
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

  // Process meetings to get investor names if needed
  let processedMeetings = []
  if (upcomingMeetingsData && upcomingMeetingsData.length > 0) {
    // Get match IDs from meetings
    const matchIds = upcomingMeetingsData.map((meeting) => meeting.match_id).filter(Boolean)

    // Get investor information for these matches using service role
    if (matchIds.length > 0) {
      const { data: matchesData, error: matchesError } = await serviceSupabase
        .from("matches")
        .select("id, investor_id")
        .in("id", matchIds)

      if (!matchesError && matchesData) {
        // Create a map of match_id to investor_id
        const matchToInvestorMap = matchesData.reduce((acc, match) => {
          acc[match.id] = match.investor_id
          return acc
        }, {})

        // Get investor names
        const investorIds = matchesData.map((match) => match.investor_id).filter(Boolean)
        if (investorIds.length > 0) {
          const { data: investorsData, error: investorsError } = await serviceSupabase
            .from("investors")
            .select("id, user_id")
            .in("id", investorIds)

          if (!investorsError && investorsData) {
            // Create a map of investor_id to user_id
            const investorToUserMap = investorsData.reduce((acc, investor) => {
              acc[investor.id] = investor.user_id
              return acc
            }, {})

            // Get user names
            const userIds = investorsData.map((investor) => investor.user_id).filter(Boolean)
            if (userIds.length > 0) {
              const { data: usersData, error: usersError } = await serviceSupabase
                .from("users")
                .select("id, first_name, last_name")
                .in("id", userIds)

              if (!usersError && usersData) {
                // Create a map of user_id to full_name
                const userNameMap = usersData.reduce((acc, user) => {
                  acc[user.id] = `${user.first_name} ${user.last_name}`.trim()
                  return acc
                }, {})

                // Process meetings with investor names
                processedMeetings = upcomingMeetingsData.map((meeting) => {
                  const matchId = meeting.match_id
                  const investorId = matchToInvestorMap[matchId]
                  const userId = investorToUserMap[investorId]
                  const investorName = userNameMap[userId] || "Investor"

                  return {
                    id: meeting.id,
                    investor: investorName,
                    date: meeting.scheduled_at,
                    status: meeting.status,
                  }
                })
              }
            }
          }
        }
      }
    }
  }

  // If we couldn't get investor names, just return basic meeting info
  if (processedMeetings.length === 0 && upcomingMeetingsData) {
    processedMeetings = upcomingMeetingsData.map((meeting) => ({
      id: meeting.id,
      investor: "Investor", // Default name if we couldn't get the actual name
      date: meeting.scheduled_at,
      status: meeting.status,
    }))
  }

  if (totalMatchesError || interestedError || meetingsError || upcomingMeetingsFetchError) {
    console.error("API Startup Dashboard - Error fetching stats:", {
      totalMatchesError,
      interestedError,
      meetingsError,
      upcomingMeetingsFetchError,
    })
  }

  const dashboardData = {
    startupData: startup,
    stats: {
      profileViews: startup.views || 0,
      totalMatches: totalMatches || 0,
      interestedInvestors: interestedInvestors || 0,
      meetingsScheduled: meetingsScheduled || 0,
    },
    fundingStats: {
      goal: startup.target_amount || 0,
      raised: startup.total_raised || 0,
      percentage: startup.target_amount ? ((startup.total_raised || 0) / startup.target_amount) * 100 : 0,
    },
    upcomingMeetings: processedMeetings,
    recentActivity: [],
  }

  return NextResponse.json(dashboardData)
}
