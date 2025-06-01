import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const serviceSupabase = createSupabaseServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    // Get meetings for the user
    let query = serviceSupabase
      .from("meetings")
      .select(`
        *,
        matches!inner(
          id,
          startups!inner(company_name, logo),
          investors!inner(firm_name, users!inner(first_name, last_name))
        )
      `)
      .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)

    if (start) {
      query = query.gte("scheduled_at", start)
    }
    if (end) {
      query = query.lte("scheduled_at", end)
    }

    const { data: meetings, error } = await query.order("scheduled_at", { ascending: true })

    if (error) {
      console.error("Error fetching meetings:", error)
      return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 })
    }

    // Transform meetings for calendar display
    const calendarEvents =
      meetings?.map((meeting) => ({
        id: meeting.id,
        title: meeting.title,
        start: meeting.scheduled_at,
        end: new Date(new Date(meeting.scheduled_at).getTime() + meeting.duration_minutes * 60000).toISOString(),
        description: meeting.description,
        type: meeting.type,
        status: meeting.status,
        isOrganizer: meeting.organizer_id === user.id,
        attendee:
          meeting.organizer_id === user.id
            ? meeting.matches.investors.users.first_name + " " + meeting.matches.investors.users.last_name
            : meeting.matches.startups.company_name,
        meetingLink: meeting.meeting_link,
        notes: meeting.notes,
      })) || []

    return NextResponse.json({ meetings: calendarEvents })
  } catch (error) {
    console.error("Meetings API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const serviceSupabase = createSupabaseServiceRoleClient()
    const body = await request.json()

    const {
      matchId,
      attendeeId,
      title,
      description,
      scheduledAt,
      durationMinutes = 30,
      type = "video",
      meetingLink,
    } = body

    // Create meeting
    const { data: meeting, error } = await serviceSupabase
      .from("meetings")
      .insert({
        match_id: matchId,
        organizer_id: user.id,
        attendee_id: attendeeId,
        title,
        description,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        type,
        status: "pending",
        meeting_link: meetingLink,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating meeting:", error)
      return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 })
    }

    // TODO: Send email notifications
    // await sendMeetingNotification(meeting)

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error("Create Meeting API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
