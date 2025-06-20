"use client"

import { SelectItem } from "@/components/ui/select"

import { SelectContent } from "@/components/ui/select"

import { SelectValue } from "@/components/ui/select"

import { SelectTrigger } from "@/components/ui/select"

import { Select } from "@/components/ui/select"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AlertTriangle, CheckCircle, BarChart3, Activity, Database, Shield, Server, Cpu, HardDrive } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts"
import Link from "next/link"

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStartups: 0,
    totalInvestors: 0,
    totalAdmins: 0,
    systemHealth: 100,
    databaseSize: 0,
    apiRequests: 0,
    errorRate: 0,
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
        totalAdmins: 5,
        systemHealth: 98.7,
        databaseSize: 1.2, // GB
        apiRequests: 25430,
        errorRate: 0.3,
      })
      setLoading(false)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setLoading(false)
    }
  }

  // Mock data for charts
  const systemMetricsData = [
    { time: "00:00", cpu: 30, memory: 40, disk: 20 },
    { time: "03:00", cpu: 25, memory: 38, disk: 20 },
    { time: "06:00", cpu: 20, memory: 35, disk: 21 },
    { time: "09:00", cpu: 45, memory: 50, disk: 21 },
    { time: "12:00", cpu: 60, memory: 55, disk: 22 },
    { time: "15:00", cpu: 75, memory: 62, disk: 22 },
    { time: "18:00", cpu: 50, memory: 58, disk: 23 },
    { time: "21:00", cpu: 40, memory: 45, disk: 23 },
    { time: "24:00", cpu: 30, memory: 40, disk: 24 },
  ]

  const apiRequestsData = [
    { date: "2023-01", requests: 15000 },
    { date: "2023-02", requests: 17000 },
    { date: "2023-03", requests: 18500 },
    { date: "2023-04", requests: 20000 },
    { date: "2023-05", requests: 22000 },
    { date: "2023-06", requests: 24000 },
    { date: "2023-07", requests: 25430 },
  ]

  const userRolesData = [
    { name: "Regular Users", value: stats.totalUsers - stats.totalStartups - stats.totalInvestors - stats.totalAdmins },
    { name: "Startups", value: stats.totalStartups },
    { name: "Investors", value: stats.totalInvestors },
    { name: "Admins", value: stats.totalAdmins },
  ]

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  const recentLogsData = [
    {
      id: 1,
      level: "error",
      message: "Failed to connect to payment gateway",
      time: "2 hours ago",
      service: "Payment Service",
    },
    { id: 2, level: "warn", message: "High memory usage detected", time: "3 hours ago", service: "API Server" },
    {
      id: 3,
      level: "info",
      message: "Database backup completed successfully",
      time: "5 hours ago",
      service: "Backup Service",
    },
    {
      id: 4,
      level: "error",
      message: "Email delivery failed for user id: 12345",
      time: "6 hours ago",
      service: "Email Service",
    },
    { id: 5, level: "info", message: "System update completed", time: "8 hours ago", service: "Update Service" },
  ]

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
          <h1 className="text-2xl font-bold tracking-tight">SuperAdmin Dashboard</h1>
          <p className="text-muted-foreground">System monitoring and advanced administration</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.systemHealth.toFixed(1)}%</div>
              <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${stats.systemHealth > 95 ? "bg-green-500" : stats.systemHealth > 90 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${stats.systemHealth}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Size</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.databaseSize.toFixed(1)} GB</div>
              <p className="text-xs text-muted-foreground">20% free space remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Requests (24h)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.apiRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12% from yesterday</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${stats.errorRate < 1 ? "text-green-500" : "text-amber-500"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.errorRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.errorRate < 1 ? "Within acceptable range" : "Above threshold"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="system" className="space-y-4">
          <TabsList>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="system" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>System Metrics</CardTitle>
                  <CardDescription>CPU, Memory, and Disk usage over time</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={systemMetricsData}
                        margin={{
                          top: 5,
                          right: 10,
                          left: 10,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="cpu" stackId="1" stroke="#8884d8" fill="#8884d8" />
                        <Area type="monotone" dataKey="memory" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                        <Area type="monotone" dataKey="disk" stackId="3" stroke="#ffc658" fill="#ffc658" />
                        <Legend />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>API Requests</CardTitle>
                  <CardDescription>Monthly API request volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={apiRequestsData}
                        margin={{
                          top: 5,
                          right: 10,
                          left: 10,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="requests" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current status of all services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-1/3">
                        <p className="text-sm font-medium">API Server</p>
                      </div>
                      <div className="w-1/3">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                          <p className="text-sm">Operational</p>
                        </div>
                      </div>
                      <div className="w-1/3">
                        <p className="text-sm text-muted-foreground">Last checked: 2 min ago</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1/3">
                        <p className="text-sm font-medium">Database</p>
                      </div>
                      <div className="w-1/3">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                          <p className="text-sm">Operational</p>
                        </div>
                      </div>
                      <div className="w-1/3">
                        <p className="text-sm text-muted-foreground">Last checked: 2 min ago</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1/3">
                        <p className="text-sm font-medium">Email Service</p>
                      </div>
                      <div className="w-1/3">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                          <p className="text-sm">Degraded</p>
                        </div>
                      </div>
                      <div className="w-1/3">
                        <p className="text-sm text-muted-foreground">Last checked: 5 min ago</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1/3">
                        <p className="text-sm font-medium">Storage</p>
                      </div>
                      <div className="w-1/3">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                          <p className="text-sm">Operational</p>
                        </div>
                      </div>
                      <div className="w-1/3">
                        <p className="text-sm text-muted-foreground">Last checked: 2 min ago</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1/3">
                        <p className="text-sm font-medium">Payment Gateway</p>
                      </div>
                      <div className="w-1/3">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                          <p className="text-sm">Outage</p>
                        </div>
                      </div>
                      <div className="w-1/3">
                        <p className="text-sm text-muted-foreground">Last checked: 2 min ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>System maintenance tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button className="w-full justify-start" variant="outline">
                      <Database className="mr-2 h-4 w-4" />
                      Backup Database
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <HardDrive className="mr-2 h-4 w-4" />
                      Clear Cache
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Shield className="mr-2 h-4 w-4" />
                      Security Scan
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Cpu className="mr-2 h-4 w-4" />
                      Restart Services
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Generate Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Breakdown of users by role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userRolesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userRolesData.map((entry, index) => (
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
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Users</CardTitle>
                  <CardDescription>Users with administrative privileges</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-1/2">
                        <p className="text-sm font-medium">John Smith</p>
                        <p className="text-xs text-muted-foreground">john@example.com</p>
                      </div>
                      <div className="w-1/4">
                        <Badge>Admin</Badge>
                      </div>
                      <div className="w-1/4 flex justify-end">
                        <Button size="sm" variant="outline">
                          Manage
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1/2">
                        <p className="text-sm font-medium">Sarah Johnson</p>
                        <p className="text-xs text-muted-foreground">sarah@example.com</p>
                      </div>
                      <div className="w-1/4">
                        <Badge>SuperAdmin</Badge>
                      </div>
                      <div className="w-1/4 flex justify-end">
                        <Button size="sm" variant="outline">
                          Manage
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1/2">
                        <p className="text-sm font-medium">Michael Brown</p>
                        <p className="text-xs text-muted-foreground">michael@example.com</p>
                      </div>
                      <div className="w-1/4">
                        <Badge>Admin</Badge>
                      </div>
                      <div className="w-1/4 flex justify-end">
                        <Button size="sm" variant="outline">
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link href="/superadmin/users/admins">
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Add or modify user roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">User Email</Label>
                        <Input id="email" placeholder="user@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select>
                          <SelectTrigger id="role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="superadmin">SuperAdmin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button className="w-full">Assign Role</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>Recent system events and errors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentLogsData.map((log) => (
                    <div key={log.id} className="flex">
                      <div
                        className={`mr-4 flex h-10 w-10 items-center justify-center rounded-full ${
                          log.level === "error"
                            ? "bg-red-100 text-red-600"
                            : log.level === "warn"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {log.level === "error" && <AlertTriangle className="h-5 w-5" />}
                        {log.level === "warn" && <AlertTriangle className="h-5 w-5" />}
                        {log.level === "info" && <CheckCircle className="h-5 w-5" />}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium leading-none">{log.service}</p>
                          <p className="text-xs text-muted-foreground">{log.time}</p>
                        </div>
                        <p className="text-sm">{log.message}</p>
                        <p
                          className={`text-xs ${
                            log.level === "error"
                              ? "text-red-600"
                              : log.level === "warn"
                                ? "text-yellow-600"
                                : "text-blue-600"
                          }`}
                        >
                          {log.level.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href="/superadmin/system/logs">
                    <Button variant="outline" size="sm">
                      View All Logs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
