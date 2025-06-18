import { baseTemplate } from "./base"

interface ProfileChangesSubmittedTemplateProps {
  firstName: string
  companyName: string
  changesSubmitted: string
  dashboardUrl: string
  expectedReviewTime?: string
}

export function profileChangesSubmittedTemplate({
  firstName,
  companyName,
  changesSubmitted,
  dashboardUrl,
  expectedReviewTime = "24-48 hours",
}: ProfileChangesSubmittedTemplateProps): string {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
      <h1 style="color: #0369a1; font-size: 28px; font-weight: bold; margin: 0;">
        Profile Changes Submitted!
      </h1>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      Hi ${firstName},
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      Thank you for submitting profile changes for <strong>${companyName}</strong>. Your updates have been received and are now under review by our team.
    </p>

    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #0369a1; font-size: 18px; margin: 0 0 12px 0;">📝 Changes Submitted:</h3>
      <div style="background-color: white; border-radius: 6px; padding: 16px; margin-top: 12px;">
        <p style="color: #374151; margin: 0; line-height: 1.6; font-style: italic;">
          ${changesSubmitted}
        </p>
      </div>
    </div>

    <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #92400e; font-size: 18px; margin: 0 0 12px 0;">⏰ What Happens Next?</h3>
      <ul style="color: #92400e; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;"><strong>Review Process:</strong> Our team will review your changes within ${expectedReviewTime}</li>
        <li style="margin-bottom: 8px;"><strong>Current Profile:</strong> Your existing profile remains live and functional</li>
        <li style="margin-bottom: 8px;"><strong>Notification:</strong> You'll receive an email once the review is complete</li>
        <li><strong>Dashboard Updates:</strong> Check your dashboard for real-time status updates</li>
      </ul>
    </div>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #059669; font-size: 18px; margin: 0 0 12px 0;">✅ During Review:</h3>
      <ul style="color: #374151; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Your current profile remains fully accessible to investors</li>
        <li style="margin-bottom: 8px;">You can continue receiving and responding to investor inquiries</li>
        <li style="margin-bottom: 8px;">All platform features remain available</li>
        <li>You can track the review status in your dashboard</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" 
         style="background-color: #0369a1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
        📊 View Dashboard
      </a>
    </div>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #374151; font-size: 18px; margin: 0 0 12px 0;">💡 Review Tips:</h3>
      <p style="color: #6b7280; margin: 0; line-height: 1.6; font-size: 14px;">
        Our review process ensures quality and helps maintain trust between startups and investors. 
        We check for completeness, accuracy, and compliance with our platform guidelines.
      </p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      If you have any questions about the review process or need to make additional changes, 
      please don't hesitate to reach out to our support team.
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <p style="font-size: 14px; color: #6b7280; margin: 0;">
        📧 Questions? Reply to this email<br>
        💬 Use the in-app support chat<br>
        📞 Schedule a call with our team
      </p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151;">
      Thank you for keeping your profile up-to-date!<br>
      <strong>The ScaleBharat Team</strong>
    </p>
  `

  return baseTemplate(content)
} 