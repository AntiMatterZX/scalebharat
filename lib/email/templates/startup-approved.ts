import { baseTemplate } from "./base"

interface StartupApprovedTemplateProps {
  firstName: string
  companyName: string
  dashboardUrl: string
}

export function startupApprovedTemplate({
  firstName,
  companyName,
  dashboardUrl,
}: StartupApprovedTemplateProps): string {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
      <h1 style="color: #059669; font-size: 28px; font-weight: bold; margin: 0;">
        Congratulations!
      </h1>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      Hi ${firstName},
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      Great news! Your startup <strong>${companyName}</strong> has been approved and is now live on our platform.
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #059669; font-size: 18px; margin: 0 0 12px 0;">What happens next?</h3>
      <ul style="color: #374151; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Your startup is now visible to investors</li>
        <li style="margin-bottom: 8px;">You'll start receiving match notifications</li>
        <li style="margin-bottom: 8px;">Investors can now contact you directly</li>
        <li>Your profile will appear in search results</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" 
         style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
        Go to Dashboard
      </a>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      We're excited to help you connect with the right investors. If you have any questions, feel free to reach out to our support team.
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #374151;">
      Best of luck with your fundraising journey!<br>
      The StartupConnect Team
    </p>
  `

  return baseTemplate(content)
}
