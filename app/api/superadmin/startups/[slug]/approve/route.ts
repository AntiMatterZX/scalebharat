import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { logError } from "@/lib/error-handling"
import { sendEmail } from "@/lib/email"
import { startupApprovedTemplate } from "@/lib/email/templates/startup-approved"
import { startupRejectedTemplate } from "@/lib/email/templates/startup-rejected"
import { generateSlug, ensureUniqueSlug } from "@/lib/slug-utils"

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createSupabaseServiceRoleClient()
    const { action, reason } = await request.json()
    const slug = params.slug

    if (!["approve", "reject", "suspend"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get startup details by slug
    const { data: startup, error: fetchError } = await supabase
      .from("startups")
      .select(`
        *,
        users (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("slug", slug)
      .single()

    if (fetchError || !startup) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 })
    }

    // Update startup status
    let newStatus: string
    let isVerified = false

    switch (action) {
      case "approve":
        newStatus = "published"
        isVerified = true
        break
      case "reject":
        newStatus = "draft"
        isVerified = false
        break
      case "suspend":
        newStatus = "suspended"
        isVerified = false
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Generate slug if approving and slug is missing
    let newSlug = startup.slug
    if (action === "approve" && (!newSlug || newSlug.trim() === "")) {
      // Generate a base slug from company name
      const baseSlug = generateSlug(startup.company_name)

      // Ensure the slug is unique
      newSlug = await ensureUniqueSlug(baseSlug, async (testSlug) => {
        const { data } = await supabase.from("startups").select("id").eq("slug", testSlug).maybeSingle()
        return !!data
      })
    }

    console.log(`Updating startup ${startup.id} to status: ${newStatus}, verified: ${isVerified}, slug: ${newSlug}`)

    const { data: updatedStartup, error: updateError } = await supabase
      .from("startups")
      .update({
        status: newStatus,
        is_verified: isVerified,
        slug: newSlug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", startup.id)
      .select()
      .single()

    if (updateError) {
      console.error("Update error:", updateError)
      throw updateError
    }

    console.log("Updated startup:", updatedStartup)

    // Log the action
    await supabase.from("admin_actions").insert({
      admin_id: "system",
      action: `startup_${action}`,
      target_type: "startup",
      target_id: startup.id,
      reason: reason || null,
      metadata: {
        startup_name: startup.company_name,
        previous_status: startup.status,
      },
    })

    // Send notification email
    try {
      const user = startup.users
      if (user?.email) {
        if (action === "approve") {
          await sendEmail({
            to: user.email,
            subject: "🎉 Your startup has been approved!",
            html: startupApprovedTemplate({
              firstName: user.first_name,
              companyName: startup.company_name,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/startup/dashboard`,
              profileUrl: `${process.env.NEXT_PUBLIC_APP_URL}/startups/${newSlug}`,
            }),
          })
        } else if (action === "reject") {
          await sendEmail({
            to: user.email,
            subject: "Update on your startup submission",
            html: startupRejectedTemplate({
              firstName: user.first_name,
              companyName: startup.company_name,
              reason: reason || "Please review and resubmit your application.",
              resubmitUrl: `${process.env.NEXT_PUBLIC_APP_URL}/startup/profile`,
            }),
          })
        }
      }
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: `Startup ${action}d successfully`,
      startup: {
        ...startup,
        status: newStatus,
        is_verified: isVerified,
        slug: newSlug,
      },
    })
  } catch (error) {
    logError(error as Error, { context: "superadmin-startup-approval" })
    return NextResponse.json({ error: "Failed to process startup approval" }, { status: 500 })
  }
}
