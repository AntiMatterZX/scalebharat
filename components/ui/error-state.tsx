import React from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ErrorStateProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  showHomeButton?: boolean
  showBackButton?: boolean
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an unexpected error. Please try again.',
  action,
  showHomeButton = true,
  showBackButton = false,
  className
}: ErrorStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center',
      className
    )}>
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button onClick={action.onClick} className="min-w-[120px]">
            <RefreshCw className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        )}
        
        {showBackButton && (
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="min-w-[120px]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        )}
        
        {showHomeButton && (
          <Button variant="outline" asChild className="min-w-[120px]">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

interface ErrorCardProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'destructive' | 'warning'
  className?: string
}

export function ErrorCard({
  title = 'Error',
  description = 'An error occurred',
  action,
  variant = 'destructive',
  className
}: ErrorCardProps) {
  const variantStyles = {
    default: 'border-border',
    destructive: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50',
    warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/50'
  }

  const iconStyles = {
    default: 'text-muted-foreground',
    destructive: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400'
  }

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className={cn('h-5 w-5', iconStyles[variant])} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        {action && (
          <Button onClick={action.onClick} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface NotFoundStateProps {
  title?: string
  description?: string
  showHomeButton?: boolean
  showBackButton?: boolean
  className?: string
}

export function NotFoundState({
  title = 'Page not found',
  description = 'The page you are looking for does not exist or has been moved.',
  showHomeButton = true,
  showBackButton = true,
  className
}: NotFoundStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center min-h-[400px]',
      className
    )}>
      <div className="text-6xl font-bold text-muted-foreground/20 mb-4">404</div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {showBackButton && (
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="min-w-[120px]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        )}
        
        {showHomeButton && (
          <Button asChild className="min-w-[120px]">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center',
      className
    )}>
      {icon && (
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      
      {action && (
        action.href ? (
          <Button asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  )
}