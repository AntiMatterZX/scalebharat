import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { logError } from "@/lib/error-handling"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let query = supabase
      .from("startups")
      .select(`
        *,
        users!inner (
          id,
          first_name,
          last_name,
          email,
          profile_picture
        )
      `)
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: startups, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from("startups")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.warn("Count error:", countError)
    }

    return NextResponse.json({
      startups: startups || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    })
  } catch (error) {
    logError(error as Error, { context: "superadmin-get-startups" })
    return NextResponse.json(
      {
        error: "Failed to fetch startups",
        startups: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      },
      { status: 500 },
    )
  }
}
