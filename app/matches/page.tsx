"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserProfile } from "@/lib/hooks/useUserProfile"
import { Loader2 } from "lucide-react"

export default function MatchesRedirectPage() {
  const router = useRouter()
  const { type: userType, loading } = useUserProfile()

  useEffect(() => {
    if (!loading && userType) {
      // Redirect to role-specific matches page
      if (userType === "startup") {
        router.replace("/startup/matches")
      } else if (userType === "investor") {
        router.replace("/investor/matches")
      } else {
        // Admin or unknown role, redirect to dashboard
        router.replace("/dashboard")
      }
    }
  }, [userType, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to your matches...</p>
      </div>
    </div>
  )
}
