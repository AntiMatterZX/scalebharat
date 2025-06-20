import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug
  const supabase = createRouteHandlerClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  const userId = session.user.id

  // Get startup by slug
  const { data: startup, error: startupError } = await supabase
    .from("startups")
    .select("id, slug")
    .eq("slug", slug)
    .single()

  if (startupError || !startup) {
    return NextResponse.json({ error: "Startup not found" }, { status: 404 })
  }

  // Check if user has already upvoted this startup
  const { data: existingUpvote } = await supabase
    .from("startup_upvotes")
    .select("id")
    .eq("startup_id", startup.id)
    .eq("user_id", userId)
    .maybeSingle()

  if (existingUpvote) {
    // Remove upvote
    await supabase.from("startup_upvotes").delete().match({ startup_id: startup.id, user_id: userId })

    // Decrement upvote count
    await supabase.rpc("decrement_upvote_count", { startup_uuid: startup.id })
  } else {
    // Add upvote
    await supabase.from("startup_upvotes").insert({ startup_id: startup.id, user_id: userId })

    // Increment upvote count
    await supabase.rpc("increment_upvote_count", { startup_uuid: startup.id })
  }

  // Redirect back to the startup page
  return redirect(`/startups/${startup.slug}`)
}
