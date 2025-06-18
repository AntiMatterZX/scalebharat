import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Try to check if user has admin role (but don't fail if this doesn't work)
    let isAdmin = false
    try {
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "superadmin"])
        .maybeSingle()

      if (!roleError && userRole?.role) {
        isAdmin = true
      }
      // Don't log errors for user_roles - many users won't have entries
    } catch (error) {
      // Silently ignore user_roles errors - this is expected for most users
    }

    if (isAdmin) {
      return NextResponse.json({
        type: "admin",
        status: "active",
        isComplete: true,
      })
    }

    // Check if user has a startup profile
    const { data: startup, error: startupError } = await supabase
      .from("startups")
      .select("id, status, company_name, description")
      .eq("user_id", user.id)
      .maybeSingle()

    if (startupError && startupError.code !== 'PGRST116') {
      console.error("Error fetching startup profile:", startupError)
    }

    // Check if user has an investor profile
    const { data: investor, error: investorError } = await supabase
      .from("investors")
      .select("id, status, firm_name, description")
      .eq("user_id", user.id)
      .maybeSingle()

    if (investorError && investorError.code !== 'PGRST116') {
      console.error("Error fetching investor profile:", investorError)
    }

    if (startup) {
      // Check if startup profile is complete
      const isComplete = Boolean(startup.company_name && startup.description)

      return NextResponse.json({
        type: "startup",
        status: startup.status,
        startupId: startup.id,
        isComplete,
      })
    } else if (investor) {
      // Check if investor profile is complete
      const isComplete = Boolean(investor.firm_name && investor.description)

      return NextResponse.json({
        type: "investor",
        status: investor.status,
        investorId: investor.id,
        isComplete,
      })
    } else {
      return NextResponse.json({
        type: null,
        status: null,
        isComplete: false,
      })
    }
  } catch (error: any) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: error.message || 'Failed to fetch user profile' }, { status: 500 })
  }
} 