import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { to, templateType, data } = await request.json()

    if (!to || !templateType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const subject = `Test Email: ${templateType}`

    const success = await sendEmail(to, subject, templateType, data)

    if (success) {
      return NextResponse.json({ success: true, message: "Test email sent successfully" })
    } else {
      return NextResponse.json({ error: "Failed to send test email" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
