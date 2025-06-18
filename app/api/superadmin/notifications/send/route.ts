import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is superadmin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (!userRole || userRole.role !== 'superadmin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      recipientType,
      type,
      title,
      content,
      priority = 'medium',
      action_url,
      send_email = false
    } = body

    // Get target users based on recipient type
    let targetUsers: any[] = []
    
    if (recipientType === 'all') {
      const { data } = await supabase
        .from("users")
        .select("id, email, first_name, user_type")
    
      targetUsers = data || []
    } else if (recipientType === 'startups') {
      const { data } = await supabase
        .from("users")
        .select("id, email, first_name, user_type")
        .eq("user_type", "startup")
    
      targetUsers = data || []
    } else if (recipientType === 'investors') {
      const { data } = await supabase
        .from("users")
        .select("id, email, first_name, user_type")
        .eq("user_type", "investor")
    
      targetUsers = data || []
    } else if (recipientType === 'admins') {
      const { data } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          users (
            id,
            email,
            first_name,
            user_type
          )
        `)
        .in("role", ["admin", "superadmin"])
    
      targetUsers = data?.map(item => item.users).filter(Boolean) || []
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: "No users found for the selected recipient type" }, { status: 400 })
    }

    // Create notifications for each user
    const notifications = targetUsers.map(targetUser => ({
      user_id: targetUser.id,
      type,
      title,
      content,
      priority,
      action_url: action_url || null,
      data: {
        sent_by: user.id,
        recipient_type: recipientType,
        manual_send: true
      }
    }))

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications)

    if (insertError) {
      console.error("Error creating notifications:", insertError)
      return NextResponse.json({ error: "Failed to create notifications" }, { status: 500 })
    }

    // Send emails if requested
    let emailsSent = 0
    if (send_email) {
      for (const targetUser of targetUsers) {
        try {
          const emailSent = await sendEmail(
            targetUser.email,
            title,
            'system',
            {
              name: targetUser.first_name,
              content: content,
              action_url: action_url,
              priority: priority
            }
          )
          
          if (emailSent) emailsSent++
        } catch (error) {
          console.error(`Failed to send email to ${targetUser.email}:`, error)
        }
      }
    }

    return NextResponse.json({ 
      message: "Notifications sent successfully",
      recipients_count: targetUsers.length,
      emails_sent: emailsSent
    })

  } catch (error) {
    console.error("Error in notifications send API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 