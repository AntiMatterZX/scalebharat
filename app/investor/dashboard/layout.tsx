"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  TrendingUp,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  Search,
  Users,
  MessageSquare,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth()
  const [investorProfile, setInvestorProfile] = useState<any>(null)
  const [pendingMatches, setPendingMatches] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (user) {
      loadInvestorProfile()
      loadNotifications()
    }
  }, [user])

  const loadInvestorProfile = async () => {
    try {
      const { data } = await supabase
        .from("investors")
        .select("*, users(first_name, last_name, profile_picture)")
        .eq("user_id", user!.id)
        .single()
      setInvestorProfile(data)
    } catch (error) {
      console.error("Error loading investor profile:", error)
    }
  }

  const loadNotifications = async () => {
    try {
      // Placeholder for loading notifications
      setPendingMatches(0)
      setUnreadMessages(0)
    } catch (error) {
      console.error("Error loading notifications:", error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Main Navbar Only */}
      

      {/* Main Content */}
      <main className="w-full">
        {children}
      </main>
    </div>
  )
} 