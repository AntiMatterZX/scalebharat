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
  X,
  Shield,
  Database,
  Mail,
  FileText,
  User,
  Home,
  ChevronDown,
  ChevronRight,
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
// Add back the import for the client-safe function
import { getUserRolesClient } from "@/lib/role-management"
import type { UserRole } from "@/lib/role-management"
import { Card, CardContent } from '@/components/ui/card'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  badge?: number
  children?: NavItem[]
}

interface AdminLayoutProps {
  children: React.ReactNode
  type: "admin" | "superadmin"
}

export function AdminLayout({ children, type }: AdminLayoutProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  // Add back the userRoles state
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Update the useEffect to include loadUserRoles again
  useEffect(() => {
    if (user) {
      Promise.all([loadUserProfile(), loadUserRoles()])
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

  // Add back the loadUserRoles function with the client-safe version
  const loadUserRoles = async () => {
    if (user) {
      try {
        const roles = await getUserRolesClient(user.id)
        setUserRoles(roles)
      } catch (error) {
        console.error("Error loading user roles:", error)
        setUserRoles(["user"])
      }
    }
  }

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  const adminNavItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
      children: [
        {
          title: "Startups",
          href: "/admin/users/startups",
          icon: <Building2 className="h-4 w-4" />,
        },
        {
          title: "Investors",
          href: "/admin/users/investors",
          icon: <User className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Content",
      href: "/admin/content",
      icon: <FileText className="h-5 w-5" />,
      children: [
        {
          title: "Blog Posts",
          href: "/admin/content/blog",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Pages",
          href: "/admin/content/pages",
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Email",
      href: "/admin/email",
      icon: <Mail className="h-5 w-5" />,
      children: [
        {
          title: "Templates",
          href: "/admin/email/templates",
          icon: <Mail className="h-4 w-4" />,
        },
        {
          title: "Campaigns",
          href: "/admin/email/campaigns",
          icon: <Mail className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const superadminNavItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/superadmin/dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Startups",
      href: "/superadmin/startups",
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      title: "User Management",
      href: "/superadmin/users",
      icon: <Users className="h-5 w-5" />,
      children: [
        {
          title: "All Users",
          href: "/superadmin/users/all",
          icon: <Users className="h-4 w-4" />,
        },
        {
          title: "Admins",
          href: "/superadmin/users/admins",
          icon: <Shield className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "System",
      href: "/superadmin/system",
      icon: <Database className="h-5 w-5" />,
      children: [
        {
          title: "Database",
          href: "/superadmin/system/database",
          icon: <Database className="h-4 w-4" />,
        },
        {
          title: "Logs",
          href: "/superadmin/system/logs",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Settings",
          href: "/superadmin/system/settings",
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Email System",
      href: "/superadmin/email",
      icon: <Mail className="h-5 w-5" />,
      children: [
        {
          title: "Templates",
          href: "/superadmin/email/templates",
          icon: <Mail className="h-4 w-4" />,
        },
        {
          title: "Configuration",
          href: "/superadmin/email/config",
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Security",
      href: "/superadmin/security",
      icon: <Shield className="h-5 w-5" />,
    },
  ]

  const navItems = type === "admin" ? adminNavItems : superadminNavItems

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const renderNavItems = (items: NavItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.href}>
        {item.children ? (
          <div className="space-y-1">
            <button
              onClick={() => toggleExpanded(item.title)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
              )}
            >
              <div className="flex items-center">
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </div>
              {expandedItems.includes(item.title) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {expandedItems.includes(item.title) && (
              <div className="pl-8 space-y-1">{renderNavItems(item.children, level + 1)}</div>
            )}
          </div>
        ) : (
          <Link
            href={item.href}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === item.href
                ? "bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-white"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
            )}
          >
            {item.icon}
            <span className="ml-3 flex-1">{item.title}</span>
            {item.badge && (
              <span className="ml-auto inline-flex items-center justify-center h-5 w-5 text-xs font-medium text-white bg-primary rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        )}
      </div>
    ))
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-card dark:bg-card border-r border-border">
          <div className="flex items-center justify-center h-14">
            <Link href={type === "admin" ? "/admin/dashboard" : "/superadmin/dashboard"} className="flex items-center">
              <Shield className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-foreground">
                {type === "admin" ? "Admin Panel" : "SuperAdmin"}
              </span>
            </Link>
          </div>
          <div className="mt-6 flex flex-col flex-1">
            <nav className="flex-1 px-2 space-y-1">{renderNavItems(navItems)}</nav>
            <div className="p-4 mt-6 border-t border-border">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full justify-start text-foreground">
                  <Home className="h-5 w-5 mr-2" />
                  Back to App
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start text-foreground mt-2"
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
          <Link href={type === "admin" ? "/admin/dashboard" : "/superadmin/dashboard"} className="flex items-center">
            <Shield className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
              {type === "admin" ? "Admin Panel" : "SuperAdmin"}
            </span>
          </Link>
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="mt-4 px-2 space-y-1">
          {renderNavItems(navItems)}
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
        <header className="bg-card shadow-sm z-10 border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center md:hidden">
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 flex justify-between px-2 lg:ml-6">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-foreground">
                    {type === "admin" ? "Admin Panel" : "SuperAdmin Panel"}
                  </h1>
                </div>
                <div className="flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center max-w-xs text-sm rounded-full focus:outline-none">
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
                      </button>
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
    </div>
  )
}
