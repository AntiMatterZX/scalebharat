import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { logError } from "@/lib/error-handling"
import nodemailer from "nodemailer"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get pending edits with startup and user info
    const { data: pendingEdits, error, count } = await supabase
      .from("startup_pending_edits")
      .select(`
        *,
        startups!inner(
          id,
          company_name,
          slug,
          status as current_status
        ),
        users!inner(
          id,
          first_name,
          last_name,
          email
        ),
        startup_team_members_pending(*),
        startup_documents_pending(*)
      `, { count: 'exact' })
      .eq("status", status)
      .order("submitted_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      pending_edits: pendingEdits || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    logError(error as Error, { context: "admin-get-pending-edits" })
    return NextResponse.json({ error: "Failed to fetch pending edits" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient()
    const { pending_edit_id, action, admin_notes, reviewed_by } = await request.json()

    if (!pending_edit_id || !action || !reviewed_by) {
      return NextResponse.json({ 
        error: "Pending edit ID, action, and reviewer ID are required" 
      }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: "Action must be 'approve' or 'reject'" 
      }, { status: 400 })
    }

    // Get the pending edit with related data
    const { data: pendingEdit, error: fetchError } = await supabase
      .from("startup_pending_edits")
      .select(`
        *,
        startups!inner(
          id,
          company_name,
          slug,
          user_id
        ),
        users!inner(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("id", pending_edit_id)
      .eq("status", "pending")
      .single()

    if (fetchError || !pendingEdit) {
      return NextResponse.json({ 
        error: "Pending edit not found or already processed" 
      }, { status: 404 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // Update the pending edit status
    const { error: updateError } = await supabase
      .from("startup_pending_edits")
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by,
        admin_notes,
        rejection_reason: action === 'reject' ? admin_notes : null
      })
      .eq("id", pending_edit_id)

    if (updateError) {
      throw updateError
    }

    // If approved, apply the changes
    if (action === 'approve') {
      const { error: applyError } = await supabase.rpc('apply_pending_startup_edits', {
        pending_edit_id
      })

      if (applyError) {
        console.error('Failed to apply pending edits:', applyError)
        // Revert the status update
        await supabase
          .from("startup_pending_edits")
          .update({ status: 'pending', reviewed_at: null, reviewed_by: null })
          .eq("id", pending_edit_id)
        
        throw new Error('Failed to apply approved changes')
      }
    }

    // Send notification email to the startup owner
    try {
      const user = pendingEdit.users
      const startup = pendingEdit.startups
      
      if (user?.email) {
        const subject = action === 'approve' 
          ? "✅ Your startup profile changes have been approved!"
          : "📝 Your startup profile changes need revision"

        const emailContent = action === 'approve'
          ? `
            <h2>Great news!</h2>
            <p>Your recent changes to ${startup.company_name} have been approved and are now live.</p>
            <p>You can view your updated profile at: <a href="${process.env.NEXT_PUBLIC_APP_URL}/startups/${startup.slug}">View Profile</a></p>
            <p>Thank you for keeping your profile up to date!</p>
          `
          : `
            <h2>Profile Changes Need Revision</h2>
            <p>Your recent changes to ${startup.company_name} require some revisions before they can be approved.</p>
            <p><strong>Admin Notes:</strong> ${admin_notes || 'Please review and resubmit your changes.'}</p>
            <p>You can make the necessary changes and resubmit: <a href="${process.env.NEXT_PUBLIC_APP_URL}/startup/profile">Edit Profile</a></p>
          `

        // Create transporter for email
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number.parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_PORT === "465",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        })

        await transporter.sendMail({
          from: `"StartupConnect" <${process.env.EMAIL_FROM}>`,
          to: user.email,
          subject,
          html: emailContent
        })
      }
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Pending edits ${action}d successfully`,
      pending_edit: {
        ...pendingEdit,
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by,
        admin_notes
      }
    })
  } catch (error) {
    logError(error as Error, { context: "admin-review-pending-edits" })
    return NextResponse.json({ 
      error: `Failed to ${request.json().then(body => body.action)} pending edits` 
    }, { status: 500 })
  }
} 