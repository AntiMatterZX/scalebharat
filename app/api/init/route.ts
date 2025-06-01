import { NextResponse } from "next/server"
import { initializeEmailService } from "@/lib/email/init"

export async function GET() {
  try {
    // Initialize email service
    await initializeEmailService()

    return NextResponse.json({ status: "ok", message: "Services initialized successfully" })
  } catch (error) {
    console.error("Error initializing services:", error)
    return NextResponse.json({ status: "error", message: "Failed to initialize services" }, { status: 500 })
  }
}
