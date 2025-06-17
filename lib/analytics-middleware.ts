import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server'

// Analytics middleware for automatic tracking
export class AnalyticsMiddleware {
  private supabase = createSupabaseServiceRoleClient()

  // Track page views automatically
  async trackPageView(
    userId: string | null,
    path: string,
    userAgent?: string,
    ip?: string,
    referrer?: string
  ) {
    try {
      // Extract entity information from path
      const entityInfo = this.extractEntityFromPath(path)
      
      if (entityInfo && userId) {
        // Track profile view
        await this.supabase.rpc('track_profile_view', {
          viewer_user_id: userId,
          profile_type_param: entityInfo.type,
          profile_id_param: entityInfo.id,
          ip_addr: ip || null,
          user_agent_param: userAgent || null
        })
      }

      // Track general page view
      await this.supabase.from('analytics').insert({
        type: 'page-view',
        user_id: userId,
        target_id: entityInfo?.id || null,
        metadata: {
          path,
          entity_type: entityInfo?.type || null,
          referrer
        },
        ip_address: ip,
        user_agent: userAgent
      })

      // Track user activity for real-time metrics
      if (userId) {
        await this.supabase.rpc('track_user_activity', {
          user_id_param: userId,
          activity_type_param: 'page_view',
          activity_data_param: {
            path,
            entity_type: entityInfo?.type || null,
            entity_id: entityInfo?.id || null
          }
        })
      }
    } catch (error) {
      console.error('Error tracking page view:', error)
    }
  }

  // Track user interactions
  async trackInteraction(
    userId: string,
    interactionType: string,
    targetId?: string,
    targetType?: string,
    metadata?: any
  ) {
    try {
      // Insert analytics event
      await this.supabase.from('analytics').insert({
        type: interactionType,
        user_id: userId,
        target_id: targetId || null,
        metadata: {
          target_type: targetType,
          ...metadata
        }
      })

      // Track user activity
      await this.supabase.rpc('track_user_activity', {
        user_id_param: userId,
        activity_type_param: interactionType,
        activity_data_param: {
          target_id: targetId,
          target_type: targetType,
          ...metadata
        }
      })
    } catch (error) {
      console.error('Error tracking interaction:', error)
    }
  }

  // Track match creation
  async trackMatchCreated(matchId: string, startupId: string, investorId: string) {
    try {
      await this.supabase.from('analytics').insert([
        {
          type: 'match-created',
          user_id: null, // System generated
          target_id: matchId,
          metadata: {
            startup_id: startupId,
            investor_id: investorId,
            target_type: 'match'
          }
        }
      ])
    } catch (error) {
      console.error('Error tracking match creation:', error)
    }
  }

  // Track meeting scheduled
  async trackMeetingScheduled(meetingId: string, organizerId: string, attendeeId: string) {
    try {
      await this.supabase.from('analytics').insert([
        {
          type: 'meeting-scheduled',
          user_id: organizerId,
          target_id: meetingId,
          metadata: {
            attendee_id: attendeeId,
            target_type: 'meeting'
          }
        }
      ])

      // Track activity for both users
      await Promise.all([
        this.supabase.rpc('track_user_activity', {
          user_id_param: organizerId,
          activity_type_param: 'meeting_scheduled',
          activity_data_param: { meeting_id: meetingId, role: 'organizer' }
        }),
        this.supabase.rpc('track_user_activity', {
          user_id_param: attendeeId,
          activity_type_param: 'meeting_scheduled',
          activity_data_param: { meeting_id: meetingId, role: 'attendee' }
        })
      ])
    } catch (error) {
      console.error('Error tracking meeting scheduled:', error)
    }
  }

  // Track message sent
  async trackMessageSent(messageId: string, senderId: string, receiverId: string, matchId: string) {
    try {
      await this.supabase.from('analytics').insert({
        type: 'message-sent',
        user_id: senderId,
        target_id: messageId,
        metadata: {
          receiver_id: receiverId,
          match_id: matchId,
          target_type: 'message'
        }
      })

      await this.supabase.rpc('track_user_activity', {
        user_id_param: senderId,
        activity_type_param: 'message_sent',
        activity_data_param: {
          message_id: messageId,
          match_id: matchId
        }
      })
    } catch (error) {
      console.error('Error tracking message sent:', error)
    }
  }

  // Track startup upvote
  async trackStartupUpvote(startupId: string, userId: string) {
    try {
      await this.supabase.from('analytics').insert({
        type: 'upvote',
        user_id: userId,
        target_id: startupId,
        metadata: {
          target_type: 'startup'
        }
      })

      await this.supabase.rpc('track_user_activity', {
        user_id_param: userId,
        activity_type_param: 'startup_upvote',
        activity_data_param: { startup_id: startupId }
      })
    } catch (error) {
      console.error('Error tracking startup upvote:', error)
    }
  }

