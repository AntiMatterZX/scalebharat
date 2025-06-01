import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getUserRoles } from "@/lib/role-management"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Verify the user is authenticated and requesting their own roles
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow users to fetch their own roles unless they're an admin
    if (user.id !== userId) {
      // Check if the requesting user is an admin/superadmin
      const requestingUserRoles = await getUserRoles(user.id)
      if (!requestingUserRoles.includes("admin") && !requestingUserRoles.includes("superadmin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const roles = await getUserRoles(userId)
    return NextResponse.json({ roles })
  } catch (error) {
    console.error("Error fetching user roles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
