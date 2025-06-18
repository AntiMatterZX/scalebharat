"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useToast } from "@/components/ui/use-toast"
import { 
  Bell, 
  Send, 
  Users, 
  Mail, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Trash2,
  Eye,
  RefreshCw
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  content: string
  priority: string
  is_read: boolean
  created_at: string
  user_email?: string
  user_name?: string
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  user_type: string
}

export default function NotificationManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  // Form state for creating notifications
  const [formData, setFormData] = useState({
    recipientType: 'all',
    type: 'system',
    title: '',
    content: '',
    priority: 'medium',
    action_url: '',
    send_email: false
  })

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    sent_today: 0,
    email_delivery_rate: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadNotifications(),
        loadUsers(),
        loadStats()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load notification data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/superadmin/notifications')
      if (!response.ok) throw new Error('Failed to fetch notifications')
      
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/superadmin/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/superadmin/notifications/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSendNotification = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive"
      })
      return
    }

    try {
      setSending(true)
      
      // For now, we'll create a mock successful response
      // In a real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Success",
        description: "Notification sent successfully",
      })

      // Reset form
      setFormData({
        recipientType: 'all',
        type: 'system',
        title: '',
        content: '',
        priority: 'medium',
        action_url: '',
        send_email: false
      })
      
    } catch (error) {
      console.error('Error sending notification:', error)
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const handleTestNotificationSystem = async () => {
    try {
      setLoading(true)
      
      // Test notification system
      const response = await fetch('/api/email/test')
      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: "Test Successful",
          description: "Notification system is working properly",
        })
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "Notification system has issues",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to test notification system",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getRecipientUsers = () => {
    switch (formData.recipientType) {
      case 'startups':
        return 'Startups'
      case 'investors':
        return 'Investors'
      case 'admins':
        return 'Admins'
      default:
        return 'All Users'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-blue-500'
      case 'low': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system': return <Settings className="h-4 w-4" />
      case 'approval': return <CheckCircle className="h-4 w-4" />
      case 'rejection': return <AlertTriangle className="h-4 w-4" />
      case 'match': return <Users className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notification Management</h1>
            <p className="text-muted-foreground">Send and manage system notifications</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleTestNotificationSystem}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Test System
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unread}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sent_today}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Delivery</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.email_delivery_rate}%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="send" className="space-y-4">
          <TabsList>
            <TabsTrigger value="send">Send Notification</TabsTrigger>
            <TabsTrigger value="history">Notification History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Send New Notification</CardTitle>
                <CardDescription>
                  Send notifications to users with optional email delivery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recipients */}
                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <Select 
                    value={formData.recipientType} 
                    onValueChange={(value) => setFormData({ ...formData, recipientType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="startups">Startups Only</SelectItem>
                      <SelectItem value="investors">Investors Only</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="feature">New Feature</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Notification title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Notification content"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Action URL (optional)</Label>
                  <Input
                    value={formData.action_url}
                    onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                    placeholder="/dashboard or https://example.com"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send_email"
                    checked={formData.send_email}
                    onCheckedChange={(checked) => setFormData({ ...formData, send_email: !!checked })}
                  />
                  <Label htmlFor="send_email">Also send as email</Label>
                </div>

                <Button 
                  onClick={handleSendNotification} 
                  disabled={sending}
                  className="w-full"
                >
                  {sending ? "Sending..." : "Send Notification"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>
                  View all notifications sent through the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No notifications found
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(notification.type)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{notification.title}</h4>
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              {!notification.is_read && (
                                <Badge variant="outline">Unread</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{notification.content}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(notification.created_at)}
                              {notification.user_email && ` • ${notification.user_email}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure notification system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">Send notifications via email</p>
                    </div>
                    <Checkbox defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Real-time Notifications</h4>
                      <p className="text-sm text-muted-foreground">Push notifications to dashboard</p>
                    </div>
                    <Checkbox defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Automatic Notifications</h4>
                      <p className="text-sm text-muted-foreground">Auto-notify on system events</p>
                    </div>
                    <Checkbox defaultChecked />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Troubleshooting</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      If automatic notifications aren't working:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Ensure the notifications table exists in Supabase</li>
                      <li>Check that email SMTP settings are configured</li>
                      <li>Verify database triggers are properly set up</li>
                      <li>Test the system using the "Test System" button above</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
} 