import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const rawCookieStore = await cookies();
    const cookieStore = {
      get: (name: string) => rawCookieStore.get(name)?.value,
      set: undefined,
      remove: undefined,
    };
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

  // Fetch investor profile first (required for investor.id)
  const { data: investor, error: investorError } = await supabase
    .from("investors")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (investorError || !investor) {
    console.error("API Investor Dashboard - Investor profile not found or error:", investorError?.message)
    return NextResponse.json({ error: "Investor profile not found for the authenticated user." }, { status: 404 })
  }

  // Parallelize all stats and meetings queries
  const [
    totalMatchesRes,
    interestedStartupsRes,
    meetingsScheduledRes,
    upcomingMeetingsDataRes,
    wishlistCountRes
  ] = await Promise.all([
    serviceSupabase
    .from("matches")
    .select("*", { count: "exact", head: true })
      .eq("investor_id", investor.id),
    serviceSupabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("investor_id", investor.id)
      .eq("status", "interested"),
    serviceSupabase
    .from("meetings")
    .select("*", { count: "exact", head: true })
    .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
      .in("status", ["pending", "confirmed"]),
    serviceSupabase
    .from("meetings")
    .select("*, match_id")
    .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
    .gte("scheduled_at", new Date().toISOString())
    .in("status", ["pending", "confirmed"])
    .order("scheduled_at", { ascending: true })
      .limit(5),
    serviceSupabase
      .from("investor_wishlist")
      .select("*", { count: "exact", head: true })
      .eq("investor_id", investor.id)
  ])

  const totalMatches: number = totalMatchesRes.count || 0
  const interestedStartups: number = interestedStartupsRes.count || 0
  const meetingsScheduled: number = meetingsScheduledRes.count || 0
  const upcomingMeetingsData: any[] = upcomingMeetingsDataRes.data || []
  const wishlistCount: number = wishlistCountRes.count || 0

  // Process meetings to get startup names if needed (parallelize match/startup fetches)
  let processedMeetings: Array<{ id: string; startup: string; date: string; status: string }> = []
  if (upcomingMeetingsData && upcomingMeetingsData.length > 0) {
    const matchIds = upcomingMeetingsData.map((meeting: any) => meeting.match_id).filter(Boolean)
    if (matchIds.length > 0) {
      // Fetch matches first
      const matchesDataRes = await serviceSupabase
        .from("matches")
        .select("id, startup_id")
        .in("id", matchIds)
      const matchesData: Array<{ id: string; startup_id: string }> = matchesDataRes.data || []
      const matchToStartupMap: Record<string, string> = matchesData.reduce((acc, match) => {
          acc[match.id] = match.startup_id
          return acc
      }, {} as Record<string, string>)
      const startupIds: string[] = matchesData.map((match) => match.startup_id).filter(Boolean)
      let startupNameMap: Record<string, string> = {}
        if (startupIds.length > 0) {
        const startupsDataRes = await serviceSupabase
            .from("startups")
            .select("id, company_name")
            .in("id", startupIds)
        const startupsData: Array<{ id: string; company_name: string }> = startupsDataRes.data || []
        startupNameMap = startupsData.reduce((acc, startup) => {
              acc[startup.id] = startup.company_name
              return acc
        }, {} as Record<string, string>)
      }
      processedMeetings = upcomingMeetingsData.map((meeting: any) => {
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
  if (processedMeetings.length === 0 && upcomingMeetingsData) {
    processedMeetings = upcomingMeetingsData.map((meeting: any) => ({
      id: meeting.id,
      startup: "Startup",
      date: meeting.scheduled_at,
      status: meeting.status,
    }))
  }

  const dashboardData = {
    investorData: investor,
    stats: {
      profileViews: investor.views || 0,
      totalMatches,
      interestedStartups,
      meetingsScheduled,
      wishlistCount,
    },
    upcomingMeetings: processedMeetings,
    recentActivity: [],
  }

  return NextResponse.json(dashboardData)
}