  // Extract entity information from URL path
  private extractEntityFromPath(path: string): { type: string; id: string } | null {
    // Match patterns like /startups/[slug], /investors/[slug]
    const startupMatch = path.match(/^\/startups\/([^\/]+)/)
    if (startupMatch) {
      return { type: 'startup', id: startupMatch[1] }
    }

    const investorMatch = path.match(/^\/investors\/([^\/]+)/)
    if (investorMatch) {
      return { type: 'investor', id: investorMatch[1] }
    }

    return null
  }

  // Get user IP address from request
  getClientIP(request: NextRequest): string | null {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    return null
  }

  // Middleware function for Next.js
  async middleware(request: NextRequest) {
    try {
      const response = NextResponse.next()
      
      // Skip tracking for static files and API routes
      if (
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/api') ||
        request.nextUrl.pathname.includes('.')
      ) {
        return response
      }

      // Get user information from session
      const sessionToken = request.cookies.get('supabase-auth-token')?.value
      let userId: string | null = null

      if (sessionToken) {
        try {
          const { data: { user } } = await this.supabase.auth.getUser(sessionToken)
          userId = user?.id || null
        } catch (error) {
          // Continue without user ID if session is invalid
        }
      }

      // Track page view asynchronously (don't block the response)
      setImmediate(() => {
        this.trackPageView(
          userId,
          request.nextUrl.pathname,
          request.headers.get('user-agent') || undefined,
          this.getClientIP(request) || undefined,
          request.headers.get('referer') || undefined
        )
      })

      return response
    } catch (error) {
      console.error('Analytics middleware error:', error)
      return NextResponse.next()
    }
  }
}

// Singleton instance
const analyticsMiddleware = new AnalyticsMiddleware()

// Export middleware function
export const middleware = analyticsMiddleware.middleware.bind(analyticsMiddleware)

// Export tracking functions for manual use
export const trackPageView = analyticsMiddleware.trackPageView.bind(analyticsMiddleware)
export const trackInteraction = analyticsMiddleware.trackInteraction.bind(analyticsMiddleware)
export const trackMatchCreated = analyticsMiddleware.trackMatchCreated.bind(analyticsMiddleware)
export const trackMeetingScheduled = analyticsMiddleware.trackMeetingScheduled.bind(analyticsMiddleware)
export const trackMessageSent = analyticsMiddleware.trackMessageSent.bind(analyticsMiddleware)
export const trackStartupUpvote = analyticsMiddleware.trackStartupUpvote.bind(analyticsMiddleware)

// Real-time analytics utilities
export class RealTimeAnalytics {
  private supabase = createSupabaseServiceRoleClient()

  // Setup real-time subscriptions for analytics
  setupRealTimeSubscriptions() {
    // Subscribe to new matches
    const matchesSubscription = this.supabase
      .channel('matches-analytics')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches' },
        (payload) => {
          // Broadcast match creation event
          this.broadcastAnalyticsEvent('match_created', payload.new)
        }
      )
      .subscribe()

    // Subscribe to new meetings
    const meetingsSubscription = this.supabase
      .channel('meetings-analytics')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'meetings' },
        (payload) => {
          this.broadcastAnalyticsEvent('meeting_scheduled', payload.new)
        }
      )
      .subscribe()

    // Subscribe to new messages
    const messagesSubscription = this.supabase
      .channel('messages-analytics')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          this.broadcastAnalyticsEvent('message_sent', payload.new)
        }
      )
      .subscribe()

    return {
      matchesSubscription,
      meetingsSubscription,
      messagesSubscription
    }
  }

  // Broadcast analytics events to connected clients
  private async broadcastAnalyticsEvent(eventType: string, data: any) {
    try {
      await this.supabase
        .channel('analytics-events')
        .send({
          type: 'broadcast',
          event: eventType,
          payload: data
        })
    } catch (error) {
      console.error('Error broadcasting analytics event:', error)
    }
  }

  // Get live analytics dashboard data
  async getLiveDashboardData() {
    try {
      const { data, error } = await this.supabase.rpc('get_real_time_metrics')
      
      if (error) throw error
      
      return data?.reduce((acc: any, metric: any) => {
        acc[metric.metric_name] = metric.metric_value
        return acc
      }, {})
    } catch (error) {
      console.error('Error getting live dashboard data:', error)
      return null
    }
  }
}

export const realTimeAnalytics = new RealTimeAnalytics() 