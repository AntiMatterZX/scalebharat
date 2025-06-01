import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const meetingId = params.id

    // Verify user has permission to update this meeting
    const { data: existingMeeting, error: fetchError } = await serviceSupabase
      .from("meetings")
      .select("organizer_id, attendee_id")
      .eq("id", meetingId)
      .single()

    if (fetchError || !existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    if (existingMeeting.organizer_id !== user.id && existingMeeting.attendee_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update meeting
    const { data: meeting, error } = await serviceSupabase
      .from("meetings")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
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
    console.error("Update Meeting API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    const meetingId = params.id

    // Verify user has permission to delete this meeting
    const { data: existingMeeting, error: fetchError } = await serviceSupabase
      .from("meetings")
      .select("organizer_id, attendee_id")
      .eq("id", meetingId)
      .single()

    if (fetchError || !existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    if (existingMeeting.organizer_id !== user.id && existingMeeting.attendee_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete meeting
    const { error } = await serviceSupabase.from("meetings").delete().eq("id", meetingId)

    if (error) {
      console.error("Error deleting meeting:", error)
      return NextResponse.json({ error: "Failed to delete meeting" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete Meeting API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
