import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

export interface AnalyticsMetric {
  metric_category: string
  metric_name: string
  metric_value: number
  metric_percentage: number
  time_period: string
  comparison_value: number
  trend_direction: 'up' | 'down' | 'stable'
}

export interface ConversionFunnelStep {
  step_name: string
  step_order: number
  count: number
  conversion_rate: number
  drop_off_rate: number
}

export interface TimeSeriesData {
  date_label: string
  date_value: string
  metric_value: number
}

export interface RealTimeMetrics {
  active_users_5min: number
  active_users_1hour: number
  profile_views_today: number
  matches_today: number
  messages_today: number
  meetings_today: number
  last_updated: string
}

export interface AnalyticsData {
  metrics: AnalyticsMetric[]
  conversionFunnel: ConversionFunnelStep[]
  timeSeriesData: {
    profileViews: TimeSeriesData[]
    matches: TimeSeriesData[]
    meetings: TimeSeriesData[]
  }
  realTimeMetrics: RealTimeMetrics
  loading: boolean
  error: string | null
  lastUpdated: string
}

interface UseAnalyticsOptions {
  entityType: 'startup' | 'investor'
  entityId?: string
  refreshInterval?: number // in milliseconds
  autoRefresh?: boolean
}

export function useAnalytics(options: UseAnalyticsOptions) {
  const { entityType, entityId, refreshInterval = 30000, autoRefresh = true } = options
  const { toast } = useToast()
  
  const [data, setData] = useState<AnalyticsData>({
    metrics: [],
    conversionFunnel: [],
    timeSeriesData: {
      profileViews: [],
      matches: [],
      meetings: []
    },
    realTimeMetrics: {
      active_users_5min: 0,
      active_users_1hour: 0,
      profile_views_today: 0,
      matches_today: 0,
      messages_today: 0,
      meetings_today: 0,
      last_updated: new Date().toISOString()
    },
    loading: false,
    error: null,
    lastUpdated: new Date().toISOString()
  })

  const [refreshing, setRefreshing] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Track user activity
  const trackActivity = useCallback(async (activityType: string, activityData: any = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.rpc('track_user_activity', {
        user_id_param: user.id,
        activity_type_param: activityType,
        activity_data_param: activityData
      })
    } catch (error) {
      console.error('Error tracking activity:', error)
    }
  }, [])

  // Fetch comprehensive analytics data
  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (!entityId) return

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setData(prev => ({ ...prev, loading: true, error: null }))
      }

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Fetch all analytics data in parallel
      const [
        metricsResponse,
        funnelResponse,
        profileViewsResponse,
        matchesResponse,
        meetingsResponse,
        realTimeResponse
      ] = await Promise.all([
        // Comprehensive metrics
        supabase.rpc(
          entityType === 'startup' 
            ? 'get_startup_analytics_comprehensive' 
            : 'get_investor_analytics_comprehensive',
          { [`${entityType}_id_param`]: entityId }
        ),
        
        // Conversion funnel
        supabase.rpc(
          entityType === 'startup' 
            ? 'get_startup_conversion_funnel_enhanced' 
            : 'get_investor_conversion_funnel_enhanced',
          { [`${entityType}_id_param`]: entityId }
        ),
        
        // Time series data - Profile views
        supabase.rpc('get_time_series_data', {
          entity_type_param: entityType,
          entity_id_param: entityId,
          metric_type_param: 'profile_views',
          days_back: 30
        }),
        
        // Time series data - Matches
        supabase.rpc('get_time_series_data', {
          entity_type_param: entityType,
          entity_id_param: entityId,
          metric_type_param: 'matches',
          days_back: 30
        }),
        
        // Time series data - Meetings
        supabase.rpc('get_time_series_data', {
          entity_type_param: entityType,
          entity_id_param: entityId,
          metric_type_param: 'meetings',
          days_back: 30
        }),
        
        // Real-time metrics
        supabase.rpc('get_real_time_metrics')
      ])

      // Check for errors
      if (metricsResponse.error) throw metricsResponse.error
      if (funnelResponse.error) throw funnelResponse.error
      if (profileViewsResponse.error) throw profileViewsResponse.error
      if (matchesResponse.error) throw matchesResponse.error
      if (meetingsResponse.error) throw meetingsResponse.error
      if (realTimeResponse.error) throw realTimeResponse.error

      // Transform real-time metrics
      const realTimeMetrics = realTimeResponse.data?.reduce((acc: any, metric: any) => {
        acc[metric.metric_name] = metric.metric_value
        return acc
      }, {}) || {}

      setData(prev => ({
        ...prev,
        metrics: metricsResponse.data || [],
        conversionFunnel: funnelResponse.data || [],
        timeSeriesData: {
          profileViews: profileViewsResponse.data || [],
          matches: matchesResponse.data || [],
          meetings: meetingsResponse.data || []
        },
        realTimeMetrics: {
          ...prev.realTimeMetrics,
          ...realTimeMetrics,
          last_updated: new Date().toISOString()
        },
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      }))

      // Track analytics view activity
      await trackActivity('analytics_view', {
        entity_type: entityType,
        entity_id: entityId
      })

    } catch (error: any) {
      console.error('Error fetching analytics:', error)
      
      if (error.name !== 'AbortError') {
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to fetch analytics data'
        }))
        
        toast({
          title: 'Analytics Error',
          description: 'Failed to load analytics data. Please try again.',
          variant: 'destructive'
        })
      }
    } finally {
      setRefreshing(false)
    }
  }, [entityType, entityId, toast, trackActivity])

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchAnalytics(true)
  }, [fetchAnalytics])

  // Get specific metric by category and name
  const getMetric = useCallback((category: string, name: string): AnalyticsMetric | null => {
    return data.metrics.find(m => m.metric_category === category && m.metric_name === name) || null
  }, [data.metrics])

  // Get metrics by category
  const getMetricsByCategory = useCallback((category: string): AnalyticsMetric[] => {
    return data.metrics.filter(m => m.metric_category === category)
  }, [data.metrics])

  // Calculate overall conversion rate
  const getOverallConversionRate = useCallback((): number => {
    const firstStep = data.conversionFunnel.find(step => step.step_order === 1)
    const lastStep = data.conversionFunnel.find(step => step.step_order === Math.max(...data.conversionFunnel.map(s => s.step_order)))
    
    if (!firstStep || !lastStep || firstStep.count === 0) return 0
    return Math.round((lastStep.count / firstStep.count) * 100 * 100) / 100
  }, [data.conversionFunnel])

  // Get trend for specific metric
  const getTrend = useCallback((category: string, name: string): { direction: string; percentage: number } => {
    const metric = getMetric(category, name)
    return {
      direction: metric?.trend_direction || 'stable',
      percentage: metric?.metric_percentage || 0
    }
  }, [getMetric])

  // Setup real-time updates
  useEffect(() => {
    if (autoRefresh && entityId) {
      fetchAnalytics()
      
      if (refreshInterval > 0) {
        intervalRef.current = setInterval(() => {
          fetchAnalytics(true)
        }, refreshInterval)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [entityId, autoRefresh, refreshInterval, fetchAnalytics])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    ...data,
    refresh,
    refreshing,
    trackActivity,
    getMetric,
    getMetricsByCategory,
    getOverallConversionRate,
    getTrend
  }
}

// Hook for real-time platform metrics (for admin/superadmin)
export function useRealTimeMetrics(refreshInterval = 10000) {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    active_users_5min: 0,
    active_users_1hour: 0,
    profile_views_today: 0,
    matches_today: 0,
    messages_today: 0,
    meetings_today: 0,
    last_updated: new Date().toISOString()
  })
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_real_time_metrics')
      
      if (error) throw error
      
      const metricsMap = data?.reduce((acc: any, metric: any) => {
        acc[metric.metric_name] = metric.metric_value
        return acc
      }, {}) || {}

      setMetrics(prev => ({
        ...prev,
        ...metricsMap,
        last_updated: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error fetching real-time metrics:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchMetrics, refreshInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchMetrics, refreshInterval])

  return { metrics, loading, refresh: fetchMetrics }
} 