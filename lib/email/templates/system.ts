import { baseTemplate } from "./base"

export interface SystemEmailData {
  name: string
  content: string
  action_url?: string
  priority?: string
}

export function systemTemplate(data: SystemEmailData): string {
  const content = `
    <h2>System Notification</h2>
    <p>Hello ${data.name},</p>
    
    <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
      <div style="color: #334155; line-height: 1.6;">
        ${data.content}
      </div>
    </div>

    ${data.action_url ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.action_url}" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Take Action
        </a>
      </div>
    ` : ''}
  `

  return baseTemplate(content)
} 