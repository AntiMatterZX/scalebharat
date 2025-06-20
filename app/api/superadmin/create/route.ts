import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { assignRole } from "@/lib/role-management"
import { logError } from "@/lib/error-handling"

export async function POST(request: NextRequest) {
  try {
    const { email, adminSecret } = await request.json()

    // Verify admin secret (this should be a strong, environment-based secret)
    const expectedSecret = process.env.ADMIN_SECRET || "super-secret-key-change-me"

    if (adminSecret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid admin secret" }, { status: 403 })
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Create service role Supabase client (has admin privileges)
    const supabase = createSupabaseServiceRoleClient()

    // Find user by email in auth.users table using service role
    const { data, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      logError(userError, { context: "superadmin-create", email })
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    const user = data.users.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json(
        {
          error: `User with email ${email} not found. Please make sure the user has registered first.`,
        },
        { status: 404 },
      )
    }

    // Assign superadmin role
    const success = await assignRole(user.id, "superadmin")

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Superadmin role assigned to ${email}`,
      })
    } else {
      return NextResponse.json({ error: "Failed to assign superadmin role" }, { status: 500 })
    }
  } catch (error) {
    logError(error as Error, { context: "superadmin-create" })
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
