import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { logError } from "@/lib/error-handling"
import { sendEmail } from "@/lib/email/smtp"
import { profileChangesSubmittedTemplate } from "@/lib/email/templates/profile-changes-submitted"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const startupId = searchParams.get('startup_id')

    if (!startupId) {
      return NextResponse.json({ error: "Startup ID is required" }, { status: 400 })
    }

    // Get pending edits with related data
    const { data: pendingEdit, error } = await supabase
      .from("startup_pending_edits")
      .select(`
        *,
        startup_team_members_pending(*),
        startup_documents_pending(*)
      `)
      .eq("startup_id", startupId)
      .eq("status", "pending")
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      pending_edit: pendingEdit || null,
      has_pending_edits: !!pendingEdit
    })
  } catch (error) {
    logError(error as Error, { context: "get-pending-edits" })
    return NextResponse.json({ error: "Failed to fetch pending edits" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient()
    const body = await request.json()
    const { 
      startup_id, 
      user_id, 
      profile_data, 
      team_members, 
      documents, 
      changes_summary 
    } = body

    if (!startup_id || !user_id) {
      return NextResponse.json({ error: "Startup ID and User ID are required" }, { status: 400 })
    }

    // Check if there's already a pending edit
    const { data: existingEdit } = await supabase
      .from("startup_pending_edits")
      .select("id")
      .eq("startup_id", startup_id)
      .eq("status", "pending")
      .single()

    if (existingEdit) {
      return NextResponse.json({ 
        error: "There is already a pending edit for this startup. Please wait for it to be reviewed." 
      }, { status: 409 })
    }

    // Create the pending edit
    const { data: pendingEdit, error: createError } = await supabase
      .from("startup_pending_edits")
      .insert({
        startup_id,
        user_id,
        changes_summary,
        status: 'pending',
        ...profile_data // Spread the profile data fields
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    // Insert pending team members if provided
    if (team_members && team_members.length > 0) {
      const teamMemberInserts = team_members.map((member: any) => ({
        pending_edit_id: pendingEdit.id,
        startup_id,
        original_member_id: member.original_member_id || null,
        name: member.name,
        role: member.role,
        bio: member.bio,
        linkedin_url: member.linkedin_url,
        profile_picture_url: member.profile_picture_url,
        action: member.action || 'create'
      }))

      const { error: teamError } = await supabase
        .from("startup_team_members_pending")
        .insert(teamMemberInserts)

      if (teamError) {
        // Cleanup the pending edit if team member insertion fails
        await supabase.from("startup_pending_edits").delete().eq("id", pendingEdit.id)
        throw teamError
      }
    }

    // Insert pending documents if provided
    if (documents && documents.length > 0) {
      const documentInserts = documents.map((doc: any) => ({
        pending_edit_id: pendingEdit.id,
        startup_id,
        original_document_id: doc.original_document_id || null,
        document_type: doc.document_type,
        file_name: doc.file_name,
        file_url: doc.file_url,
        file_size: doc.file_size,
        is_public: doc.is_public || false,
        visibility: doc.visibility || 'private',
        action: doc.action || 'create'
      }))

      const { error: docError } = await supabase
        .from("startup_documents_pending")
        .insert(documentInserts)

      if (docError) {
        // Cleanup if document insertion fails
        await supabase.from("startup_pending_edits").delete().eq("id", pendingEdit.id)
        throw docError
      }
    }

    // Send confirmation email and create dashboard notification
    try {
      // Get user information
      const { data: user } = await supabase
        .from("users")
        .select("first_name, email")
        .eq("id", user_id)
        .single()

      // Get startup information
      const { data: startup } = await supabase
        .from("startups")
        .select("company_name")
        .eq("id", startup_id)
        .single()

      if (user?.email && startup?.company_name) {
        // Send confirmation email
        await sendEmail({
          to: user.email,
          subject: "Profile Changes Submitted for Review",
          template: (data: any) => profileChangesSubmittedTemplate(data),
          data: {
            firstName: user.first_name || "there",
            companyName: startup.company_name,
            changesSubmitted: changes_summary || "Profile updates submitted",
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/startup/dashboard`,
          },
        })

        // Create dashboard notification
        await supabase.rpc('create_notification', {
          p_user_id: user_id,
          p_type: 'profile_update',
          p_title: '📋 Profile Changes Submitted',
          p_content: `Your profile changes have been submitted for review and will be processed within 24-48 hours.`,
          p_data: {
            pending_edit_id: pendingEdit.id,
            startup_id: startup_id,
            company_name: startup.company_name,
            changes_summary: changes_summary
          },
          p_priority: 'medium',
          p_action_url: '/startup/dashboard',
          p_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
      }
    } catch (notificationError) {
      console.error("Failed to send confirmation notifications:", notificationError)
      // Don't fail the main request if notifications fail
    }

    return NextResponse.json({
      success: true,
      message: "Profile changes submitted for review",
      pending_edit: pendingEdit
    })
  } catch (error) {
    logError(error as Error, { context: "create-pending-edits" })
    return NextResponse.json({ error: "Failed to submit changes for review" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const pendingEditId = searchParams.get('pending_edit_id')

    if (!pendingEditId) {
      return NextResponse.json({ error: "Pending edit ID is required" }, { status: 400 })
    }

    // Delete the pending edit (cascade will handle related records)
    const { error } = await supabase
      .from("startup_pending_edits")
      .delete()
      .eq("id", pendingEditId)
      .eq("status", "pending") // Only allow deletion of pending edits

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Pending edits cancelled successfully"
    })
  } catch (error) {
    logError(error as Error, { context: "delete-pending-edits" })
    return NextResponse.json({ error: "Failed to cancel pending edits" }, { status: 500 })
  }
} 