import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  return (
    <Loader2 
      className={cn(
        'animate-spin text-primary',
        sizeClasses[size],
        className
      )} 
    />
  )
}

interface LoadingStateProps {
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingState({ 
  title = 'Loading...', 
  description,
  size = 'md',
  className 
}: LoadingStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center',
      className
    )}>
      <LoadingSpinner size={size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'xl'} />
      <h3 className="mt-4 text-lg font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
    </div>
  )
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('skeleton h-4 w-full', className)} />
  )
}

interface CardSkeletonProps {
  showAvatar?: boolean
  lines?: number
  className?: string
}

export function CardSkeleton({ showAvatar = false, lines = 3, className }: CardSkeletonProps) {
  return (
    <div className={cn('card-elevated p-6 space-y-4', className)}>
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              'h-4',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )} 
          />
        ))}
      </div>
    </div>
  )
}

interface PageLoadingProps {
  title?: string
  description?: string
}

export function PageLoading({ 
  title = 'Loading page...', 
  description = 'Please wait while we fetch your data.' 
}: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="container-fluid">
        <LoadingState 
          title={title}
          description={description}
          size="lg"
          className="py-20"
        />
      </div>
    </div>
  )
}

interface DashboardSkeletonProps {
  cards?: number
}

export function DashboardSkeleton({ cards = 4 }: DashboardSkeletonProps) {
  return (
    <div className="container-fluid py-6 space-y-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="card-elevated p-6">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CardSkeleton lines={6} />
        </div>
        <div>
          <CardSkeleton lines={4} />
        </div>
      </div>
    </div>
  )
}