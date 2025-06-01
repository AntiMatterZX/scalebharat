import { baseEmailTemplate } from "./base"

interface StartupRejectedTemplateProps {
  firstName: string
  companyName: string
  reason: string
  resubmitUrl: string
}

export function startupRejectedTemplate({
  firstName,
  companyName,
  reason,
  resubmitUrl,
}: StartupRejectedTemplateProps): string {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
      <h1 style="color: #dc2626; font-size: 28px; font-weight: bold; margin: 0;">
        Update Required
      </h1>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      Hi ${firstName},
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      Thank you for submitting <strong>${companyName}</strong> to our platform. After reviewing your application, we need some additional information before we can approve your startup.
    </p>

    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #dc2626; font-size: 18px; margin: 0 0 12px 0;">Feedback:</h3>
      <p style="color: #374151; margin: 0; line-height: 1.6;">
        ${reason}
      </p>
    </div>

    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #0369a1; font-size: 18px; margin: 0 0 12px 0;">Next Steps:</h3>
      <ul style="color: #374151; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Review the feedback above</li>
        <li style="margin-bottom: 8px;">Update your startup profile</li>
        <li style="margin-bottom: 8px;">Resubmit for approval</li>
        <li>We'll review your updated submission within 24-48 hours</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${resubmitUrl}" 
         style="background-color: #0369a1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
        Update Profile
      </a>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      We're here to help you succeed. If you have any questions about the feedback or need assistance updating your profile, please don't hesitate to contact our support team.
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #374151;">
      Thank you for your patience,<br>
      The StartupConnect Team
    </p>
  `

  return baseEmailTemplate({
    title: "Update required for your startup submission",
    content,
    footerText: "You're receiving this email because your startup was submitted for approval on StartupConnect.",
  })
}
