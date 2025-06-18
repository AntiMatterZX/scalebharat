import { supabase } from "./supabase"

type EmailTemplateType = 'welcome' | 'new-match' | 'meeting-confirmation' | 'startup-approved' | 'startup-rejected' | 'profile-changes-submitted' | 'system'

export interface NotificationData {
  user_id: string
  type: 'match' | 'message' | 'meeting' | 'system' | 'approval' | 'rejection' | 'profile_update'
  title: string
  content: string
  data?: Record<string, any>
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  action_url?: string
  expires_at?: string
}

export interface EmailNotificationData {
  template: EmailTemplateType
  data: Record<string, any>
  subject?: string
}

export class NotificationService {
  /**
   * Create a database notification
   */
  static async createNotification(notificationData: NotificationData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .insert({
          user_id: notificationData.user_id,
          type: notificationData.type,
          title: notificationData.title,
          content: notificationData.content,
          data: notificationData.data || {},
          priority: notificationData.priority || 'medium',
          action_url: notificationData.action_url,
          expires_at: notificationData.expires_at
        })

      if (error) {
        console.error("Error creating notification:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in createNotification:", error)
      return false
    }
  }

  /**
   * Send email notification
   */
  static async sendEmailNotification(
    to: string,
    emailData: EmailNotificationData
  ): Promise<boolean> {
    try {
      const subject = emailData.subject || emailData.data.subject || "Notification from ScaleBharat"
      
      // Use fetch to call email API to avoid module resolution issues
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          template: emailData.template,
          data: emailData.data
        })
      })
      
      return response.ok
    } catch (error) {
      console.error("Error sending email notification:", error)
      return false
    }
  }

  /**
   * Create both database and email notification
   */
  static async createFullNotification(
    userEmail: string,
    notificationData: NotificationData,
    emailData?: EmailNotificationData
  ): Promise<{ dbSuccess: boolean; emailSuccess: boolean }> {
    const dbSuccess = await this.createNotification(notificationData)
    
    let emailSuccess = true
    if (emailData) {
      emailSuccess = await this.sendEmailNotification(userEmail, emailData)
    }

    return { dbSuccess, emailSuccess }
  }

  // Specific notification methods for different events

  /**
   * Welcome notification for new users
   */
  static async sendWelcomeNotification(
    userId: string,
    userEmail: string,
    userData: { firstName: string; userType: string }
  ) {
    const notificationData: NotificationData = {
      user_id: userId,
      type: 'system',
      title: '🎉 Welcome to ScaleBharat!',
      content: `Welcome ${userData.firstName}! Complete your profile to start connecting with ${userData.userType === 'startup' ? 'investors' : 'startups'}.`,
      priority: 'high',
      action_url: '/dashboard'
    }

    const emailData: EmailNotificationData = {
      template: 'welcome',
      data: {
        name: userData.firstName,
        userType: userData.userType,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      }
    }

    return await this.createFullNotification(userEmail, notificationData, emailData)
  }

  /**
   * New match notification
   */
  static async sendMatchNotification(
    userId: string,
    userEmail: string,
    matchData: {
      recipientName: string
      matchName: string
      matchType: string
      matchScore: number
      profileUrl: string
    }
  ) {
    const notificationData: NotificationData = {
      user_id: userId,
      type: 'match',
      title: '🎯 New Match Found!',
      content: `You have a new ${matchData.matchScore}% match with ${matchData.matchName}`,
      priority: 'high',
      action_url: matchData.profileUrl,
      data: matchData
    }

    const emailData: EmailNotificationData = {
      template: 'new-match',
      data: matchData
    }

    return await this.createFullNotification(userEmail, notificationData, emailData)
  }

  /**
   * Meeting confirmation notification
   */
  static async sendMeetingNotification(
    userId: string,
    userEmail: string,
    meetingData: {
      recipientName: string
      meetingTitle: string
      meetingDate: string
      meetingTime: string
      meetingLink?: string
      organizerName: string
    }
  ) {
    const notificationData: NotificationData = {
      user_id: userId,
      type: 'meeting',
      title: '📅 Meeting Confirmed',
      content: `Your meeting "${meetingData.meetingTitle}" is confirmed for ${meetingData.meetingDate} at ${meetingData.meetingTime}`,
      priority: 'high',
      action_url: '/meetings',
      data: meetingData
    }

    const emailData: EmailNotificationData = {
      template: 'meeting-confirmation',
      data: meetingData
    }

    return await this.createFullNotification(userEmail, notificationData, emailData)
  }

  /**
   * Startup approval notification
   */
  static async sendStartupApprovalNotification(
    userId: string,
    userEmail: string,
    approvalData: {
      founderName: string
      startupName: string
      profileUrl: string
      dashboardUrl: string
      changesApplied?: string[]
    }
  ) {
    const notificationData: NotificationData = {
      user_id: userId,
      type: 'approval',
      title: '🎉 Startup Profile Approved!',
      content: `Congratulations! Your startup "${approvalData.startupName}" has been approved and is now live.`,
      priority: 'urgent',
      action_url: approvalData.profileUrl,
      data: approvalData
    }

    const emailData: EmailNotificationData = {
      template: 'startup-approved',
      data: approvalData
    }

    return await this.createFullNotification(userEmail, notificationData, emailData)
  }

  /**
   * Startup rejection notification
   */
  static async sendStartupRejectionNotification(
    userId: string,
    userEmail: string,
    rejectionData: {
      founderName: string
      startupName: string
      rejectionReason: string
      resubmitUrl: string
      supportEmail: string
    }
  ) {
    const notificationData: NotificationData = {
      user_id: userId,
      type: 'rejection',
      title: '📝 Profile Updates Needed',
      content: `Your startup profile needs some updates. Please review the feedback and resubmit.`,
      priority: 'high',
      action_url: rejectionData.resubmitUrl,
      data: rejectionData
    }

    const emailData: EmailNotificationData = {
      template: 'startup-rejected',
      data: rejectionData
    }

    return await this.createFullNotification(userEmail, notificationData, emailData)
  }

  /**
   * Profile changes submitted notification
   */
  static async sendProfileChangesSubmittedNotification(
    userId: string,
    userEmail: string,
    submissionData: {
      founderName: string
      startupName: string
      submissionDate: string
      changesSubmitted: string[]
      dashboardUrl: string
    }
  ) {
    const notificationData: NotificationData = {
      user_id: userId,
      type: 'profile_update',
      title: '✅ Profile Changes Submitted',
      content: `Your profile changes have been submitted for review. We'll notify you once they're approved.`,
      priority: 'medium',
      action_url: submissionData.dashboardUrl,
      data: submissionData
    }

    const emailData: EmailNotificationData = {
      template: 'profile-changes-submitted',
      data: submissionData
    }

    return await this.createFullNotification(userEmail, notificationData, emailData)
  }

  /**
   * Mark notifications as read
   */
  static async markNotificationsAsRead(
    userId: string,
    notificationIds: string[]
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", notificationIds)
        .eq("user_id", userId)

      if (error) {
        console.error("Error marking notifications as read:", error)
        return false
      }

    return true
  } catch (error) {
      console.error("Error in markNotificationsAsRead:", error)
    return false
  }
}

  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string,
    options: {
      limit?: number
      unreadOnly?: boolean
      type?: string
    } = {}
  ) {
    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .or("expires_at.is.null,expires_at.gte.now()")
        .order("created_at", { ascending: false })

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.unreadOnly) {
        query = query.eq("is_read", false)
      }

      if (options.type) {
        query = query.eq("type", options.type)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching notifications:", error)
        return []
      }

      return data || []
  } catch (error) {
      console.error("Error in getUserNotifications:", error)
      return []
    }
  }
}

// Export convenience functions
export const {
  createNotification,
  sendEmailNotification,
  createFullNotification,
  sendWelcomeNotification,
  sendMatchNotification,
  sendMeetingNotification,
  sendStartupApprovalNotification,
  sendStartupRejectionNotification,
  sendProfileChangesSubmittedNotification,
  markNotificationsAsRead,
  getUserNotifications
} = NotificationService
