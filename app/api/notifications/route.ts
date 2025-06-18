import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      title,
      content,
      data = {},
      priority = 'medium',
      action_url,
      expires_at,
      send_email = false,
      email_template,
      email_data
    } = body

    // Create notification in database
    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        type,
        title,
        content,
        data,
        priority,
        action_url,
        expires_at
      })
      .select()
      .single()

    if (notificationError) {
      console.error("Error creating notification:", notificationError)
      return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
    }

    // Send email if requested
    if (send_email && email_template && email_data) {
      try {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            subject: title,
            template: email_template,
            data: email_data
          })
        })

        if (!emailResponse.ok) {
          console.warn("Failed to send email notification, but database notification was created")
        }
      } catch (error) {
        console.warn("Email send failed:", error)
      }
    }

    return NextResponse.json({ 
      notification,
      message: "Notification created successfully" 
    })

  } catch (error) {
    console.error("Error in notifications API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit')) || 50
    const unread_only = searchParams.get('unread_only') === 'true'

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .or("expires_at.is.null,expires_at.gte.now()")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (unread_only) {
      query = query.eq("is_read", false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error("Error fetching notifications:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    return NextResponse.json({ notifications })

  } catch (error) {
    console.error("Error in notifications API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notification_ids, is_read = true } = body

    if (!notification_ids || !Array.isArray(notification_ids)) {
      return NextResponse.json({ error: "notification_ids array is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read })
      .in("id", notification_ids)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error updating notifications:", error)
      return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `${notification_ids.length} notification(s) marked as ${is_read ? 'read' : 'unread'}` 
    })

  } catch (error) {
    console.error("Error in notifications API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 