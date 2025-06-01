import { baseTemplate } from "./base"

export function passwordResetTemplate(data: {
  name: string
  resetLink: string
}) {
  const { name, resetLink } = data

  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello ${name},</p>
    <p>We received a request to reset your password for your StartupConnect account. If you didn't make this request, you can safely ignore this email.</p>
    
    <p>To reset your password, please click the button below:</p>
    
    <div class="button-container">
      <a href="${resetLink}" class="button">Reset Your Password</a>
    </div>
    
    <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
    
    <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
    <p>${resetLink}</p>
    
    <p>If you have any questions or need assistance, please contact our support team.</p>
    
    <p>Best regards,<br>The StartupConnect Team</p>
  `

  return baseTemplate(content)
}
