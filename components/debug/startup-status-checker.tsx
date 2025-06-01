"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StartupStatusCheckerProps {
  startupSlug: string
}

export function StartupStatusChecker({ startupSlug }: StartupStatusCheckerProps) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/debug/startup-status/${startupSlug}`)
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Error checking status:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <Button onClick={checkStatus} disabled={loading} size="sm" variant="outline">
        {loading ? "Checking..." : "Check Actual Status"}
      </Button>

      {status && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant="outline">{status.startup?.status}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Verified:</span>
              <Badge variant={status.startup?.is_verified ? "default" : "secondary"}>
                {status.startup?.is_verified ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Slug:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{status.startup?.slug || "No slug"}</code>
            </div>
            <div className="text-xs text-gray-500">
              <p>Updated: {status.startup?.updated_at}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
