"use client"

import { useState, useEffect } from "react"
import { useUser } from "./useUser"
import { supabase } from "@/lib/supabase"

export interface Notification {
  id: string
  user_id: string
  type: 'match' | 'message' | 'meeting' | 'system' | 'approval' | 'rejection' | 'profile_update'
  title: string
  content: string
  data: Record<string, any>
  is_read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  action_url?: string
  expires_at?: string
  created_at: string
}

interface UseNotificationsResult {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  markAsRead: (notificationId: string) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  deleteNotification: (notificationId: string) => Promise<boolean>
  refreshNotifications: () => Promise<void>
}

export function useNotifications(): UseNotificationsResult {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .or("expires_at.is.null,expires_at.gte.now()")
        .order("created_at", { ascending: false })
        .limit(50)

      if (fetchError) {
        // Check if it's a table doesn't exist error or RLS policy issue
        if (fetchError.code === 'PGRST116' || fetchError.message?.includes('relation "notifications" does not exist')) {
          // Table doesn't exist yet - this is expected during setup
          console.warn('⚠️ Notifications table not yet created. Please run: supabase/notifications-only.sql in your Supabase SQL Editor.')
          setNotifications([])
          return
        }
        throw fetchError
      }

      setNotifications(data || [])
    } catch (err: any) {
      // Only log meaningful errors, not empty objects
      if (err && (err.message || err.code || Object.keys(err).length > 0)) {
        setError(err.message || 'Failed to fetch notifications')
        console.error('Error fetching notifications:', err)
      } else {
        // Silent failure for empty error objects or setup issues
        console.warn('⚠️ Notifications system not ready. Please run the SQL setup script in Supabase.')
        setNotifications([])
      }
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      )

      return true
    } catch (err: any) {
      console.error('Error marking notification as read:', err)
      return false
    }
  }

  const markAllAsRead = async (): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (error) {
        throw error
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      )

      return true
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err)
      return false
    }
  }

  const deleteNotification = async (notificationId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      // Update local state
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      )

      return true
    } catch (err: any) {
      console.error('Error deleting notification:', err)
      return false
    }
  }

  const refreshNotifications = async () => {
    await fetchNotifications()
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()

      // Set up real-time subscription for new notifications
      // Only set up subscription if notifications are working
      let subscription: any = null
      
      const setupSubscription = async () => {
        try {
          // Test if notifications table exists by doing a simple query
          const { error: testError } = await supabase
            .from("notifications")
            .select("id")
            .limit(1)

          if (testError) {
            // Table doesn't exist or RLS issues - skip subscription
            console.warn('Skipping real-time notifications subscription due to table/permission issues')
            return
          }

          subscription = supabase
            .channel('notifications')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`,
              },
              (payload) => {
                const newNotification = payload.new as Notification
                setNotifications(prev => [newNotification, ...prev])
              }
            )
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`,
              },
              (payload) => {
                const updatedNotification = payload.new as Notification
                setNotifications(prev => 
                  prev.map(notification => 
                    notification.id === updatedNotification.id 
                      ? updatedNotification 
                      : notification
                  )
                )
              }
            )
            .on(
              'postgres_changes',
              {
                event: 'DELETE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`,
              },
              (payload) => {
                const deletedNotification = payload.old as Notification
                setNotifications(prev => 
                  prev.filter(notification => notification.id !== deletedNotification.id)
                )
              }
            )
            .subscribe()
        } catch (error) {
          console.warn('Could not set up notifications subscription:', error)
        }
      }

      setupSubscription()

      return () => {
        if (subscription) {
          subscription.unsubscribe()
        }
      }
    }
  }, [user])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  }
} 