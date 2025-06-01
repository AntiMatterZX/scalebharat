import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateSlug, ensureUniqueSlug } from "@/lib/slug-utils"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const supabase = createSupabaseServiceRoleClient()

    // Get all startups
    const { data: startups, error } = await supabase.from("startups").select("id, company_name, slug")

    if (error) {
      throw error
    }

    const results = {
      total: startups?.length || 0,
      updated: 0,
      errors: 0,
      details: [] as any[],
    }

    // Process each startup
    for (const startup of startups || []) {
      try {
        // Generate a base slug from company name
        const baseSlug = generateSlug(startup.company_name)

        // Ensure the slug is unique
        const slug = await ensureUniqueSlug(baseSlug, async (testSlug) => {
          const { data } = await supabase
            .from("startups")
            .select("id")
            .eq("slug", testSlug)
            .not("id", "eq", startup.id)
            .maybeSingle()
          return !!data
        })

        // Update the startup with the new slug
        const { error: updateError } = await supabase.from("startups").update({ slug }).eq("id", startup.id)

        if (updateError) {
          throw updateError
        }

        results.updated++
        results.details.push({
          id: startup.id,
          company_name: startup.company_name,
          slug,
        })
      } catch (err: any) {
        results.errors++
        results.details.push({
          id: startup.id,
          company_name: startup.company_name,
          error: err.message,
        })
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error("Error generating slugs:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
