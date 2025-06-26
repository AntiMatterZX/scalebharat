import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

const getEmailTemplate = (
  recipientName: string,
  meetingTitle: string,
  organizerName: string,
  attendeeName: string,
  meetingDate: string,
  meetingTime: string,
  duration: number,
  meetingType: string,
  description?: string,
  meetingLink?: string,
  isOrganizer = false
) => {
  const subject = isOrganizer 
    ? `Meeting Confirmed: ${meetingTitle}`
    : `Meeting Invitation: ${meetingTitle}`

  const actionText = isOrganizer
    ? "Your meeting has been scheduled successfully"
    : "You've been invited to a meeting"

  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                📅 ${isOrganizer ? 'Meeting Scheduled' : 'Meeting Invitation'}
              </h1>
              <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">
                ${actionText}
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Hello ${recipientName},
              </p>

              <!-- Meeting Card -->
              <div style="background-color: #f8fafc; border-left: 4px solid #667eea; padding: 25px; margin: 30px 0; border-radius: 8px;">
                <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                  ${meetingTitle}
                </h2>

                <div style="display: grid; gap: 15px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #667eea; color: white; padding: 8px; border-radius: 6px; margin-right: 15px; font-size: 14px;">📅</span>
                    <div>
                      <strong style="color: #374151;">Date:</strong>
                      <span style="color: #6b7280; margin-left: 8px;">${meetingDate}</span>
                    </div>
                  </div>

                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #667eea; color: white; padding: 8px; border-radius: 6px; margin-right: 15px; font-size: 14px;">🕐</span>
                    <div>
                      <strong style="color: #374151;">Time:</strong>
                      <span style="color: #6b7280; margin-left: 8px;">${meetingTime} (${duration} minutes)</span>
                    </div>
                  </div>

                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #667eea; color: white; padding: 8px; border-radius: 6px; margin-right: 15px; font-size: 14px;">${meetingType === 'video' ? '📹' : meetingType === 'phone' ? '📞' : '📍'}</span>
                    <div>
                      <strong style="color: #374151;">Type:</strong>
                      <span style="color: #6b7280; margin-left: 8px; text-transform: capitalize;">${meetingType === 'in_person' ? 'In Person' : meetingType}</span>
                    </div>
                  </div>

                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #667eea; color: white; padding: 8px; border-radius: 6px; margin-right: 15px; font-size: 14px;">👥</span>
                    <div>
                      <strong style="color: #374151;">Participants:</strong>
                      <span style="color: #6b7280; margin-left: 8px;">${organizerName} & ${attendeeName}</span>
                    </div>
                  </div>

                  ${description ? `
                    <div style="margin-top: 20px;">
                      <strong style="color: #374151;">Description:</strong>
                      <p style="color: #6b7280; margin: 8px 0 0 0; line-height: 1.6;">${description}</p>
                    </div>
                  ` : ''}

                  ${meetingLink ? `
                    <div style="margin-top: 25px;">
                      <a href="${meetingLink}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                        🚀 Join Meeting
                      </a>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Calendar Reminder -->
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #0369a1; margin: 0; font-size: 14px; font-weight: 500;">
                  💡 <strong>Pro Tip:</strong> Add this meeting to your calendar to get automatic reminders!
                </p>
              </div>

              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                If you need to reschedule or have any questions, please contact ${organizerName} directly.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                This email was sent automatically by the Startup Directory Platform
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">
                © 2024 Startup Directory. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

export const sendMeetingEmail = async (
  to: string,
  recipientName: string,
  meetingDetails: {
    title: string
    organizerName: string
    attendeeName: string
    date: string
    time: string
    duration: number
    type: string
    description?: string
    meetingLink?: string
  },
  isOrganizer = false
) => {
  try {
    const { subject, html } = getEmailTemplate(
      recipientName,
      meetingDetails.title,
      meetingDetails.organizerName,
      meetingDetails.attendeeName,
      meetingDetails.date,
      meetingDetails.time,
      meetingDetails.duration,
      meetingDetails.type,
      meetingDetails.description,
      meetingDetails.meetingLink,
      isOrganizer
    )

    await transporter.sendMail({
      from: `"Startup Directory" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })

    return { success: true }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error }
  }
}

// General email sending function
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  from?: string
) => {
  try {
    await transporter.sendMail({
      from: from || `"StartupConnect" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })

    return { success: true }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error }
  }
} 