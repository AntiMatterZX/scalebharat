"use client"

import { useEffect } from 'react'

interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

declare global {
  interface Window {
    gtag?: (command: string, target: string, config?: any) => void
  }
}

export function PerformanceMonitor() {
  useEffect(() => {
    let observer: PerformanceObserver | null = null

    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const sendToAnalytics = (metric: PerformanceMetric) => {
        // Send to analytics service (GA4, Vercel Analytics, etc.)
        if (typeof window.gtag === 'function') {
          window.gtag('event', metric.name, {
            value: Math.round(metric.value),
            metric_rating: metric.rating,
          })
        }

        // Send to Vercel Analytics if available
        if (process.env.NODE_ENV === 'production') {
          fetch('/api/analytics/web-vitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metric),
          }).catch(() => {
            // Silently fail to avoid disrupting user experience
          })
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 Performance Metric: ${metric.name}`, {
            value: metric.value,
            rating: metric.rating,
          })
        }
      }

      const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
        switch (name) {
          case 'CLS':
            return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor'
          case 'FID':
            return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor'
          case 'FCP':
            return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor'
          case 'LCP':
            return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
          case 'TTFB':
            return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor'
          default:
            return 'good'
        }
      }

      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          let value = 0
          
          // Handle different types of performance entries
          if (entry.entryType === 'largest-contentful-paint') {
            value = entry.startTime
          } else if (entry.entryType === 'first-input') {
            value = (entry as PerformanceEventTiming).processingStart - entry.startTime
          } else if (entry.entryType === 'layout-shift') {
            value = (entry as any).value || 0
          } else if (entry.entryType === 'navigation') {
            value = entry.duration
          }

          const metric: PerformanceMetric = {
            name: entry.name,
            value,
            rating: getRating(entry.name, value),
          }
          sendToAnalytics(metric)
        }
      })

      // Observe Core Web Vitals
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
        observer.observe({ entryTypes: ['first-input'] })
        observer.observe({ entryTypes: ['layout-shift'] })
        observer.observe({ entryTypes: ['navigation'] })
      } catch (error) {
        console.warn('Some performance metrics are not supported:', error)
      }

      // Monitor custom metrics
      const trackCustomMetrics = () => {
        // Time to Interactive approximation
        const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigationEntry) {
          const tti = navigationEntry.loadEventEnd - navigationEntry.fetchStart
          sendToAnalytics({
            name: 'TTI',
            value: tti,
            rating: getRating('TTI', tti),
          })
        }

        // First Contentful Paint
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
        if (fcpEntry) {
          sendToAnalytics({
            name: 'FCP',
            value: fcpEntry.startTime,
            rating: getRating('FCP', fcpEntry.startTime),
          })
        }
      }

      // Track metrics after page load
      if (document.readyState === 'complete') {
        trackCustomMetrics()
      } else {
        window.addEventListener('load', trackCustomMetrics)
      }
    }

    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [])

  return null // This component doesn't render anything
}

// Web Vitals API endpoint for collecting metrics
export async function reportWebVitals(metric: PerformanceMetric) {
  if (process.env.NODE_ENV === 'production') {
    try {
      await fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...metric,
          url: window.location.pathname,
          timestamp: Date.now(),
        }),
      })
    } catch (error) {
      // Silently fail to avoid disrupting user experience
      console.warn('Failed to report web vitals:', error)
    }
  }
} 