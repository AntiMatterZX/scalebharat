"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Search,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  Briefcase,
  PieChart,
  Users as UsersIcon,
  Heart,
  ChevronDown,
  ArrowRight,
  TrendingUp,
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
import { cn } from "@/lib/utils"
import { Card, CardContent } from '@/components/ui/card'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  badge?: number
}

interface InvestorLayoutProps {
  children: React.ReactNode
}

export function InvestorLayout({ children }: InvestorLayoutProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [investorProfile, setInvestorProfile] = useState<any>(null)
  const [pendingMatches, setPendingMatches] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (user) {
      Promise.all([loadInvestorProfile(), loadNotifications()])
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

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/investor/dashboard",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      title: "Browse Startups",
      href: "/investor/startups",
      icon: <Search className="h-4 w-4" />,
    },
    {
      title: "Matches",
      href: "/investor/matches",
      icon: <UsersIcon className="h-4 w-4" />,
      badge: pendingMatches,
    },
    {
      title: "Messages",
      href: "/investor/messages",
      icon: <MessageSquare className="h-4 w-4" />,
      badge: unreadMessages,
    },
    {
      title: "Wishlist",
      href: "/investor/wishlist",
      icon: <Heart className="h-4 w-4" />,
    },
    {
      title: "Portfolio",
      href: "/investor/portfolio",
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      title: "Analytics",
      href: "/investor/analytics",
      icon: <PieChart className="h-4 w-4" />,
    },
  ]

  const settingsItem: NavItem = {
    title: "Settings",
    href: "/investor/settings",
    icon: <Settings className="h-4 w-4" />,
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Top Navigation */}
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
                    <span className="hidden sm:inline ml-1.5 sm:ml-2">{item.title}</span>
                    <span className="sm:hidden ml-1.5">
                      {item.title === "Browse Startups" ? "Browse" : item.title.split(' ')[0]}
                    </span>
                    {item.badge && item.badge > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 ml-1 sm:ml-2 text-xs font-medium text-primary-foreground bg-primary rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
                {/* Settings Tab */}
                <Link
                  href={settingsItem.href}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-w-fit",
                    pathname === settingsItem.href
                      ? "bg-background text-foreground shadow-md"
                      : "hover:bg-background/50 hover:text-foreground"
                  )}
                >
                  <span className="flex-shrink-0">{settingsItem.icon}</span>
                  <span className="hidden sm:inline ml-1.5 sm:ml-2">{settingsItem.title}</span>
                  <span className="sm:hidden ml-1.5">Settings</span>
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