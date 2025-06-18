import { baseTemplate } from "./base"

interface StartupApprovedTemplateProps {
  firstName: string
  companyName: string
  dashboardUrl: string
  profileUrl?: string
  changesApproved?: string
}

export function startupApprovedTemplate({
  firstName,
  companyName,
  dashboardUrl,
  profileUrl,
  changesApproved,
}: StartupApprovedTemplateProps): string {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
      <h1 style="color: #059669; font-size: 28px; font-weight: bold; margin: 0;">
        ${changesApproved ? 'Profile Changes Approved!' : 'Congratulations!'}
      </h1>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      Hi ${firstName},
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      ${changesApproved 
        ? `Great news! Your profile changes for <strong>${companyName}</strong> have been approved and are now live on our platform.`
        : `Great news! Your startup <strong>${companyName}</strong> has been approved and is now live on our platform.`
      }
    </p>

    ${changesApproved ? `
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #0369a1; font-size: 18px; margin: 0 0 12px 0;">Changes Applied:</h3>
      <p style="color: #374151; margin: 0; line-height: 1.6; font-style: italic;">
        ${changesApproved}
      </p>
    </div>
    ` : ''}

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #059669; font-size: 18px; margin: 0 0 12px 0;">What's Next?</h3>
      <ul style="color: #374151; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">✅ Your ${changesApproved ? 'updated profile is' : 'startup is'} now visible to investors</li>
        <li style="margin-bottom: 8px;">🎯 You'll start receiving match notifications based on investor preferences</li>
        <li style="margin-bottom: 8px;">💬 Investors can now contact you directly through the platform</li>
        <li style="margin-bottom: 8px;">🔍 Your profile will appear in investor search results</li>
        <li>📊 Track your profile performance in the analytics dashboard</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; margin-right: 12px;">
        <a href="${dashboardUrl}" 
           style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-bottom: 8px;">
          📊 Go to Dashboard
        </a>
      </div>
      ${profileUrl ? `
      <div style="display: inline-block;">
        <a href="${profileUrl}" 
           style="background-color: #0369a1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-bottom: 8px;">
          👀 View Public Profile
        </a>
      </div>
      ` : ''}
    </div>

    <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #92400e; font-size: 18px; margin: 0 0 12px 0;">💡 Pro Tips for Success:</h3>
      <ul style="color: #92400e; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Keep your profile updated with latest milestones and achievements</li>
        <li style="margin-bottom: 8px;">Respond promptly to investor inquiries</li>
        <li style="margin-bottom: 8px;">Upload high-quality documents like pitch decks and financial statements</li>
        <li>Engage actively with matched investors to build relationships</li>
      </ul>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      We're excited to help you connect with the right investors. If you have any questions or need assistance, our support team is here to help.
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <p style="font-size: 14px; color: #6b7280; margin: 0;">
        📧 Questions? Reply to this email or contact support<br>
        🌐 Visit our help center for guides and tips
      </p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151;">
      Best of luck with your fundraising journey!<br>
      <strong>The ScaleBharat Team</strong>
    </p>
  `

  return baseTemplate(content)
}
