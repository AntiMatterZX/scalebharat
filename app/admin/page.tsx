"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { Building2, Users, TrendingUp, Shield, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

interface AdminStats {
  totalUsers: number
  totalStartups: number
  totalInvestors: number
  totalMatches: number
  pendingVerifications: number
  recentActivity: any[]
}

export default function AdminPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pendingStartups, setPendingStartups] = useState<any[]>([])
  const [pendingInvestors, setPendingInvestors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadAdminData()
    }
  }, [user])

  const loadAdminData = async () => {
    try {
      // Load stats
      const [
        { count: totalUsers },
        { count: totalStartups },
        { count: totalInvestors },
        { count: totalMatches },
        { data: pendingStartupsData },
        { data: pendingInvestorsData },
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("startups").select("*", { count: "exact", head: true }),
        supabase.from("investors").select("*", { count: "exact", head: true }),
        supabase.from("matches").select("*", { count: "exact", head: true }),
        supabase
          .from("startups")
          .select(`
            *,
            users (first_name, last_name, email)
          `)
          .eq("status", "pending_approval") // Changed from is_verified and status published
          .order("created_at", { ascending: false }),
        supabase
          .from("investors")
          .select(`
            *,
            users (first_name, last_name, email)
          `)
          .eq("is_verified", false)
          .eq("status", "active")
          .order("created_at", { ascending: false }),
      ])

      setStats({
        totalUsers: totalUsers || 0,
        totalStartups: totalStartups || 0,
        totalInvestors: totalInvestors || 0,
        totalMatches: totalMatches || 0,
        pendingVerifications: (pendingStartupsData?.length || 0) + (pendingInvestorsData?.length || 0),
        recentActivity: [],
      })

      setPendingStartups(pendingStartupsData || [])
      setPendingInvestors(pendingInvestorsData || [])
    } catch (error) {
      console.error("Error loading admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartupApproval = async (startupId: string, newStatus: "published" | "draft" | "suspended") => {
    try {
      const { error } = await supabase
        .from("startups")
        .update({ status: newStatus, is_verified: newStatus === "published" }) // Also set is_verified on approval
        .eq("id", startupId)

      if (!error) {
        loadAdminData() // Refresh data
        toast({
          title: `Startup ${newStatus === "published" ? "Approved" : "Status Updated"}`,
          description: `Startup status changed to ${newStatus}.`,
        })
      } else {
        throw error
      }
    } catch (error) {
      console.error("Error updating startup status:", error)
      toast({
        title: "Error",
        description: "Failed to update startup status.",
        variant: "destructive",
      })
    }
  }

  const verifyInvestor = async (investorId: string, verified: boolean) => {
    try {
      const { error } = await supabase.from("investors").update({ is_verified: verified }).eq("id", investorId)

      if (!error) {
        loadAdminData()
      }
    } catch (error) {
      console.error("Error verifying investor:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">StartupConnect Admin</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage platform users, content, and analytics</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Startups</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStartups}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Investors</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInvestors}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Tabs */}
        <Tabs defaultValue="verifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="verifications" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pending Startups */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Startup Approvals</CardTitle>
                  <CardDescription>Review and approve or reject startup submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingStartups.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No pending startup verifications</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingStartups.map((startup) => (
                        <div key={startup.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-medium">{startup.company_name}</h3>
                              <p className="text-sm text-gray-600">
                                {startup.users.first_name} {startup.users.last_name}
                              </p>
                              <p className="text-xs text-gray-500">{startup.users.email}</p>
                            </div>
                            <Badge variant="outline">{startup.stage}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {startup.tagline || startup.description}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleStartupApproval(startup.id, "published")}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartupApproval(startup.id, "draft")} // Or 'suspended' or a new 'rejected' status
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject (Set to Draft)
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Investors */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Investor Verifications</CardTitle>
                  <CardDescription>Review and verify investor profiles</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingInvestors.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No pending investor verifications</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingInvestors.map((investor) => (
                        <div key={investor.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-medium">
                                {investor.firm_name || `${investor.users.first_name} ${investor.users.last_name}`}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {investor.users.first_name} {investor.users.last_name}
                              </p>
                              <p className="text-xs text-gray-500">{investor.users.email}</p>
                            </div>
                            <Badge variant="outline">{investor.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{investor.bio}</p>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => verifyInvestor(investor.id, true)} className="flex-1">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => verifyInvestor(investor.id, false)}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage platform users and their access</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">User management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>View platform performance and usage metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
