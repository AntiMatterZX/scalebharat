import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { generateInvestorSlug, ensureUniqueSlug } from "@/lib/slug-utils"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient()
    const body = await request.json()

    // Generate slug from firm name or personal name
    const baseSlug = generateInvestorSlug(body.firm_name, body.first_name, body.last_name)

    // Ensure slug is unique
    const slug = await ensureUniqueSlug(baseSlug, async (testSlug) => {
      const { data } = await supabase.from("investors").select("id").eq("slug", testSlug).maybeSingle()
      return !!data
    })

    // Create investor with slug
    const { data, error } = await supabase
      .from("investors")
      .insert({
        ...body,
        slug,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error creating investor:", error)
    return NextResponse.json({ error: error.message || "Failed to create investor" }, { status: 500 })
  }
}
