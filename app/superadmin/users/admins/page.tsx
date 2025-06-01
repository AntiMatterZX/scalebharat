"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Shield, Users, UserMinus, Mail, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface AdminUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
  role: string
}

export default function SuperAdminAdmins() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      const response = await fetch("/api/superadmin/admins")
      const data = await response.json()

      if (data.success) {
        setAdmins(data.admins)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error loading admins:", error)
      toast({
        title: "Error",
        description: "Failed to load admin users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeAdminRole = async (userId: string) => {
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
          description: "Admin role removed successfully",
        })
        loadAdmins()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error removing admin role:", error)
      toast({
        title: "Error",
        description: "Failed to remove admin role",
        variant: "destructive",
      })
    }
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
          <h1 className="text-2xl font-bold tracking-tight">Admin Users</h1>
          <p className="text-muted-foreground">Manage users with administrative privileges</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{admins.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SuperAdmins</CardTitle>
              <Shield className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{admins.filter((a) => a.role === "superadmin").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regular Admins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{admins.filter((a) => a.role === "admin").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin List */}
        <Card>
          <CardHeader>
            <CardTitle>Administrative Users</CardTitle>
            <CardDescription>Users with admin or superadmin privileges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                      {admin.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{admin.email}</p>
                        <Badge variant={admin.role === "superadmin" ? "destructive" : "secondary"}>
                          {admin.role === "superadmin" ? "SuperAdmin" : "Admin"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {new Date(admin.created_at).toLocaleDateString()}
                        </span>
                        {admin.last_sign_in_at && (
                          <span>Last login {new Date(admin.last_sign_in_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(admin.email)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Copy Email
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => removeAdminRole(admin.id)}>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove Role
                    </Button>
                  </div>
                </div>
              ))}

              {admins.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No admin users found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
