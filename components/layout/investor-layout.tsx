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
  Users,
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
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [investorProfile, setInvestorProfile] = useState<any>(null)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [pendingMatches, setPendingMatches] = useState(0)

  useEffect(() => {
    if (user) {
      loadUserProfile()
      loadInvestorProfile()
      loadNotifications()
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
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Browse Startups",
      href: "/investor/startups",
      icon: <Search className="h-5 w-5" />,
    },
    {
      title: "Matches",
      href: "/investor/matches",
      icon: <Users className="h-5 w-5" />,
      badge: pendingMatches,
    },
    {
      title: "Messages",
      href: "/investor/messages",
      icon: <MessageSquare className="h-5 w-5" />,
      badge: unreadMessages,
    },
    {
      title: "Wishlist",
      href: "/investor/wishlist",
      icon: <Heart className="h-5 w-5" />,
    },
    {
      title: "Portfolio",
      href: "/investor/portfolio",
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      title: "Analytics",
      href: "/investor/analytics",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/investor/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center h-14">
            <Link href="/" className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">StartupConnect</span>
            </Link>
          </div>
          <div className="mt-6 flex flex-col flex-1">
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-blue-50 text-blue-700 dark:bg-gray-700 dark:text-white"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                  )}
                >
                  {item.icon}
                  <span className="ml-3 flex-1">{item.title}</span>
                  {item.badge ? (
                    <Badge variant="default" className="ml-auto bg-blue-600 hover:bg-blue-700">
                      {item.badge}
                    </Badge>
                  ) : null}
                </Link>
              ))}
            </nav>
            <div className="p-4 mt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userProfile?.profile_picture || "/placeholder.svg"} alt={userProfile?.first_name} />
                  <AvatarFallback>
                    {userProfile?.first_name?.[0]}
                    {userProfile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {userProfile?.first_name} {userProfile?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{investorProfile?.firm_name || "Investor"}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start text-gray-700 dark:text-gray-300 mt-4"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out transform md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/" className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">StartupConnect</span>
          </Link>
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="mt-4 px-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                pathname === item.href
                  ? "bg-blue-50 text-blue-700 dark:bg-gray-700 dark:text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
              )}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span className="ml-3 flex-1">{item.title}</span>
              {item.badge ? (
                <Badge variant="default" className="ml-auto bg-blue-600 hover:bg-blue-700">
                  {item.badge}
                </Badge>
              ) : null}
            </Link>
          ))}
          <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userProfile?.profile_picture || "/placeholder.svg"} alt={userProfile?.first_name} />
                <AvatarFallback>
                  {userProfile?.first_name?.[0]}
                  {userProfile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userProfile?.first_name} {userProfile?.last_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{investorProfile?.firm_name || "Investor"}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-gray-700 dark:text-gray-300 mt-4 mx-4"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center md:hidden">
                <button
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 flex justify-between px-2 lg:ml-6">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Investor Dashboard</h1>
                </div>
                <div className="flex items-center space-x-4">
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
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          <span>You have {unreadMessages} unread messages</span>
                        </DropdownMenuItem>
                      )}
                      {pendingMatches > 0 && (
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          <span>You have {pendingMatches} pending matches</span>
                        </DropdownMenuItem>
                      )}
                      {unreadMessages === 0 && pendingMatches === 0 && (
                        <div className="px-2 py-4 text-center text-sm text-gray-500">No new notifications</div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
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
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        {userProfile?.first_name} {userProfile?.last_name}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
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
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
