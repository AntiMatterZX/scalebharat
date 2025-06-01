"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting session:", error)
      }
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)
      setUser(session?.user ?? null)
      setLoading(false)

      // If user just signed up, ensure profile exists
      if (event === "SIGNED_UP" && session?.user) {
        // Give the trigger time to create the profile
        setTimeout(async () => {
          const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single()

          if (!profile) {
            console.log("Creating missing user profile...")
            await supabase.from("users").insert({
              id: session.user.id,
              email: session.user.email || "",
              first_name: session.user.user_metadata?.first_name || "",
              last_name: session.user.user_metadata?.last_name || "",
            })
          }
        }, 2000)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
