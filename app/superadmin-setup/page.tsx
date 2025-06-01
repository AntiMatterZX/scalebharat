"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, CheckCircle } from "lucide-react"

export default function SuperAdminSetupPage() {
  const [email, setEmail] = useState("")
  const [adminSecret, setAdminSecret] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    setMessage("")

    try {
      const response = await fetch("/api/superadmin/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          adminSecret,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
        setMessage(result.message || "SuperAdmin role assigned successfully!")
        setEmail("")
        setAdminSecret("")
      } else {
        setError(result.error || "Failed to assign superadmin role")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>SuperAdmin Setup</CardTitle>
          <CardDescription>Assign the SuperAdmin role to a user</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">SuperAdmin Role Assigned</h3>
              <p className="text-gray-600 mb-4">{message}</p>
              <Button onClick={() => setSuccess(false)}>Assign Another</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">User Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">The user must already exist in the system</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminSecret">Admin Secret</Label>
                <Input
                  id="adminSecret"
                  type="password"
                  placeholder="Enter admin secret"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is the secret key defined in your environment variables
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processing..." : "Assign SuperAdmin Role"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
