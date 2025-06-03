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
          <div className="px-4 sm:px-6">
            <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
              {navItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-w-fit",
                    pathname === item.href
                      ? "text-foreground border-primary bg-accent/50"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground hover:bg-accent/30"
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="text-sm">{item.title}</span>
                  {item.badge && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium text-primary-foreground bg-primary rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
              {/* Settings Tab */}
              <Link
                href="/startup/settings"
                className={cn(
                  "flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-w-fit",
                  pathname === "/startup/settings"
                    ? "text-foreground border-primary bg-accent/50"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground hover:bg-accent/30"
                )}
              >
                <span className="flex-shrink-0"><Settings className="h-4 w-4" /></span>
                <span className="text-sm">Settings</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden transition-colors duration-300">
            <div className="p-6 sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}