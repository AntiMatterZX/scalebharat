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
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "My Startup",
      href: "/startup/profile",
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      title: "Investors",
      href: "/startup/investors",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Matches",
      href: "/startup/matches",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      title: "Messages",
      href: "/startup/messages",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "Meetings",
      href: "/startup/meetings",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Funding",
      href: "/startup/funding",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: "Analytics",
      href: "/startup/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Documents",
      href: "/startup/documents",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/startup/settings",
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
            <Link href="/startup/dashboard" className="flex items-center">
              <Rocket className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Startup Panel</span>
            </Link>
          </div>
          <div className="mt-6 flex flex-col flex-1">
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-white"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                  )}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto inline-flex items-center justify-center h-5 w-5 text-xs font-medium text-white bg-primary rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="p-4 mt-6 border-t border-gray-200 dark:border-gray-700">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full justify-start text-gray-700 dark:text-gray-300">
                  <Home className="h-5 w-5 mr-2" />
                  Back to App
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start text-gray-700 dark:text-gray-300 mt-2"
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
          <Link href="/startup/dashboard" className="flex items-center">
            <Rocket className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Startup Panel</span>
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
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                pathname === item.href
                  ? "bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
              )}
            >
              {item.icon}
              <span className="ml-3">{item.title}</span>
              {item.badge && (
                <span className="ml-auto inline-flex items-center justify-center h-5 w-5 text-xs font-medium text-white bg-primary rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-start text-gray-700 dark:text-gray-300">
                <Home className="h-5 w-5 mr-2" />
                Back to App
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full justify-start text-gray-700 dark:text-gray-300 mt-2"
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
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {startupProfile?.company_name || "Startup Dashboard"}
                  </h1>
                </div>
                <div className="flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center max-w-xs text-sm rounded-full focus:outline-none">
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
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{startupProfile?.company_name || "Your Startup"}</DropdownMenuLabel>
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
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
