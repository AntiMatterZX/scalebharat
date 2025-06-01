import { baseTemplate } from "./base"

export function welcomeTemplate(data: {
  name: string
  userType: string
  loginUrl: string
}) {
  const { name, userType, loginUrl } = data

  const content = `
    <h2>Welcome to StartupConnect!</h2>
    <p>Hello ${name},</p>
    <p>Thank you for joining StartupConnect! We're excited to have you on board as a ${userType}.</p>
    
    <p>Here are a few steps to get started:</p>
    
    <ul>
      <li>Complete your profile to improve your matching potential</li>
      <li>Browse ${userType === "startup" ? "investors" : "startups"} that match your criteria</li>
      <li>Connect with your matches and start conversations</li>
    </ul>
    
    <div class="button-container">
      <a href="${loginUrl}" class="button">Go to Your Dashboard</a>
    </div>
    
    <p>If you have any questions or need assistance, our support team is always here to help.</p>
    
    <p>Best regards,<br>The StartupConnect Team</p>
  `

  return baseTemplate(content)
}
