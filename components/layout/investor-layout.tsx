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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [investorProfile, setInvestorProfile] = useState<any>(null)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [pendingMatches, setPendingMatches] = useState(0)

  useEffect(() => {
    if (user) {
      Promise.all([loadUserProfile(), loadInvestorProfile(), loadNotifications()])
    }
  }, [user])

  const loadUserProfile = async () => {
    try {
      const { data } = await supabase.from("users").select("*").eq("id", user!.id).single()
      setUserProfile(data)
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
  }

  const loadInvestorProfile = async () => {
    try {
      const { data } = await supabase.from("investors").select("*").eq("user_id", user!.id).single()
      setInvestorProfile(data)
    } catch (error) {
      console.error("Error loading investor profile:", error)
    }
  }

  const loadNotifications = async () => {
    try {
      // Load unread messages count
      const { count: messagesCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user!.id)
        .eq("is_read", false)

      setUnreadMessages(messagesCount || 0)

      // Load pending matches count
      if (investorProfile) {
        const { count: matchesCount } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("investor_id", investorProfile.id)
          .eq("status", "pending")

        setPendingMatches(matchesCount || 0)
      }
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border">
          <div className="flex items-center justify-between h-16">
            {/* Left section - Logo and Desktop Nav */}
            <div className="flex-1 flex overflow-x-auto scrollbar-hide mx-4">
              
              {/* Desktop Navigation */}
              <nav className="flex space-x-1 px-1">
                {navItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group",
                      pathname === item.href
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center h-5 w-5 text-xs font-medium text-primary-foreground bg-primary rounded-full">
                        {item.badge}
                      </span>
                    )}
                    <ArrowRight className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right section - Settings, Notifications and Profile */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {(unreadMessages > 0 || pendingMatches > 0) && (
                      <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-600"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {unreadMessages > 0 && (
                    <DropdownMenuItem asChild>
                      <Link href="/investor/messages" className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>You have {unreadMessages} unread messages</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {pendingMatches > 0 && (
                    <DropdownMenuItem asChild>
                      <Link href="/investor/matches" className="w-full">
                        <UsersIcon className="mr-2 h-4 w-4" />
                        <span>You have {pendingMatches} pending matches</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {unreadMessages === 0 && pendingMatches === 0 && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No new notifications
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings Link - Desktop */}
              <Link
                href={settingsItem.href}
                className={cn(
                  "hidden md:inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === settingsItem.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Settings className="h-4 w-4" />
              </Link>
              
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={userProfile?.profile_picture || "/placeholder.svg"}
                        alt={userProfile?.first_name}
                      />
                      <AvatarFallback>
                        {userProfile?.first_name?.[0]}
                        {userProfile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-flex items-center">
                      <span className="ml-2 text-sm font-medium">
                        {userProfile?.first_name}
                      </span>
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userProfile?.first_name} {userProfile?.last_name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {investorProfile?.firm_name || "Investor"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/investor/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/investor/settings">
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

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1 px-4 border-t">
              {[...navItems, settingsItem].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center h-5 w-5 text-xs font-medium text-primary-foreground bg-primary rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
              
              <Button
                variant="ghost"
                className="w-full justify-start mt-2 text-muted-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-6">
          <Card>
            <CardContent className="p-6">
              {children}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}