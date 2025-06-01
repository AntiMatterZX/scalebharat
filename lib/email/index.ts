import nodemailer from "nodemailer"
import { welcomeTemplate } from "./templates/welcome"
import { passwordResetTemplate } from "./templates/password-reset"
import { matchNotificationTemplate } from "./templates/match-notification"
import { verificationTemplate } from "./templates/verification"
import { meetingConfirmationTemplate } from "./templates/meeting-confirmation"

// Email template types
export type EmailTemplateType =
  | "welcome"
  | "password-reset"
  | "match-notification"
  | "verification"
  | "meeting-confirmation"

// Email template data interface
export interface EmailTemplateData {
  [key: string]: any
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// Get template function
const getTemplate = (type: EmailTemplateType) => {
  switch (type) {
    case "welcome":
      return welcomeTemplate
    case "password-reset":
      return passwordResetTemplate
    case "match-notification":
      return matchNotificationTemplate
    case "verification":
      return verificationTemplate
    case "meeting-confirmation":
      return meetingConfirmationTemplate
    default:
      throw new Error(`Unknown email template type: ${type}`)
  }
}

// Send email
export async function sendEmail(
  to: string | string[],
  subject: string,
  templateType: EmailTemplateType,
  data: EmailTemplateData,
): Promise<boolean> {
  try {
    // Get template function
    const templateFn = getTemplate(templateType)

    // Generate HTML content
    const html = templateFn(data)

    // Send email
    await transporter.sendMail({
      from: `"StartupConnect" <${process.env.EMAIL_FROM}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    })

    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}

// Verify SMTP connection
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify()
    console.log("SMTP connection verified")
    return true
  } catch (error) {
    console.error("SMTP connection error:", error)
    return false
  }
}
