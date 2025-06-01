import { verifySmtpConnection } from "./smtp"

export async function initializeEmailService() {
  // Verify SMTP connection on startup
  const isConnected = await verifySmtpConnection()

  if (!isConnected) {
    console.warn("SMTP connection failed. Email notifications may not work properly.")
  }

  return isConnected
}
