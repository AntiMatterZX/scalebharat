import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createSupabaseServerClient(cookieStore)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("API Match Status - Auth error:", authError?.message)
      return NextResponse.json({ error: "Unauthorized: " + (authError?.message || "No user session") }, { status: 401 })
    }

    const { status, notes } = await request.json()
    const matchId = params.id

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const validStatuses = ["pending", "interested", "not-interested", "meeting-scheduled", "deal-closed"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Optional: Add verification that the user is part of this match
    const { data: matchData, error: matchFetchError } = await supabase
      .from("matches")
      .select("startup_id, investor_id, startups(user_id), investors(user_id)")
      .eq("id", matchId)
      .single()

    if (matchFetchError || !matchData) {
      console.error("API Match Status - Match not found or error:", matchFetchError?.message)
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    const startupUserId = matchData.startups?.user_id
    const investorUserId = matchData.investors?.user_id

    if (user.id !== startupUserId && user.id !== investorUserId) {
      console.error("API Match Status - User not part of match")
      return NextResponse.json({ error: "Forbidden: You are not part of this match" }, { status: 403 })
    }

    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update({
        status,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId)
      .select()
      .single()

    if (updateError) {
      console.error("API Match Status - Update error:", updateError.message)
      return NextResponse.json({ error: "Failed to update match: " + updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, match: updatedMatch })
  } catch (error: any) {
    console.error("API Match Status - Catch error:", error.message)
    return NextResponse.json({ error: "Failed to update match status: " + error.message }, { status: 500 })
  }
}
