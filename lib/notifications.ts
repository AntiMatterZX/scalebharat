import { supabase } from "./supabase"
import { sendEmail } from "./email/smtp"
import { templates } from "./email/templates"

export interface EmailNotification {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

export async function sendNotification(notification: EmailNotification) {
  try {
    const { to, subject, template, data } = notification

    // Get the template function
    const templateFn = templates[template]
    if (!templateFn) {
      console.error(`Template "${template}" not found`)
      return false
    }

    // Send email using SMTP
    const result = await sendEmail({
      to,
      subject,
      template: templateFn,
      data,
    })

    return result
  } catch (error) {
    console.error("Error sending notification:", error)
    return false
  }
}

export async function notifyNewMatch(startupUserId: string, investorUserId: string, matchScore: number) {
  try {
    // Get user emails and details
    const { data: users } = await supabase
      .from("users")
      .select("id, email, first_name, user_type")
      .in("id", [startupUserId, investorUserId])

    if (!users || users.length !== 2) return

    // Get startup and investor profiles
    const startupUser = users.find((user) => user.user_type === "startup")
    const investorUser = users.find((user) => user.user_type === "investor")

    if (!startupUser || !investorUser) return

    // Get additional profile information
    const { data: startupProfile } = await supabase
      .from("startup_profiles")
      .select("company_name, short_description")
      .eq("user_id", startupUser.id)
      .single()

    const { data: investorProfile } = await supabase
      .from("investor_profiles")
      .select("firm_name, investment_focus")
      .eq("user_id", investorUser.id)
      .single()

    // Send notifications to both parties
    await Promise.all([
      sendNotification({
        to: startupUser.email,
        subject: "New Investor Match!",
        template: "new-match",
        data: {
          userName: startupUser.first_name,
          matchScore,
          type: "startup",
          matchName: investorProfile?.firm_name || "Investor",
          matchDescription: investorProfile?.investment_focus || "",
        },
      }),
      sendNotification({
        to: investorUser.email,
        subject: "New Startup Match!",
        template: "new-match",
        data: {
          userName: investorUser.first_name,
          matchScore,
          type: "investor",
          matchName: startupProfile?.company_name || "Startup",
          matchDescription: startupProfile?.short_description || "",
        },
      }),
    ])
  } catch (error) {
    console.error("Error sending match notifications:", error)
  }
}

export async function sendWelcomeEmail(userId: string) {
  try {
    // Get user details
    const { data: user } = await supabase.from("users").select("email, first_name, user_type").eq("id", userId).single()

    if (!user) return

    await sendNotification({
      to: user.email,
      subject: "Welcome to Startup Directory!",
      template: "welcome",
      data: {
        userName: user.first_name,
        userType: user.user_type,
      },
    })

    return true
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return false
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  try {
    // Get user details
    const { data: user } = await supabase.from("users").select("first_name").eq("email", email).single()

    if (!user) return false

    await sendNotification({
      to: email,
      subject: "Reset Your Password",
      template: "password-reset",
      data: {
        userName: user.first_name,
        resetLink,
      },
    })

    return true
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return false
  }
}

export async function sendMilestoneUpdateEmail(startupId: string, milestoneName: string, milestoneDescription: string) {
  try {
    // Get startup details
    const { data: startup } = await supabase
      .from("startup_profiles")
      .select("user_id, company_name")
      .eq("id", startupId)
      .single()

    if (!startup) return

    // Get all investors who have matched with this startup
    const { data: matches } = await supabase
      .from("matches")
      .select("investor_user_id")
      .eq("startup_user_id", startup.user_id)

    if (!matches || matches.length === 0) return

    // Get investor emails
    const investorIds = matches.map((match) => match.investor_user_id)
    const { data: investors } = await supabase.from("users").select("id, email, first_name").in("id", investorIds)

    if (!investors || investors.length === 0) return

    // Send emails to all matched investors
    const startupProfileLink = `${process.env.NEXT_PUBLIC_APP_URL}/startups/${startupId}`

    await Promise.all(
      investors.map((investor) =>
        sendNotification({
          to: investor.email,
          subject: `${startup.company_name} Reached a New Milestone!`,
          template: "milestone-update",
          data: {
            userName: investor.first_name,
            startupName: startup.company_name,
            milestoneName,
            milestoneDescription,
            startupProfileLink,
          },
        }),
      ),
    )

    return true
  } catch (error) {
    console.error("Error sending milestone update emails:", error)
    return false
  }
}

export async function sendMeetingConfirmationEmail(meetingId: string) {
  try {
    // Get meeting details
    const { data: meeting } = await supabase.from("meetings").select("*").eq("id", meetingId).single()

    if (!meeting) return

    // Get user details for both parties
    const { data: users } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .in("id", [meeting.requester_id, meeting.recipient_id])

    if (!users || users.length !== 2) return

    const requester = users.find((user) => user.id === meeting.requester_id)
    const recipient = users.find((user) => user.id === meeting.recipient_id)

    if (!requester || !recipient) return

    // Send confirmation emails to both parties
    await Promise.all([
      sendNotification({
        to: requester.email,
        subject: "Meeting Confirmation",
        template: "meeting-confirmation",
        data: {
          userName: requester.first_name,
          otherPartyName: `${recipient.first_name} ${recipient.last_name}`,
          meetingDate: meeting.meeting_date,
          meetingTime: meeting.meeting_time,
          meetingDuration: meeting.duration,
          meetingType: meeting.meeting_type,
          meetingLink: meeting.meeting_link,
          meetingNotes: meeting.notes,
        },
      }),
      sendNotification({
        to: recipient.email,
        subject: "Meeting Confirmation",
        template: "meeting-confirmation",
        data: {
          userName: recipient.first_name,
          otherPartyName: `${requester.first_name} ${requester.last_name}`,
          meetingDate: meeting.meeting_date,
          meetingTime: meeting.meeting_time,
          meetingDuration: meeting.duration,
          meetingType: meeting.meeting_type,
          meetingLink: meeting.meeting_link,
          meetingNotes: meeting.notes,
        },
      }),
    ])

    return true
  } catch (error) {
    console.error("Error sending meeting confirmation emails:", error)
    return false
  }
}
