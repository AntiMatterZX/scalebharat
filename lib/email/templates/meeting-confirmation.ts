import { baseTemplate } from "./base"

export function meetingConfirmationTemplate(data: {
  name: string
  otherPartyName: string
  meetingDate: string
  meetingTime: string
  meetingDuration: number
  meetingType: string
  meetingLink?: string
  meetingNotes?: string
  calendarLink: string
}) {
  const {
    name,
    otherPartyName,
    meetingDate,
    meetingTime,
    meetingDuration,
    meetingType,
    meetingLink,
    meetingNotes,
    calendarLink,
  } = data

  const content = `
    <h2>Meeting Confirmation</h2>
    <p>Hello ${name},</p>
    <p>Your meeting with <strong>${otherPartyName}</strong> has been confirmed!</p>
    
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <div style="margin-bottom: 10px;">
        <strong>Date:</strong> ${meetingDate}
      </div>
      <div style="margin-bottom: 10px;">
        <strong>Time:</strong> ${meetingTime}
      </div>
      <div style="margin-bottom: 10px;">
        <strong>Duration:</strong> ${meetingDuration} minutes
      </div>
      <div style="margin-bottom: 10px;">
        <strong>Meeting Type:</strong> ${meetingType}
      </div>
      ${
        meetingLink
          ? `
      <div style="margin-bottom: 10px;">
        <strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a>
      </div>
      `
          : ""
      }
    </div>
    
    ${
      meetingNotes
        ? `
    <div style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; margin-top: 20px;">
      <strong>Meeting Notes:</strong>
      <p>${meetingNotes}</p>
    </div>
    `
        : ""
    }
    
    <div class="button-container">
      <a href="${calendarLink}" class="button">Add to Calendar</a>
    </div>
    
    <p>We recommend adding this meeting to your calendar to ensure you don't miss it.</p>
    
    <p>Best regards,<br>The StartupConnect Team</p>
  `

  return baseTemplate(content)
}
