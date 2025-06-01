"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Mail, Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function EmailTemplatesPage() {
  const { toast } = useToast()
  const [testEmail, setTestEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState("welcome")

  const sendTestEmail = async (templateType: string) => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      })
      return
    }

    setSending(true)

    try {
      // Prepare test data based on template type
      let testData = {}

      switch (templateType) {
        case "welcome":
          testData = {
            name: "John Doe",
            userType: "startup",
            loginUrl: `${window.location.origin}/dashboard`,
          }
          break
        case "password-reset":
          testData = {
            name: "John Doe",
            resetLink: `${window.location.origin}/auth/reset-password?token=test-token`,
          }
          break
        case "match-notification":
          testData = {
            name: "John Doe",
            matchScore: 85,
            type: "startup",
            matchName: "Venture Capital Fund",
            matchDescription: "A leading venture capital fund focused on early-stage startups.",
            matchProfileLink: `${window.location.origin}/investors/test-id`,
          }
          break
        case "verification":
          testData = {
            name: "John Doe",
            companyName: "Acme Startup",
            verificationLink: `${window.location.origin}/dashboard/verification`,
          }
          break
        case "meeting-confirmation":
          testData = {
            name: "John Doe",
            otherPartyName: "Jane Smith",
            meetingDate: "Monday, January 1, 2024",
            meetingTime: "10:00 AM",
            meetingDuration: 30,
            meetingType: "Video Call",
            meetingLink: "https://meet.google.com/test-link",
            meetingNotes: "Discuss potential investment opportunity",
            calendarLink: `${window.location.origin}/calendar/add?event=test`,
          }
          break
      }

      // Send test email
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: testEmail,
          templateType,
          data: testData,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test email sent successfully",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send test email",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <AdminLayout type="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">Manage and test email templates</p>
        </div>

        <div className="grid gap-6 md:grid-cols-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Test Email</CardTitle>
              <CardDescription>Send a test email to verify templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Email Address</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="Enter test email address"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={() => sendTestEmail(activeTemplate)} disabled={sending}>
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? "Sending..." : "Send Test Email"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>Preview and manage email templates</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="welcome" className="space-y-4" onValueChange={setActiveTemplate}>
                <TabsList className="grid grid-cols-2 md:grid-cols-5">
                  <TabsTrigger value="welcome">Welcome</TabsTrigger>
                  <TabsTrigger value="password-reset">Password Reset</TabsTrigger>
                  <TabsTrigger value="match-notification">Match</TabsTrigger>
                  <TabsTrigger value="verification">Verification</TabsTrigger>
                  <TabsTrigger value="meeting-confirmation">Meeting</TabsTrigger>
                </TabsList>

                <TabsContent value="welcome">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Welcome Email</h3>
                      <Button size="sm" variant="outline" onClick={() => sendTestEmail("welcome")}>
                        <Send className="mr-2 h-4 w-4" />
                        Test
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sent to new users when they sign up for the platform.
                    </p>
                    <div className="border rounded-md p-4 bg-gray-50">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">Subject: Welcome to StartupConnect!</span>
                        </div>
                        <div className="pl-7">
                          <p className="text-sm">Hello [name],</p>
                          <p className="text-sm mt-2">
                            Thank you for joining StartupConnect! We're excited to have you on board as a [userType].
                          </p>
                          <p className="text-sm mt-2">Here are a few steps to get started:</p>
                          <ul className="text-sm list-disc pl-5 mt-1">
                            <li>Complete your profile</li>
                            <li>Browse matches</li>
                            <li>Connect and start conversations</li>
                          </ul>
                          <div className="mt-2 text-center">
                            <span className="inline-block bg-blue-500 text-white px-4 py-2 rounded text-sm">
                              Go to Your Dashboard
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="password-reset">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Password Reset Email</h3>
                      <Button size="sm" variant="outline" onClick={() => sendTestEmail("password-reset")}>
                        <Send className="mr-2 h-4 w-4" />
                        Test
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Sent when a user requests a password reset.</p>
                    <div className="border rounded-md p-4 bg-gray-50">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">Subject: Reset Your Password</span>
                        </div>
                        <div className="pl-7">
                          <p className="text-sm">Hello [name],</p>
                          <p className="text-sm mt-2">
                            We received a request to reset your password for your StartupConnect account.
                          </p>
                          <div className="mt-2 text-center">
                            <span className="inline-block bg-blue-500 text-white px-4 py-2 rounded text-sm">
                              Reset Your Password
                            </span>
                          </div>
                          <p className="text-sm mt-2">
                            <strong>Note:</strong> This link will expire in 1 hour for security reasons.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="match-notification">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Match Notification Email</h3>
                      <Button size="sm" variant="outline" onClick={() => sendTestEmail("match-notification")}>
                        <Send className="mr-2 h-4 w-4" />
                        Test
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Sent when a new match is found for a user.</p>
                    <div className="border rounded-md p-4 bg-gray-50">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">Subject: New Match Found!</span>
                        </div>
                        <div className="pl-7">
                          <p className="text-sm">Hello [name],</p>
                          <p className="text-sm mt-2">
                            We're excited to inform you that we've found a new match for you!
                          </p>
                          <h4 className="text-sm font-medium mt-2">[matchName]</h4>
                          <p className="text-sm">[matchDescription]</p>
                          <div className="mt-2 text-center">
                            <span className="text-lg font-bold text-blue-500">Match Score: [matchScore]%</span>
                          </div>
                          <div className="mt-2 text-center">
                            <span className="inline-block bg-blue-500 text-white px-4 py-2 rounded text-sm">
                              View Your Match
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="verification">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Verification Email</h3>
                      <Button size="sm" variant="outline" onClick={() => sendTestEmail("verification")}>
                        <Send className="mr-2 h-4 w-4" />
                        Test
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Sent when a user requests profile verification.</p>
                    <div className="border rounded-md p-4 bg-gray-50">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">Subject: Verification Request Received</span>
                        </div>
                        <div className="pl-7">
                          <p className="text-sm">Hello [name],</p>
                          <p className="text-sm mt-2">
                            We've received your verification request for <strong>[companyName]</strong>.
                          </p>
                          <p className="text-sm mt-2">Verification typically takes 1-2 business days.</p>
                          <div className="mt-2 text-center">
                            <span className="inline-block bg-blue-500 text-white px-4 py-2 rounded text-sm">
                              Check Verification Status
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="meeting-confirmation">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Meeting Confirmation Email</h3>
                      <Button size="sm" variant="outline" onClick={() => sendTestEmail("meeting-confirmation")}>
                        <Send className="mr-2 h-4 w-4" />
                        Test
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Sent when a meeting is scheduled between users.</p>
                    <div className="border rounded-md p-4 bg-gray-50">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">Subject: Meeting Confirmation</span>
                        </div>
                        <div className="pl-7">
                          <p className="text-sm">Hello [name],</p>
                          <p className="text-sm mt-2">
                            Your meeting with <strong>[otherPartyName]</strong> has been confirmed!
                          </p>
                          <div className="bg-blue-50 border border-blue-200 p-3 rounded mt-2">
                            <p className="text-sm">
                              <strong>Date:</strong> [meetingDate]
                            </p>
                            <p className="text-sm">
                              <strong>Time:</strong> [meetingTime]
                            </p>
                            <p className="text-sm">
                              <strong>Duration:</strong> [meetingDuration] minutes
                            </p>
                            <p className="text-sm">
                              <strong>Meeting Type:</strong> [meetingType]
                            </p>
                            <p className="text-sm">
                              <strong>Meeting Link:</strong> [meetingLink]
                            </p>
                          </div>
                          <div className="mt-2 text-center">
                            <span className="inline-block bg-blue-500 text-white px-4 py-2 rounded text-sm">
                              Add to Calendar
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
