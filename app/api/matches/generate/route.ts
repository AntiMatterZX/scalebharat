import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { generateMatches } from "@/lib/matching-engine"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    const serviceSupabase = createSupabaseServiceRoleClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      // Try Bearer token authentication
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7)
        const {
          data: { user: tokenUser },
          error: tokenError,
        } = await supabase.auth.getUser(token)

        if (tokenError || !tokenUser) {
          console.error("Token auth failed:", tokenError?.message)
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Use tokenUser for the rest of the function
        const matches = await generateMatches(serviceSupabase, tokenUser.id, "startup")
        return NextResponse.json({
          success: true,
          matches,
          message: `Generated ${matches.length} new matches`,
        })
      }

      console.error("Auth failed:", authError?.message)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Determine user type based on their profile
    let userType = "startup" // Default to startup

    // Check if user has an investor profile
    const { data: investorProfile } = await supabase.from("investors").select("id").eq("user_id", user.id).maybeSingle()

    if (investorProfile) {
      userType = "investor"
    }

    console.log(`Generating matches for ${userType} user: ${user.id}`)

    // Use service role for match generation to avoid RLS issues
    const matches = await generateMatches(serviceSupabase, user.id, userType)

    return NextResponse.json({
      success: true,
      matches,
      message: `Generated ${matches.length} new matches`,
    })
  } catch (error: any) {
    console.error("Match generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate matches",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
