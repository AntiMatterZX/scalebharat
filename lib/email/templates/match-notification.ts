import { baseTemplate } from "./base"

export function matchNotificationTemplate(data: {
  name: string
  matchScore: number
  type: "startup" | "investor"
  matchName: string
  matchDescription?: string
  matchProfileLink: string
}) {
  const { name, matchScore, type, matchName, matchDescription, matchProfileLink } = data

  const content = `
    <h2>New Match Found!</h2>
    <p>Hello ${name},</p>
    <p>We're excited to inform you that we've found a new ${type === "startup" ? "investor" : "startup"} match for you!</p>
    
    <h3>${matchName}</h3>
    ${matchDescription ? `<p>${matchDescription}</p>` : ""}
    
    <div style="text-align: center; margin: 20px 0;">
      <div style="font-size: 24px; font-weight: bold; color: #4f46e5;">
        Match Score: ${matchScore}%
      </div>
    </div>
    
    <p>This match was calculated based on your profile preferences and requirements. We believe this could be a great opportunity for you!</p>
    
    <div class="button-container">
      <a href="${matchProfileLink}" class="button">View Your Match</a>
    </div>
    
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
    
    <p>Best regards,<br>The StartupConnect Team</p>
  `

  return baseTemplate(content)
}
