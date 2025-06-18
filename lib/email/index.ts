import nodemailer from "nodemailer"
import { templates } from "./templates"

// Email template types - expanded to include all available templates
export type EmailTemplateType =
  | "welcome"
  | "password-reset"
  | "new-match"
  | "match-notification"
  | "verification"
  | "meeting-confirmation"
  | "milestone-update"
  | "startup-approved"
  | "startup-rejected"
  | "profile-changes-submitted"
  | "system"

// Email template data interface
export interface EmailTemplateData {
  [key: string]: any
}

// Create transporter with better error handling
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  }

  // Log configuration (without sensitive data) in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Email transporter config:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user ? '***configured***' : 'NOT_SET',
      pass: config.auth.pass ? '***configured***' : 'NOT_SET',
    })
  }

  return nodemailer.createTransport(config)
}

const transporter = createTransporter()

// Get template function with better error handling
const getTemplate = (type: EmailTemplateType): ((data: any) => string) => {
  const template = templates[type as keyof typeof templates]
  if (!template) {
    throw new Error(`Unknown email template type: ${type}. Available templates: ${Object.keys(templates).join(', ')}`)
  }
  return template as (data: any) => string
}

// Enhanced send email function
export async function sendEmail(
  to: string | string[],
  subject: string,
  templateType: EmailTemplateType,
  data: EmailTemplateData,
): Promise<boolean> {
  try {
    // Validate required environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('Missing required email environment variables:', {
        SMTP_HOST: !!process.env.SMTP_HOST,
        SMTP_USER: !!process.env.SMTP_USER,
        SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      })
      return false
    }

    // Get template function
    const templateFn = getTemplate(templateType)

    // Generate HTML content
    const html = templateFn(data)

    // Prepare email options
    const emailOptions = {
      from: `"ScaleBharat" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    }

    // Send email
    const result = await transporter.sendMail(emailOptions)
    
    console.log(`Email sent successfully to ${emailOptions.to}:`, {
      messageId: result.messageId,
      subject: subject,
      template: templateType
    })

    return true
  } catch (error) {
    console.error("Error sending email:", {
      error: error instanceof Error ? error.message : error,
      to,
      subject,
      templateType
    })
    return false
  }
}

// Verify SMTP connection with enhanced logging
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify()
    console.log("✅ SMTP connection verified successfully")
    return true
  } catch (error) {
    console.error("❌ SMTP connection error:", error)
    console.log("Please check your email environment variables:")
    console.log("- SMTP_HOST:", process.env.SMTP_HOST ? "✅ Set" : "❌ Missing")
    console.log("- SMTP_PORT:", process.env.SMTP_PORT ? "✅ Set" : "❌ Missing (will default to 587)")
    console.log("- SMTP_USER:", process.env.SMTP_USER ? "✅ Set" : "❌ Missing")
    console.log("- SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "✅ Set" : "❌ Missing")
    console.log("- EMAIL_FROM:", process.env.EMAIL_FROM ? "✅ Set" : "⚠️ Missing (will use SMTP_USER)")
    return false
  }
}

// Helper function to send different types of emails
export const emailHelpers = {
  // Authentication emails
  sendWelcomeEmail: (to: string, data: { firstName: string; verificationUrl?: string }) =>
    sendEmail(to, "Welcome to ScaleBharat! 🚀", "welcome", data),

  sendPasswordResetEmail: (to: string, data: { firstName: string; resetUrl: string }) =>
    sendEmail(to, "Reset Your Password - ScaleBharat", "password-reset", data),

  sendVerificationEmail: (to: string, data: { firstName: string; verificationUrl: string }) =>
    sendEmail(to, "Verify Your Email - ScaleBharat", "verification", data),

  // Matching emails
  sendNewMatchEmail: (to: string, data: { 
    recipientName: string; 
    matchName: string; 
    matchType: string;
    matchScore: number;
    profileUrl: string;
  }) =>
    sendEmail(to, "🎯 New Match Found!", "new-match", data),

  // Meeting emails
  sendMeetingConfirmationEmail: (to: string, data: {
    recipientName: string;
    meetingTitle: string;
    meetingDate: string;
    meetingTime: string;
    meetingLink?: string;
    organizerName: string;
  }) =>
    sendEmail(to, "Meeting Confirmed - ScaleBharat", "meeting-confirmation", data),

  // Startup approval emails
  sendStartupApprovedEmail: (to: string, data: {
    founderName: string;
    startupName: string;
    profileUrl: string;
    dashboardUrl: string;
    changesApplied?: string[];
  }) =>
    sendEmail(to, "🎉 Your Startup Profile is Now Live!", "startup-approved", data),

  sendStartupRejectedEmail: (to: string, data: {
    founderName: string;
    startupName: string;
    rejectionReason: string;
    resubmitUrl: string;
    supportEmail: string;
  }) =>
    sendEmail(to, "📝 Profile Updates Needed - ScaleBharat", "startup-rejected", data),

  sendProfileChangesSubmittedEmail: (to: string, data: {
    founderName: string;
    startupName: string;
    submissionDate: string;
    changesSubmitted: string[];
    dashboardUrl: string;
  }) =>
    sendEmail(to, "✅ Profile Changes Submitted for Review", "profile-changes-submitted", data),

  // Milestone emails
  sendMilestoneUpdateEmail: (to: string, data: {
    recipientName: string;
    startupName: string;
    milestoneTitle: string;
    milestoneDescription: string;
    profileUrl: string;
  }) =>
    sendEmail(to, "📈 Startup Milestone Update", "milestone-update", data),
}
