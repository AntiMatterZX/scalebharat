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
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border transition-colors duration-300">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <Link href="/investor/dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg text-foreground hidden sm:block">StartupConnect</span>
                  </Link>

            {/* Right: Profile and Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle variant="ghost" size="sm" />
              
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                {(pendingMatches + unreadMessages) > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
                )}
              </Button>
              
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 h-9 px-3">
                    <Avatar className="h-7 w-7 border border-border">
                      <AvatarImage
                        src={investorProfile?.users?.profile_picture || user?.user_metadata?.profile_picture} 
                        alt={`${investorProfile?.users?.first_name} ${investorProfile?.users?.last_name}` || user?.email} 
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {investorProfile?.users?.first_name?.[0] || user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-medium text-foreground">
                        {investorProfile?.users ? 
                          `${investorProfile.users.first_name} ${investorProfile.users.last_name}` : 
                          user?.user_metadata?.full_name || 'User'
                        }
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {investorProfile?.firm_name || 'Investor'}
                    </span>
                    </div>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {investorProfile?.users ? 
                          `${investorProfile.users.first_name} ${investorProfile.users.last_name}` : 
                          user?.user_metadata?.full_name || 'User'
                        }
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <p className="text-xs leading-none text-primary font-medium">
                        {investorProfile?.firm_name || 'Investor'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link href="/investor/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/investor/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            </div>
          </div>

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
                  {item.badge && item.badge > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium text-primary-foreground bg-primary rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
              {/* Settings Tab */}
              <Link
                href={settingsItem.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-w-fit",
                  pathname === settingsItem.href
                    ? "text-foreground border-primary bg-accent/50"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground hover:bg-accent/30"
                )}
              >
                <span className="flex-shrink-0">{settingsItem.icon}</span>
                <span className="text-sm">{settingsItem.title}</span>
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