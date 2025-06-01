import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createSupabaseServiceRoleClient()
    const slug = params.slug

    // Get the raw startup data by slug
    const { data: startup, error } = await supabase.from("startups").select("*").eq("slug", slug).single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!startup) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 })
    }

    return NextResponse.json({
      startup: {
        id: startup.id,
        slug: startup.slug,
        company_name: startup.company_name,
        status: startup.status,
        is_verified: startup.is_verified,
        created_at: startup.created_at,
        updated_at: startup.updated_at,
      },
      debug: {
        raw_status: startup.status,
        raw_is_verified: startup.is_verified,
        raw_slug: startup.slug,
        status_type: typeof startup.status,
        is_verified_type: typeof startup.is_verified,
        slug_type: typeof startup.slug,
      },
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
