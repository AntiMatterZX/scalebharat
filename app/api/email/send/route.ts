import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { to, subject, template, data } = await request.json()

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Simple HTML template
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${subject}</h2>
        <p>Hello ${data.name || 'there'},</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
          ${data.content || 'You have a new notification from ScaleBharat.'}
        </div>
        ${data.action_url ? `<p><a href="${data.action_url}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Take Action</a></p>` : ''}
        <p>Best regards,<br>ScaleBharat Team</p>
      </div>
    `

    await transporter.sendMail({
      from: `"ScaleBharat" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Email send error:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
} 