import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { logError } from "@/lib/error-handling"
import { sendEmail } from "@/lib/email"
import { startupApprovedTemplate } from "@/lib/email/templates/startup-approved"
import { startupRejectedTemplate } from "@/lib/email/templates/startup-rejected"
import { generateSlug, ensureUniqueSlug } from "@/lib/slug-utils"

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient()
    const { startupSlugs, action, reason } = await request.json()

    if (!["approve", "reject", "suspend"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (!startupSlugs || !Array.isArray(startupSlugs) || startupSlugs.length === 0) {
      return NextResponse.json({ error: "No startup slugs provided" }, { status: 400 })
    }

    // Get all startups by slugs
    const { data: startups, error: fetchError } = await supabase
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
      .in("slug", startupSlugs)

    if (fetchError || !startups) {
      return NextResponse.json({ error: "Failed to fetch startups" }, { status: 500 })
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

    const results = []

    for (const startup of startups) {
      try {
        // Generate slug if approving and slug is missing
        let newSlug = startup.slug
        if (action === "approve" && (!newSlug || newSlug.trim() === "")) {
          const baseSlug = generateSlug(startup.company_name)
          newSlug = await ensureUniqueSlug(baseSlug, async (testSlug) => {
            const { data } = await supabase.from("startups").select("id").eq("slug", testSlug).maybeSingle()
            return !!data
          })
        }

        // Update startup
        const { error: updateError } = await supabase
          .from("startups")
          .update({
            status: newStatus,
            is_verified: isVerified,
            slug: newSlug,
            updated_at: new Date().toISOString(),
          })
          .eq("id", startup.id)

        if (updateError) {
          console.error(`Error updating startup ${startup.id}:`, updateError)
          results.push({ startup: startup.company_name, success: false, error: updateError.message })
          continue
        }

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
            bulk_action: true,
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
          console.error(`Failed to send notification email for ${startup.company_name}:`, emailError)
        }

        results.push({ startup: startup.company_name, success: true })
      } catch (error) {
        console.error(`Error processing startup ${startup.id}:`, error)
        results.push({ startup: startup.company_name, success: false, error: (error as Error).message })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Bulk action completed: ${successCount} successful, ${failureCount} failed`,
      results,
    })
  } catch (error) {
    logError(error as Error, { context: "superadmin-bulk-startup-action" })
    return NextResponse.json({ error: "Failed to process bulk action" }, { status: 500 })
  }
}
