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
        // Check if user has admin role
        const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

        if (userData?.role === "admin" || userData?.role === "superadmin") {
          setProfileData({
            type: "admin",
            status: "active",
            isComplete: true,
            isLoading: false,
          })
          return
        }

        // Check if user has a startup profile
        const { data: startup } = await supabase
          .from("startups")
          .select("id, status, company_name, description")
          .eq("user_id", user.id)
          .single()

        // Check if user has an investor profile
        const { data: investor } = await supabase
          .from("investors")
          .select("id, status, firm_name, bio")
          .eq("user_id", user.id)
          .single()

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
          const isComplete = Boolean(investor.firm_name && investor.bio)

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
        setProfileData({
          type: null,
          status: null,
          isComplete: false,
          isLoading: false,
        })
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
