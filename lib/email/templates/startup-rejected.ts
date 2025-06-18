import { baseTemplate } from "./base"

interface StartupRejectedTemplateProps {
  firstName: string
  companyName: string
  reason: string
  resubmitUrl: string
  changesRejected?: boolean
  supportUrl?: string
}

export function startupRejectedTemplate({
  firstName,
  companyName,
  reason,
  resubmitUrl,
  changesRejected = false,
  supportUrl,
}: StartupRejectedTemplateProps): string {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
      <h1 style="color: #dc2626; font-size: 28px; font-weight: bold; margin: 0;">
        ${changesRejected ? 'Profile Changes Need Revision' : 'Profile Update Required'}
      </h1>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      Hi ${firstName},
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      Thank you for ${changesRejected ? 'submitting changes to' : 'submitting'} <strong>${companyName}</strong> ${changesRejected ? 'on' : 'to'} our platform. 
      After reviewing your ${changesRejected ? 'profile changes' : 'application'}, we need some additional information or updates before we can approve ${changesRejected ? 'the changes' : 'your startup'}.
    </p>

    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #dc2626; font-size: 18px; margin: 0 0 12px 0;">📋 Feedback & Required Changes:</h3>
      <div style="background-color: white; border-radius: 6px; padding: 16px; margin-top: 12px;">
        <p style="color: #374151; margin: 0; line-height: 1.6; white-space: pre-line;">
          ${reason}
        </p>
      </div>
    </div>

    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #0369a1; font-size: 18px; margin: 0 0 12px 0;">🚀 Next Steps:</h3>
      <ol style="color: #374151; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 12px;"><strong>Review the feedback</strong> - Carefully read through our suggestions above</li>
        <li style="margin-bottom: 12px;"><strong>Update your profile</strong> - Make the necessary changes to address our feedback</li>
        <li style="margin-bottom: 12px;"><strong>Resubmit for review</strong> - Once updated, submit your profile again</li>
        <li style="margin-bottom: 12px;"><strong>Quick review</strong> - We'll prioritize reviewing your updated submission within 24-48 hours</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${resubmitUrl}" 
         style="background-color: #0369a1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
        🔧 Update Profile Now
      </a>
    </div>

    <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #92400e; font-size: 18px; margin: 0 0 12px 0;">💡 Common Profile Tips:</h3>
      <ul style="color: #92400e; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;"><strong>Company Description:</strong> Be clear, concise, and highlight your unique value proposition</li>
        <li style="margin-bottom: 8px;"><strong>Financial Information:</strong> Provide realistic and well-researched numbers</li>
        <li style="margin-bottom: 8px;"><strong>Team Details:</strong> Include key team members with relevant experience</li>
        <li style="margin-bottom: 8px;"><strong>Market Opportunity:</strong> Clearly define your target market and size</li>
        <li><strong>Documents:</strong> Upload professional pitch decks and supporting materials</li>
      </ul>
    </div>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #059669; font-size: 18px; margin: 0 0 12px 0;">📞 Need Help?</h3>
      <p style="color: #374151; margin: 0; line-height: 1.6;">
        Our team is here to support you! If you have questions about the feedback or need assistance updating your profile:
      </p>
      <ul style="color: #374151; margin: 12px 0 0 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">📧 Reply to this email for direct support</li>
        <li style="margin-bottom: 8px;">💬 Use the in-app chat feature</li>
        ${supportUrl ? `<li style="margin-bottom: 8px;">🌐 Visit our <a href="${supportUrl}" style="color: #059669; text-decoration: underline;">help center</a></li>` : ''}
        <li>📞 Schedule a consultation call with our team</li>
      </ul>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      We believe in your startup's potential and want to help you succeed. This review process ensures that all startups on our platform 
      have the best chance of connecting with the right investors.
    </p>

    <div style="text-align: center; margin: 24px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
      <p style="font-size: 14px; color: #6b7280; margin: 0; line-height: 1.5;">
        <strong>Quick Stats:</strong> 85% of startups that address our feedback get approved within 48 hours<br>
        <strong>Average Time:</strong> Most profile updates take 15-30 minutes to complete
      </p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151;">
      We're excited to have you join our platform soon!<br>
      <strong>The ScaleBharat Team</strong>
    </p>
  `

  return baseTemplate(content)
}
