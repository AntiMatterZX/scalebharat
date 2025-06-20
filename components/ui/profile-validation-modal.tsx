'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Building2, TrendingUp, ArrowRight } from 'lucide-react'

interface ProfileValidationModalProps {
  isOpen: boolean
  onClose: () => void
  existingProfileType: 'startup' | 'investor'
  attemptedProfileType: 'startup' | 'investor'
  onSwitchToDashboard: () => void
}

export function ProfileValidationModal({
  isOpen,
  onClose,
  existingProfileType,
  attemptedProfileType,
  onSwitchToDashboard
}: ProfileValidationModalProps) {
  const existingTypeInfo = {
    startup: {
      icon: Building2,
      title: 'Startup Founder',
      description: 'You already have a startup profile',
      dashboard: '/startup/dashboard'
    },
    investor: {
      icon: TrendingUp,
      title: 'Investor',
      description: 'You already have an investor profile',
      dashboard: '/investor/dashboard'
    }
  }

  const attemptedTypeInfo = {
    startup: {
      title: 'Startup Founder',
      description: 'create a startup profile'
    },
    investor: {
      title: 'Investor',
      description: 'create an investor profile'
    }
  }

  const ExistingIcon = existingTypeInfo[existingProfileType].icon

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <DialogTitle>Profile Already Exists</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            You can only have one type of profile per account to maintain platform integrity and security.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <ExistingIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Current Profile:</strong> {existingTypeInfo[existingProfileType].title}
              <br />
              {existingTypeInfo[existingProfileType].description}
            </AlertDescription>
          </Alert>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Why this restriction?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Prevents conflicts of interest</li>
              <li>• Maintains trust in the platform</li>
              <li>• Ensures authentic interactions</li>
              <li>• Protects user data integrity</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Need to {attemptedTypeInfo[attemptedProfileType].description}?</strong>
              <br />
              You'll need to use a different email address and create a separate account.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            onClick={onSwitchToDashboard}
            className="w-full sm:w-auto"
          >
            <ExistingIcon className="mr-2 h-4 w-4" />
            Go to My Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Stay Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ProfileCreationModalProps {
  isOpen: boolean
  onClose: () => void
  profileType: 'startup' | 'investor'
  isLoading: boolean
  onConfirm: () => void
}

export function ProfileCreationModal({
  isOpen,
  onClose,
  profileType,
  isLoading,
  onConfirm
}: ProfileCreationModalProps) {
  const profileInfo = {
    startup: {
      icon: Building2,
      title: 'Create Startup Profile',
      description: 'You\'re about to create a startup founder profile. This will give you access to:',
      benefits: [
        'Connect with verified investors',
        'Showcase your startup to potential funders',
        'Access pitch deck templates and resources',
        'Track funding progress and analytics'
      ],
      nextStep: 'startup onboarding'
    },
    investor: {
      icon: TrendingUp,
      title: 'Create Investor Profile',
      description: 'You\'re about to create an investor profile. This will give you access to:',
      benefits: [
        'Browse curated startup opportunities',
        'Manage your investment portfolio',
        'Access due diligence tools',
        'Connect with promising founders'
      ],
      nextStep: 'investor onboarding'
    }
  }

  const ProfileIcon = profileInfo[profileType].icon
  const info = profileInfo[profileType]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ProfileIcon className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle>{info.title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {info.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            {info.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> You can only have one profile type per account. 
              This cannot be changed later without creating a new account.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Profile...
              </>
            ) : (
              <>
                Create Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}