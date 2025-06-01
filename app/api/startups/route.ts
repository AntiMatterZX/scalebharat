import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { generateSlug, ensureUniqueSlug } from "@/lib/slug-utils"

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const data = await request.json()

    // Generate a clean slug from company name
    const baseSlug = generateSlug(data.company_name)

    // Ensure the slug is unique
    const slug = await ensureUniqueSlug(baseSlug, async (testSlug) => {
      const { data: existingStartup } = await supabase.from("startups").select("id").eq("slug", testSlug).maybeSingle()
      return !!existingStartup
    })

    // Add the slug to the data
    const startupData = {
      ...data,
      slug,
    }

    const { data: startup, error } = await supabase.from("startups").insert(startupData).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(startup)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
