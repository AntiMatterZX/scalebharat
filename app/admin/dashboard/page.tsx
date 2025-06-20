"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Users, Building2, TrendingUp, Mail, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import Link from "next/link"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStartups: 0,
    totalInvestors: 0,
    pendingVerifications: 0,
    recentSignups: 0,
    activeMatches: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // In a real app, these would be separate queries to the database
      // For demo purposes, we're using mock data
      setStats({
        totalUsers: 1250,
        totalStartups: 450,
        totalInvestors: 180,
        pendingVerifications: 24,
        recentSignups: 37,
        activeMatches: 320,
      })
      setLoading(false)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setLoading(false)
    }
  }

  // Mock data for charts
  const userGrowthData = [
    { month: "Jan", users: 100 },
    { month: "Feb", users: 180 },
    { month: "Mar", users: 280 },
    { month: "Apr", users: 420 },
    { month: "May", users: 650 },
    { month: "Jun", users: 850 },
    { month: "Jul", users: 1050 },
    { month: "Aug", users: 1250 },
  ]

  const userTypeData = [
    { name: "Startups", value: stats.totalStartups },
    { name: "Investors", value: stats.totalInvestors },
    { name: "Regular Users", value: stats.totalUsers - stats.totalStartups - stats.totalInvestors },
  ]

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  const recentActivityData = [
    { id: 1, type: "signup", user: "John Doe", time: "2 hours ago", action: "Signed up as a startup" },
    { id: 2, type: "verification", user: "Acme Inc", time: "3 hours ago", action: "Requested verification" },
    { id: 3, type: "match", user: "TechFund", time: "5 hours ago", action: "Matched with 3 startups" },
    { id: 4, type: "signup", user: "Jane Smith", time: "6 hours ago", action: "Signed up as an investor" },
    { id: 5, type: "verification", user: "GrowthCap", time: "8 hours ago", action: "Requested verification" },
  ]

  if (loading) {
    return (
      <AdminLayout type="admin">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout type="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of platform statistics and recent activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+{stats.recentSignups} new users this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Startups</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStartups.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.totalStartups / stats.totalUsers) * 100)}% of total users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investors</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvestors.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.totalInvestors / stats.totalUsers) * 100)}% of total users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
              <p className="text-xs text-muted-foreground">Requires your attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>New user registrations over time</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={userGrowthData}
                        margin={{
                          top: 5,
                          right: 10,
                          left: 10,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                  <CardDescription>Breakdown by user type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {userTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Pending Verifications</CardTitle>
                  <CardDescription>Users waiting for verification</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-2/5">
                        <p className="text-sm font-medium">Acme Startup</p>
                        <p className="text-xs text-muted-foreground">Requested 2 days ago</p>
                      </div>
                      <div className="w-2/5">
                        <p className="text-sm">Technology, SaaS</p>
                        <p className="text-xs text-muted-foreground">Early Stage</p>
                      </div>
                      <div className="w-1/5 flex justify-end space-x-2">
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2/5">
                        <p className="text-sm font-medium">Growth Capital</p>
                        <p className="text-xs text-muted-foreground">Requested 3 days ago</p>
                      </div>
                      <div className="w-2/5">
                        <p className="text-sm">Venture Capital</p>
                        <p className="text-xs text-muted-foreground">Series A, B</p>
                      </div>
                      <div className="w-1/5 flex justify-end space-x-2">
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2/5">
                        <p className="text-sm font-medium">TechFund</p>
                        <p className="text-xs text-muted-foreground">Requested 4 days ago</p>
                      </div>
                      <div className="w-2/5">
                        <p className="text-sm">Angel Investor</p>
                        <p className="text-xs text-muted-foreground">Seed, Pre-seed</p>
                      </div>
                      <div className="w-1/5 flex justify-end space-x-2">
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link href="/admin/verifications">
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Newsletter
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Building2 className="mr-2 h-4 w-4" />
                      Review Startups
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Review Investors
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>Detailed metrics and performance data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium mb-2">User Engagement</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: "Profile Views", value: 4000 },
                            { name: "Messages Sent", value: 3000 },
                            { name: "Matches Made", value: 2000 },
                            { name: "Meetings Scheduled", value: 1000 },
                            { name: "Deals Closed", value: 500 },
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Conversion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">24.8%</div>
                        <p className="text-xs text-muted-foreground">+2.5% from last month</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Avg. Session Duration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">8m 42s</div>
                        <p className="text-xs text-muted-foreground">+1m 12s from last month</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Bounce Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">32.1%</div>
                        <p className="text-xs text-muted-foreground">-3.4% from last month</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {recentActivityData.map((activity) => (
                    <div key={activity.id} className="flex">
                      <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {activity.type === "signup" && <Users className="h-5 w-5" />}
                        {activity.type === "verification" && <CheckCircle className="h-5 w-5" />}
                        {activity.type === "match" && <TrendingUp className="h-5 w-5" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{activity.user}</p>
                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
