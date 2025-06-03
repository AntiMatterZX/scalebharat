'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

interface ResponsiveWrapperProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function ResponsiveWrapper({ 
  children, 
  className,
  maxWidth = 'xl',
  padding = 'md'
}: ResponsiveWrapperProps) {
  const pathname = usePathname()
  
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-7xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-4 sm:px-6 lg:px-8 py-4',
    lg: 'px-4 sm:px-6 lg:px-8 py-8'
  }

  return (
    <div className={cn(
      'w-full mx-auto',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}

interface PageContainerProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
  showBackButton?: boolean
}

export function PageContainer({ 
  children, 
  title, 
  description,
  className,
  showBackButton = false
}: PageContainerProps) {
  return (
    <ResponsiveWrapper className={cn('space-y-8', className)}>
      {(title || description || showBackButton) && (
        <div className="space-y-4">
          {showBackButton && (
            <button 
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          
          {title && (
            <h1 className="heading-2">{title}</h1>
          )}
          
          {description && (
            <p className="body-large text-muted-foreground max-w-3xl">
              {description}
            </p>
          )}
        </div>
      )}
      
      {children}
    </ResponsiveWrapper>
  )
}

interface DashboardContainerProps {
  children: React.ReactNode
  className?: string
}

export function DashboardContainer({ children, className }: DashboardContainerProps) {
  return (
    <div className={cn(
      'min-h-screen bg-gray-50/50 dark:bg-gray-950/50',
      className
    )}>
      <ResponsiveWrapper padding="lg">
        {children}
      </ResponsiveWrapper>
    </div>
  )
}

interface SectionProps {
  children: React.ReactNode
  className?: string
  background?: 'default' | 'muted' | 'accent'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export function Section({ 
  children, 
  className,
  background = 'default',
  padding = 'lg'
}: SectionProps) {
  const backgroundClasses = {
    default: 'bg-background',
    muted: 'bg-muted/30',
    accent: 'bg-accent/10'
  }

  const paddingClasses = {
    none: '',
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16 md:py-20',
    xl: 'py-20 md:py-24 lg:py-32'
  }

  return (
    <section className={cn(
      backgroundClasses[background],
      paddingClasses[padding],
      className
    )}>
      <ResponsiveWrapper>
        {children}
      </ResponsiveWrapper>
    </section>
  )
}

interface GridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Grid({ 
  children, 
  cols = 3, 
  gap = 'md',
  className 
}: GridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    12: 'grid-cols-12'
  }

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  }

  return (
    <div className={cn(
      'grid',
      colClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

interface FlexProps {
  children: React.ReactNode
  direction?: 'row' | 'col'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  wrap?: boolean
  className?: string
}

export function Flex({ 
  children, 
  direction = 'row',
  align = 'start',
  justify = 'start',
  gap = 'md',
  wrap = false,
  className 
}: FlexProps) {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }

  return (
    <div className={cn(
      'flex',
      directionClasses[direction],
      alignClasses[align],
      justifyClasses[justify],
      gapClasses[gap],
      wrap && 'flex-wrap',
      className
    )}>
      {children}
    </div>
  )
}