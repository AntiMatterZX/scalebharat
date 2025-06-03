"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/error-boundary"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
  refreshUser: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Re-export useTheme from next-themes for convenience
export { useTheme } from "next-themes"

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
      setError(errorMessage)
      console.error("Sign out error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      setUser(session?.user ?? null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh user'
      setError(errorMessage)
      console.error("Refresh user error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const ensureUserProfile = useCallback(async (user: User) => {
    try {
      // Check if profile exists with a more efficient query
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log("Creating user profile for:", user.id)
        const { error: insertError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email || "",
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          created_at: new Date().toISOString(),
        })
        
        if (insertError) {
          console.error("Error creating user profile:", insertError)
        }
      }
    } catch (err) {
      console.error("Error ensuring user profile:", err)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        setError(null)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }

        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize auth'
          setError(errorMessage)
          setLoading(false)
          console.error("Auth initialization error:", err)
        }
      }
    }

    // Initialize auth
    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event, session?.user?.id)
      
      try {
        setError(null)
        setUser(session?.user ?? null)

        // Handle sign up event
        if (event === "SIGNED_IN" && session?.user) {
          await ensureUserProfile(session.user)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Auth state change error'
        setError(errorMessage)
        console.error("Auth state change error:", err)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [ensureUserProfile])

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      signOut,
      refreshUser,
    }),
    [user, loading, error, signOut, refreshUser]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem 
        disableTransitionOnChange={false}
        storageKey="startup-connect-theme"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
