import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendMeetingEmail } from "@/lib/email"
import moment from "moment"

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    const accessToken = authHeader?.replace("Bearer ", "")
    
    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !user) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    // Get meetings for the user - both matched and standalone meetings
    let query = supabase
      .from("meetings")
      .select(`
        *,
        matches(
          id,
          startups(company_name, logo, users(first_name, last_name)),
          investors(firm_name, users(first_name, last_name))
        ),
        organizer:organizer_id(first_name, last_name, profile_picture),
        attendee:attendee_id(first_name, last_name, profile_picture)
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
      meetings?.map((meeting) => {
        let attendeeName = "Unknown"
        
        if (meeting.matches) {
          // This is a matched meeting
          if (meeting.organizer_id === user.id) {
            // User is organizer, get attendee from match
            if (meeting.matches.startups && meeting.organizer_id !== meeting.matches.startups.users?.id) {
              attendeeName = meeting.matches.startups.company_name
            } else if (meeting.matches.investors) {
              attendeeName = meeting.matches.investors.firm_name || 
                           `${meeting.matches.investors.users?.first_name} ${meeting.matches.investors.users?.last_name}`
            }
          } else {
            // User is attendee, get organizer from match
            if (meeting.matches.startups) {
              attendeeName = meeting.matches.startups.company_name
            } else if (meeting.matches.investors) {
              attendeeName = meeting.matches.investors.firm_name || 
                           `${meeting.matches.investors.users?.first_name} ${meeting.matches.investors.users?.last_name}`
            }
          }
        } else if (meeting.attendee_id) {
          // This is a standalone meeting with a registered user
          if (meeting.organizer_id === user.id) {
            attendeeName = `${meeting.attendee?.first_name || ""} ${meeting.attendee?.last_name || ""}`.trim() || "External Contact"
          } else {
            attendeeName = `${meeting.organizer?.first_name || ""} ${meeting.organizer?.last_name || ""}`.trim() || "External Contact"
          }
        } else {
          // This is a standalone meeting with an external attendee
          // Extract attendee info from notes
          if (meeting.notes && meeting.notes.startsWith("External attendee:")) {
            const match = meeting.notes.match(/External attendee: (.+?) \((.+?)\)/)
            if (match) {
              attendeeName = match[1] || "External Contact"
            } else {
              attendeeName = "External Contact"
            }
          } else {
            attendeeName = "External Contact"
          }
        }

        return {
          id: meeting.id,
          title: meeting.title,
          start: meeting.scheduled_at,
          end: new Date(new Date(meeting.scheduled_at).getTime() + meeting.duration_minutes * 60000).toISOString(),
          description: meeting.description,
          type: meeting.type,
          status: meeting.status,
          isOrganizer: meeting.organizer_id === user.id,
          attendee: attendeeName,
          meetingLink: meeting.meeting_link,
          notes: meeting.notes,
          matchId: meeting.match_id,
        }
      }) || []

    return NextResponse.json({ meetings: calendarEvents })
  } catch (error) {
    console.error("Meetings API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    const accessToken = authHeader?.replace("Bearer ", "")
    
    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !user) {
      console.log("User validation failed:", userError)
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 })
    }

    const body = await request.json()

    const {
      matchId,
      attendeeId,
      attendeeEmail,
      attendeeName,
      title,
      description,
      scheduledAt,
      durationMinutes = 30,
      type = "video",
      meetingLink,
      isStandalone = false
    } = body

    // Validate meeting requirements
    if (!isStandalone && !matchId) {
      return NextResponse.json({ error: "Match ID is required for matched meetings" }, { status: 400 })
    }

    if (isStandalone && !attendeeEmail && !attendeeId) {
      return NextResponse.json({ error: "Attendee email or ID is required for standalone meetings" }, { status: 400 })
    }

    // For matched meetings, validate that a match exists and both parties are interested
    if (!isStandalone && matchId) {
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select(`
          *,
          startups(user_id),
          investors(user_id)
        `)
        .eq("id", matchId)
        .single()

      if (matchError || !match) {
        return NextResponse.json({ error: "Invalid match" }, { status: 400 })
      }

      // Check if user is part of this match
      const userStartup = match.startups?.user_id === user.id
      const userInvestor = match.investors?.user_id === user.id

      if (!userStartup && !userInvestor) {
        return NextResponse.json({ error: "Unauthorized to schedule meeting for this match" }, { status: 403 })
      }

      // Check if both parties are interested (or at least one is interested and the other is pending)
      const canScheduleMeeting = 
        (match.startup_status === "interested" && match.investor_status !== "not_interested") ||
        (match.investor_status === "interested" && match.startup_status !== "not_interested") ||
        (match.status === "interested" || match.status === "meeting_scheduled")

      if (!canScheduleMeeting) {
        return NextResponse.json({ 
          error: "Both parties must be interested before scheduling a meeting" 
        }, { status: 400 })
      }

      // Determine attendee ID from match
      const finalAttendeeId = userStartup ? match.investors.user_id : match.startups.user_id

      // Create meeting
      const { data: meeting, error } = await supabase
        .from("meetings")
        .insert({
          match_id: matchId,
          organizer_id: user.id,
          attendee_id: finalAttendeeId,
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
        console.error("Error creating matched meeting:", error)
        return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 })
      }

      // Update match status to meeting_scheduled
      await supabase
        .from("matches")
        .update({ status: "meeting_scheduled" })
        .eq("id", matchId)

      // Send meeting notification emails
      try {
        // Get organizer and attendee details
        const { data: organizerData } = await supabase
          .from("users")
          .select("email, first_name, last_name")
          .eq("id", user.id)
          .single()

        const { data: attendeeData } = await supabase
          .from("users")
          .select("email, first_name, last_name")
          .eq("id", finalAttendeeId)
          .single()

        if (organizerData && attendeeData) {
          const meetingDate = moment(scheduledAt).format("MMMM DD, YYYY")
          const meetingTime = moment(scheduledAt).format("h:mm A")
          const organizerName = `${organizerData.first_name} ${organizerData.last_name}`
          const attendeeName = `${attendeeData.first_name} ${attendeeData.last_name}`

          const meetingDetails = {
            title,
            organizerName,
            attendeeName,
            date: meetingDate,
            time: meetingTime,
            duration: durationMinutes,
            type,
            description,
            meetingLink,
          }

          // Send confirmation email to organizer
          await sendMeetingEmail(
            organizerData.email,
            organizerName,
            meetingDetails,
            true
          )

          // Send invitation email to attendee
          await sendMeetingEmail(
            attendeeData.email,
            attendeeName,
            meetingDetails,
            false
          )
        }
      } catch (emailError) {
        console.error("Failed to send email notifications:", emailError)
        // Don't fail the meeting creation if email fails
      }

      return NextResponse.json({ meeting })

    } else {
      // Create standalone meeting with external attendee
      
      let finalAttendeeId = null
      let meetingNotes = ""
      let attendeeEmail = ""
      let attendeeName = ""

      // If attendeeId is provided, it means it's a registered user
      if (attendeeId) {
        // Validate that attendee is not the same as organizer
        if (attendeeId === user.id) {
          return NextResponse.json({ error: "Cannot schedule a meeting with yourself" }, { status: 400 })
        }

        // Verify attendee exists and is a valid user
        const { data: attendeeUser, error: attendeeError } = await supabase
          .from("users")
          .select("id, email, first_name, last_name")
          .eq("id", attendeeId)
          .single()

        if (attendeeError || !attendeeUser) {
          return NextResponse.json({ error: "Invalid attendee" }, { status: 400 })
        }

        finalAttendeeId = attendeeId
        attendeeEmail = attendeeUser.email
        attendeeName = `${attendeeUser.first_name} ${attendeeUser.last_name}`
      } else {
        // External attendee - store their info in notes
        attendeeEmail = attendeeEmail || "External Contact"
        attendeeName = attendeeName || body.attendeeName || "External Contact"
        meetingNotes = `External attendee: ${attendeeName} (${body.attendeeEmail})`
      }

      const { data: meeting, error } = await supabase
        .from("meetings")
        .insert({
          match_id: null, // Standalone meeting
          organizer_id: user.id,
          attendee_id: finalAttendeeId, // null for external attendees
          title,
          description,
          scheduled_at: scheduledAt,
          duration_minutes: durationMinutes,
          type,
          status: "pending",
          meeting_link: meetingLink,
          notes: meetingNotes,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating standalone meeting:", error)
        
        // Check for constraint violation (self-meeting)
        if (error.code === '23514' && error.message.includes('valid_organizer_attendee')) {
          return NextResponse.json({ error: "Cannot schedule a meeting with yourself" }, { status: 400 })
        }
        
        return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 })
      }

      // Send meeting notification emails for standalone meetings
      try {
        // Get organizer details
        const { data: organizerData } = await supabase
          .from("users")
          .select("email, first_name, last_name")
          .eq("id", user.id)
          .single()

        if (organizerData) {
          const meetingDate = moment(scheduledAt).format("MMMM DD, YYYY")
          const meetingTime = moment(scheduledAt).format("h:mm A")
          const organizerName = `${organizerData.first_name} ${organizerData.last_name}`

          const meetingDetails = {
            title,
            organizerName,
            attendeeName,
            date: meetingDate,
            time: meetingTime,
            duration: durationMinutes,
            type,
            description,
            meetingLink,
          }

          // Send confirmation email to organizer
          await sendMeetingEmail(
            organizerData.email,
            organizerName,
            meetingDetails,
            true
          )

          // Send invitation email to attendee (only if they have an email and are registered)
          if (finalAttendeeId && attendeeEmail) {
            await sendMeetingEmail(
              attendeeEmail,
              attendeeName,
              meetingDetails,
              false
            )
          }
        }
      } catch (emailError) {
        console.error("Failed to send email notifications:", emailError)
        // Don't fail the meeting creation if email fails
      }

      return NextResponse.json({ meeting })
    }
  } catch (error) {
    console.error("Create Meeting API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
