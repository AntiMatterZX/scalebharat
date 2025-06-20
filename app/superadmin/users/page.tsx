"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AdminLayout } from "@/components/layout/admin-layout"
import {
  Users,
  Building2,
  TrendingUp,
  Shield,
  Search,
  MoreHorizontal,
  UserPlus,
  UserMinus,
  Mail,
  Calendar,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
  user_metadata?: any
  role?: string
  startup?: any
  investor?: any
}

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/superadmin/users")
      const data = await response.json()

      if (data.success) {
        setUsers(data.users)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.user_metadata?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.user_metadata?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => {
        if (roleFilter === "startup") return user.startup
        if (roleFilter === "investor") return user.investor
        if (roleFilter === "admin") return user.role === "admin" || user.role === "superadmin"
        if (roleFilter === "regular") return !user.startup && !user.investor && !user.role
        return true
      })
    }

    setFilteredUsers(filtered)
  }

  const assignRole = async (userId: string, role: string) => {
    try {
      const response = await fetch("/api/superadmin/assign-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Role ${role} assigned successfully`,
        })
        loadUsers()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error assigning role:", error)
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      })
    }
  }

  const removeRole = async (userId: string) => {
    try {
      const response = await fetch("/api/superadmin/remove-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Role removed successfully",
        })
        loadUsers()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error removing role:", error)
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      })
    }
  }

  const getUserRole = (user: User) => {
    if (user.role === "superadmin") return "SuperAdmin"
    if (user.role === "admin") return "Admin"
    if (user.startup) return "Startup"
    if (user.investor) return "Investor"
    return "User"
  }

  const getUserRoleBadge = (user: User) => {
    const role = getUserRole(user)
    const variant =
      role === "SuperAdmin"
        ? "destructive"
        : role === "Admin"
          ? "secondary"
          : role === "Startup"
            ? "default"
            : role === "Investor"
              ? "outline"
              : "secondary"

    return <Badge variant={variant}>{role}</Badge>
  }

  if (loading) {
    return (
      <AdminLayout type="superadmin">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout type="superadmin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage all platform users and their roles</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Startups</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.startup).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investors</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.investor).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === "admin" || u.role === "superadmin").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>Search and filter users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="role-filter">Filter by Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="regular">Regular Users</SelectItem>
                    <SelectItem value="startup">Startups</SelectItem>
                    <SelectItem value="investor">Investors</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Users Table */}
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                      {user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.email}</p>
                        {getUserRoleBadge(user)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                        {user.last_sign_in_at && (
                          <span>Last login {new Date(user.last_sign_in_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
                        <Mail className="mr-2 h-4 w-4" />
                        Copy email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => assignRole(user.id, "admin")}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => assignRole(user.id, "superadmin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        Make SuperAdmin
                      </DropdownMenuItem>
                      {(user.role === "admin" || user.role === "superadmin") && (
                        <DropdownMenuItem onClick={() => removeRole(user.id)}>
                          <UserMinus className="mr-2 h-4 w-4" />
                          Remove Admin Role
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
