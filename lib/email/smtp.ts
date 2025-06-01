import nodemailer from "nodemailer"
import type { EmailTemplate } from "./templates"

// Environment variables for SMTP configuration
const SMTP_HOST = process.env.SMTP_HOST || ""
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587", 10)
const SMTP_USER = process.env.SMTP_USER || ""
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || ""
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@yourstartupdir.com"

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
})

export interface EmailOptions {
  to: string | string[]
  subject: string
  template: EmailTemplate
  data: Record<string, any>
}

export async function sendEmail({ to, subject, template, data }: EmailOptions): Promise<boolean> {
  try {
    // Get the HTML content from the template
    const html = template(data)

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Startup Directory" <${EMAIL_FROM}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    })

    console.log(`Message sent: ${info.messageId}`)
    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}

// Verify SMTP connection on startup
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    await transporter.verify()
    console.log("SMTP server connection verified")
    return true
  } catch (error) {
    console.error("SMTP connection error:", error)
    return false
  }
}
