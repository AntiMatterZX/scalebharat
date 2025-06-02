"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Calendar,
  Home,
  FileText,
  DollarSign,
  Rocket,
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
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

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
      loadStartupProfile()
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
      title: "Messages",
      href: "/startup/messages",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      title: "Meetings",
      href: "/startup/meetings",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      title: "Funding",
      href: "/startup/funding",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "Analytics",
      href: "/startup/analytics",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      title: "Documents",
      href: "/startup/documents",
      icon: <FileText className="h-4 w-4" />,
    },
  ]

  const settingsItem: NavItem = {
    title: "Settings",
    href: "/startup/settings",
    icon: <Settings className="h-4 w-4" />,
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between h-16">
            {/* Horizontal Scrollable Navigation */}
            <div className="flex-1 flex overflow-x-auto scrollbar-hide mx-4">
              <nav className="flex space-x-1 px-1">
                {navItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                      pathname === item.href
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {item.title}
                    {item.badge && (
                      <span className="ml-2 inline-flex items-center justify-center h-5 w-5 text-xs font-medium text-primary-foreground bg-primary rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right section - Settings and Profile */}
            <div className="flex items-center space-x-4">
              {/* Settings Link */}
              <Link
                href={settingsItem.href}
                className={cn(
                  "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
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
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={startupProfile?.users?.profile_picture || "/placeholder.svg"}
                        alt={startupProfile?.users?.first_name}
                      />
                      <AvatarFallback>
                        {startupProfile?.users?.first_name?.[0]}
                        {startupProfile?.users?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {startupProfile?.company_name || "Your Startup"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {startupProfile?.users?.first_name} {startupProfile?.users?.last_name}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/startup/profile">
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>Startup Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/startup/settings">
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
      </header>

      {/* Main content */}
      <main className="container mx-auto py-6 px-4 sm:px-6">
        {children}
      </main>
    </div>
  )
}