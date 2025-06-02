import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient, createRouteHandlerClient } from "@/lib/supabase/server"
import { generateInvestorSlug, ensureUniqueSlug } from "@/lib/slug-utils"
import { cookies } from 'next/headers'

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

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(cookies())
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const { data, error } = await supabase
      .from('investors')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch investor profile' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(cookies())
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const body = await request.json()
    // Optionally regenerate slug if firm_name or name changes
    let updateData = { ...body }
    if (body.firm_name || body.first_name || body.last_name) {
      const baseSlug = generateInvestorSlug(body.firm_name, body.first_name, body.last_name)
      const slug = await ensureUniqueSlug(baseSlug, async (testSlug) => {
        const { data } = await supabase.from('investors').select('id').eq('slug', testSlug).maybeSingle()
        return !!data
      })
      updateData.slug = slug
    }
    const { data, error } = await supabase
      .from('investors')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update investor profile' }, { status: 500 })
  }
}
