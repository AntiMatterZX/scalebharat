"use client"

import { useState, useEffect } from "react"
import { useUser } from "./useUser"
import { supabase } from "@/lib/supabase"

type ProfileType = "startup" | "investor" | "admin" | null
type ProfileStatus = "pending" | "active" | "inactive" | null

interface UserProfileData {
  type: ProfileType
  status: ProfileStatus
  startupId?: string
  investorId?: string
  isComplete: boolean
  isLoading: boolean
}

export function useUserProfile(): UserProfileData {
  const { user, isLoading: userLoading } = useUser()
  const [profileData, setProfileData] = useState<UserProfileData>({
    type: null,
    status: null,
    isComplete: false,
    isLoading: true,
  })

  useEffect(() => {
    const fetchProfileDataFromAPI = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (!response.ok) {
          throw new Error('Failed to fetch profile from API')
        }
        const data = await response.json()
        
        setProfileData({
          type: data.type,
          status: data.status,
          startupId: data.startupId,
          investorId: data.investorId,
          isComplete: data.isComplete,
          isLoading: false,
        })
      } catch (error) {
        console.error("Error fetching profile data from API:", error)
        setProfileData({
          type: null,
          status: null,
          isComplete: false,
          isLoading: false,
        })
      }
    }

    const fetchProfileData = async () => {
      if (!user) {
        setProfileData({
          type: null,
          status: null,
          isComplete: false,
          isLoading: false,
        })
        return
      }

      try {
        // Ensure we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("Session error:", sessionError)
          // Fallback to API route
          await fetchProfileDataFromAPI()
          return
        }

        if (!session) {
          console.warn("No active session found")
          // Fallback to API route
          await fetchProfileDataFromAPI()
          return
        }

        // Try to check if user has admin role (but don't fail if this doesn't work)
        let isAdmin = false
        try {
          const { data: userRole, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .in("role", ["admin", "superadmin"])
            .maybeSingle()

          if (!roleError && userRole?.role) {
            isAdmin = true
          }
          // Don't log errors for user_roles - many users won't have entries
        } catch (error) {
          // Silently ignore user_roles errors - this is expected for most users
        }

        if (isAdmin) {
          setProfileData({
            type: "admin",
            status: "active",
            isComplete: true,
            isLoading: false,
          })
          return
        }

        // Check if user has a startup profile
        let startup = null
        let startupError: any = null
        try {
          const result = await supabase
            .from("startups")
            .select("id, status, company_name, description")
            .eq("user_id", user.id)
            .maybeSingle()
          
          startup = result.data
          startupError = result.error
        } catch (error) {
          // Handle any unexpected errors
          startupError = error
        }

        if (startupError && startupError.code !== 'PGRST116') {
          // If we get an RLS error, fallback to API route
          if (startupError.code === 'PGRST301' || (startupError.message && startupError.message.includes('406'))) {
            await fetchProfileDataFromAPI()
            return
          }
        }

        // Check if user has an investor profile
        let investor = null
        let investorError: any = null
        try {
          const result = await supabase
            .from("investors")
            .select("id, status, firm_name, description")
            .eq("user_id", user.id)
            .maybeSingle()
          
          investor = result.data
          investorError = result.error
        } catch (error) {
          // Handle any unexpected errors
          investorError = error
        }

        if (investorError && investorError.code !== 'PGRST116') {
          // If we get an RLS error, fallback to API route
          if (investorError.code === 'PGRST301' || (investorError.message && investorError.message.includes('406'))) {
            await fetchProfileDataFromAPI()
            return
          }
        }

        if (startup) {
          // Check if startup profile is complete
          const isComplete = Boolean(startup.company_name && startup.description)

          setProfileData({
            type: "startup",
            status: startup.status as ProfileStatus,
            startupId: startup.id,
            isComplete,
            isLoading: false,
          })
        } else if (investor) {
          // Check if investor profile is complete
          const isComplete = Boolean(investor.firm_name && investor.description)

          setProfileData({
            type: "investor",
            status: investor.status as ProfileStatus,
            investorId: investor.id,
            isComplete,
            isLoading: false,
          })
        } else {
          setProfileData({
            type: null,
            status: null,
            isComplete: false,
            isLoading: false,
          })
        }
      } catch (error) {
        console.error("Error fetching profile data:", error)
        // Fallback to API route
        await fetchProfileDataFromAPI()
      }
    }

    if (!userLoading && user) {
      fetchProfileData()
    } else if (!userLoading) {
      setProfileData({
        type: null,
        status: null,
        isComplete: false,
        isLoading: false,
      })
    }
  }, [user, userLoading])

  return profileData
}
