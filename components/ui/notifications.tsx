"use client"

import { useState } from "react"
import { Bell, Check, CheckCheck, X, ExternalLink, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "./button"
import { Badge } from "./badge"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { ScrollArea } from "./scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Separator } from "./separator"
import { useNotifications, type Notification } from "@/lib/hooks/useNotifications"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'approval':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejection':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'profile_update':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'system':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'match':
        return <Bell className="h-4 w-4 text-purple-500" />
      case 'meeting':
        return <Clock className="h-4 w-4 text-indigo-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50/50'
      case 'high':
        return 'border-l-orange-500 bg-orange-50/50'
      case 'medium':
        return 'border-l-blue-500 bg-blue-50/50'
      default:
        return 'border-l-gray-300 bg-gray-50/50'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className={cn(
      "border-l-4 p-3 rounded-r-lg transition-all hover:shadow-sm",
      getPriorityColor(),
      !notification.is_read && "bg-opacity-100"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={cn(
                "text-sm font-medium truncate",
                !notification.is_read && "font-semibold"
              )}>
                {notification.title}
              </h4>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {notification.content}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {formatDate(notification.created_at)}
              </span>
              <div className="flex items-center gap-1">
                {notification.action_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    asChild
                  >
                    <Link href={notification.action_url}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </Button>
                )}
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                  onClick={() => onDelete(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications()
  
  const [isOpen, setIsOpen] = useState(false)

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
  }

  const handleDelete = async (id: string) => {
    await deleteNotification(id)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshNotifications}
                  disabled={loading}
                >
                  Refresh
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

export function NotificationBanner() {
  const { notifications } = useNotifications()
  
  // Show only high priority unread notifications as banners
  const urgentNotifications = notifications.filter(
    n => !n.is_read && (n.priority === 'urgent' || n.priority === 'high')
  )

  if (urgentNotifications.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {urgentNotifications.slice(0, 3).map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "p-4 rounded-lg border-l-4 flex items-center justify-between",
            notification.type === 'approval' && "bg-green-50 border-l-green-500",
            notification.type === 'rejection' && "bg-red-50 border-l-red-500",
            notification.type === 'profile_update' && "bg-blue-50 border-l-blue-500",
            notification.type === 'system' && "bg-orange-50 border-l-orange-500"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {notification.type === 'approval' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {notification.type === 'rejection' && <XCircle className="h-5 w-5 text-red-500" />}
              {notification.type === 'profile_update' && <Clock className="h-5 w-5 text-blue-500" />}
              {notification.type === 'system' && <AlertCircle className="h-5 w-5 text-orange-500" />}
            </div>
            <div>
              <h4 className="font-medium text-sm">{notification.title}</h4>
              <p className="text-sm text-gray-600">{notification.content}</p>
            </div>
          </div>
          {notification.action_url && (
            <Button variant="outline" size="sm" asChild>
              <Link href={notification.action_url}>
                View Details
              </Link>
            </Button>
          )}
        </div>
      ))}
    </div>
  )
} 