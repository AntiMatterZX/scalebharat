"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  TrendingUp,
  Calendar,
  Home,
  Rocket,
  Bell,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  badge?: number
}

interface StartupLayoutProps {
  children: React.ReactNode
}

export function StartupLayout({ children }: StartupLayoutProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [startupProfile, setStartupProfile] = useState<any>(null)

  useEffect(() => {
    if (user) {
      Promise.all([loadStartupProfile()])
    }
  }, [user])

  const loadStartupProfile = async () => {
    try {
      const { data } = await supabase
        .from("startups")
        .select("*, users(first_name, last_name, profile_picture)")
        .eq("user_id", user!.id)
        .single()
      setStartupProfile(data)
    } catch (error) {
      console.error("Error loading startup profile:", error)
    }
  }

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/startup/dashboard",
      icon: <Home className="h-4 w-4" />,
    },
    {
      title: "My Startup",
      href: "/startup/profile",
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      title: "Investors",
      href: "/startup/investors",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Matches",
      href: "/startup/matches",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      title: "Meetings",
      href: "/startup/meetings",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      title: "Analytics",
      href: "/startup/analytics",
      icon: <BarChart3 className="h-4 w-4" />,
    },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Top Header - Theme Aware */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-300">
        
        {/* Enhanced Navigation Tabs */}
        <div className="border-b border-border">
          <div className="px-2 sm:px-4 lg:px-6 xl:px-8">
            <div className="overflow-x-auto scrollbar-hide pb-2 pt-2">
              <div className="inline-flex h-12 items-center justify-start rounded-xl bg-muted/50 p-1 text-muted-foreground gap-1 min-w-fit">
                {navItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-w-fit relative",
                      pathname === item.href
                        ? "bg-background text-foreground shadow-md"
                        : "hover:bg-background/50 hover:text-foreground"
                    )}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="ml-1.5 sm:ml-2 hidden sm:inline">{item.title}</span>
                    <span className="ml-1.5 sm:hidden">{item.title.split(' ')[0]}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 ml-1 sm:ml-2 text-xs font-medium text-primary-foreground bg-primary rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
                {/* Settings Tab */}
                <Link
                  href="/startup/settings"
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-w-fit",
                    pathname === "/startup/settings"
                      ? "bg-background text-foreground shadow-md"
                      : "hover:bg-background/50 hover:text-foreground"
                  )}
                >
                  <span className="flex-shrink-0"><Settings className="h-4 w-4" /></span>
                  <span className="ml-1.5 sm:ml-2 hidden sm:inline">Settings</span>
                  <span className="ml-1.5 sm:hidden">Set</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="w-full max-w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <div className="max-w-[1920px] mx-auto">
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden transition-colors duration-300">
              <div className="p-3 sm:p-4 md:p-6 lg:p-8">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}