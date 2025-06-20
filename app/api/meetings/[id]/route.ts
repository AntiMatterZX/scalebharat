import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const meetingId = params.id

    // Fetch the meeting with related data
    const { data: meeting, error } = await supabase
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
      .eq("id", meetingId)
      .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
      .single()

    if (error || !meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error("Meeting Get API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const meetingId = params.id
    const body = await request.json()

    // First check if the meeting exists and user has permission
    const { data: existingMeeting, error: fetchError } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
      .single()

    if (fetchError || !existingMeeting) {
      return NextResponse.json({ error: "Meeting not found or no permission" }, { status: 404 })
    }

    // Update the meeting
    const { data: meeting, error } = await supabase
      .from("meetings")
      .update({
        title: body.title,
        description: body.description,
        scheduled_at: body.scheduled_at,
        duration_minutes: body.duration_minutes,
        type: body.type,
        status: body.status,
        meeting_link: body.meeting_link,
        notes: body.notes,
      })
      .eq("id", meetingId)
      .select()
      .single()

    if (error) {
      console.error("Error updating meeting:", error)
      return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 })
    }

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error("Meeting Update API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const meetingId = params.id

    // First check if the meeting exists and user has permission
    const { data: existingMeeting, error: fetchError } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
      .single()

    if (fetchError || !existingMeeting) {
      return NextResponse.json({ error: "Meeting not found or no permission" }, { status: 404 })
    }

    // Delete the meeting
    const { error } = await supabase
      .from("meetings")
      .delete()
      .eq("id", meetingId)

    if (error) {
      console.error("Error deleting meeting:", error)
      return NextResponse.json({ error: "Failed to delete meeting" }, { status: 500 })
    }

    return NextResponse.json({ message: "Meeting deleted successfully" })
  } catch (error) {
    console.error("Meeting Delete API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
