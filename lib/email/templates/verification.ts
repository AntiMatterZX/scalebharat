import { baseTemplate } from "./base"

export function verificationTemplate(data: {
  name: string
  companyName: string
  verificationLink: string
}) {
  const { name, companyName, verificationLink } = data

  const content = `
    <h2>Verification Request Received</h2>
    <p>Hello ${name},</p>
    <p>We've received your verification request for <strong>${companyName}</strong>. Our team will review your information and verify your profile.</p>
    
    <p>Verification typically takes 1-2 business days. Once verified, your profile will display a verification badge, increasing your credibility on the platform.</p>
    
    <div class="button-container">
      <a href="${verificationLink}" class="button">Check Verification Status</a>
    </div>
    
    <p>If you have any questions or need to provide additional information, please contact our support team.</p>
    
    <p>Best regards,<br>The StartupConnect Team</p>
  `

  return baseTemplate(content)
}
