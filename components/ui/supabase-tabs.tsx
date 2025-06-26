"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabItem {
  id: string | number
  label: string
  href: string
  icon?: React.ReactNode
  showArrow?: boolean
  disabled?: boolean
}

interface SupabaseTabsProps {
  tabs: TabItem[]
  defaultActiveIndex?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'accent' | 'primary'
}

export function SupabaseTabs({ 
  tabs, 
  defaultActiveIndex = 0, 
  className,
  size = 'md',
  variant = 'default'
}: SupabaseTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultActiveIndex)

  const sizeClasses = {
    sm: 'px-2 sm:px-3 py-1 sm:py-1.5 text-xs',
    md: 'px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm',
    lg: 'px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base'
  }

  const variantClasses = {
    default: {
      container: 'bg-card/80 border-border/50',
      active: 'bg-emerald-500/90 hover:bg-emerald-500 border border-emerald-400/20 text-black shadow-sm',
      inactive: 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
    },
    accent: {
      container: 'bg-accent/80 border-accent-foreground/20',
      active: 'bg-primary hover:bg-primary/90 border border-primary/20 text-primary-foreground shadow-sm',
      inactive: 'text-muted-foreground hover:text-foreground hover:bg-accent/70'
    },
    primary: {
      container: 'bg-primary/10 border-primary/20',
      active: 'bg-primary hover:bg-primary/90 border border-primary/20 text-primary-foreground shadow-sm',
      inactive: 'text-muted-foreground hover:text-primary hover:bg-primary/10'
    }
  }

  return (
    <div className={cn(
      "inline-flex items-center backdrop-blur-sm rounded-full p-1 shadow-lg hover:shadow-xl transition-shadow duration-300",
      variantClasses[variant].container,
      className
    )}>
      {tabs.map((tab, index) => (
        <Link 
          key={tab.id}
          href={tab.disabled ? '#' : tab.href} 
          className={cn(
            "group relative",
            tab.disabled && "pointer-events-none opacity-50"
          )}
          onMouseEnter={() => !tab.disabled && setActiveTab(index)}
          onClick={(e) => tab.disabled && e.preventDefault()}
        >
          <div className={cn(
            "font-medium transition-all duration-300 rounded-full",
            "flex items-center gap-1.5",
            sizeClasses[size],
            activeTab === index 
              ? variantClasses[variant].active
              : variantClasses[variant].inactive
          )}>
            {tab.icon && tab.icon}
            {tab.label}
            {tab.showArrow && (
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

// Helper component for quick usage
export function HeroTabs() {
  const tabs = [
    {
      id: 'startups',
      label: "State of Startups 2025", 
      href: "/startups"
    },
    {
      id: 'survey',
      label: "Take the survey",
      href: "/onboarding", 
      showArrow: true
    }
  ]

  return <SupabaseTabs tabs={tabs} />
} 