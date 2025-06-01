"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useUserProfile } from "@/lib/hooks/useUserProfile"
import {
  Building2,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Home,
  TrendingUp,
  Search,
  Bell,
  Calendar,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { type: userType } = useUserProfile()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }

  // Define navigation items based on user type
  const getNavItems = () => {
    const commonItems = [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: Home,
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ]

    if (userType === "startup") {
      return [
        ...commonItems,
        {
          name: "My Startup",
          href: "/startup/profile",
          icon: Building2,
        },
        {
          name: "Investors",
          href: "/startup/investors",
          icon: Users,
        },
        {
          name: "Matches",
          href: "/startup/matches", // Role-specific route
          icon: TrendingUp,
        },
        {
          name: "Messages",
          href: "/startup/messages", // Role-specific route
          icon: MessageSquare,
        },
        {
          name: "Analytics",
          href: "/startup/analytics", // Role-specific route
          icon: BarChart3,
        },
        {
          name: "Meetings",
          href: "/startup/meetings",
          icon: Calendar,
        },
      ]
    } else if (userType === "investor") {
      return [
        ...commonItems,
        {
          name: "My Profile",
          href: "/investor/profile",
          icon: Users,
        },
        {
          name: "Browse Startups",
          href: "/investor/startups",
          icon: Search,
        },
        {
          name: "Matches",
          href: "/investor/matches", // Role-specific route
          icon: TrendingUp,
        },
        {
          name: "Messages",
          href: "/investor/messages", // Role-specific route
          icon: MessageSquare,
        },
        {
          name: "Portfolio",
          href: "/investor/portfolio",
          icon: Building2,
        },
        {
          name: "Meetings",
          href: "/investor/meetings",
          icon: Calendar,
        },
      ]
    } else if (userType === "admin") {
      return [
        ...commonItems,
        {
          name: "Users",
          href: "/admin/users",
          icon: Users,
        },
        {
          name: "Startups",
          href: "/admin/startups",
          icon: Building2,
        },
        {
          name: "Investors",
          href: "/admin/investors",
          icon: TrendingUp,
        },
        {
          name: "Analytics",
          href: "/admin/analytics",
          icon: BarChart3,
        },
        {
          name: "Messages",
          href: "/admin/messages",
          icon: MessageSquare,
        },
      ]
    }

    return commonItems
  }

  const navItems = getNavItems()

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <Link href="/dashboard" className="flex items-center">
              <Building2 className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold">StartupConnect</span>
            </Link>
          </div>
          <div className="flex flex-col flex-grow px-4 mt-5">
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700",
                    )}
                  >
                    <item.icon
                      className={cn("h-5 w-5 mr-3", isActive ? "text-white" : "text-gray-500 dark:text-gray-400")}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
              Sign out
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
                <Link href="/dashboard" className="flex items-center">
                  <Building2 className="h-8 w-8 text-primary mr-2" />
                  <span className="text-xl font-bold">StartupConnect</span>
                </Link>
              </div>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" className="mr-2 relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>
                <div className="ml-3 relative">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {userType === "startup" ? "S" : userType === "investor" ? "I" : "A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
