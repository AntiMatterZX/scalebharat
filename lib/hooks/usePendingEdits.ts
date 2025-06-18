import { useState, useEffect } from "react"
import { useUser } from "./useUser"

interface PendingEdit {
  id: string
  startup_id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  rejection_reason?: string
  changes_summary?: string
  admin_notes?: string
  // Profile fields
  company_name?: string
  tagline?: string
  description?: string
  logo?: string
  banner_image?: string
  website?: string
  founded_year?: number
  stage?: string
  industry?: string[]
  business_model?: string
  // Financial fields
  total_raised?: number
  current_round?: string
  target_amount?: number
  valuation?: number
  previous_investors?: string[]
  revenue?: number
  users_count?: number
  growth_rate?: number
  burn_rate?: number
  equity_percentage_offered?: number
  planned_use_of_funds?: string[]
  fundraising_timeline_months?: number
  // Related data
  startup_team_members_pending?: any[]
  startup_documents_pending?: any[]
}

interface UsePendingEditsResult {
  pendingEdit: PendingEdit | null
  hasPendingEdits: boolean
  loading: boolean
  error: string | null
  submitPendingEdits: (editData: any) => Promise<boolean>
  cancelPendingEdits: () => Promise<boolean>
  checkPendingEdits: () => Promise<void>
}

export function usePendingEdits(startupId?: string): UsePendingEditsResult {
  const { user } = useUser()
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkPendingEdits = async () => {
    if (!startupId || !user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/startup/pending-edits?startup_id=${startupId}`)
      
      if (!response.ok) {
        // If it's a server error, don't throw - just log and continue
        if (response.status >= 500) {
          console.warn(`Server error fetching pending edits (${response.status}). Continuing without pending edits.`)
          setPendingEdit(null)
          return
        }
        
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch pending edits')
      }

      const data = await response.json()
      setPendingEdit(data.pending_edit)
    } catch (err: any) {
      // Don't set error state for server errors - just log them
      if (err.message && err.message.includes('500')) {
        console.warn('Server error fetching pending edits. Continuing without pending edits.')
        setPendingEdit(null)
      } else {
        setError(err.message || 'Failed to check pending edits')
        console.error('Error checking pending edits:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const submitPendingEdits = async (editData: {
    profile_data: any
    team_members?: any[]
    documents?: any[]
    changes_summary: string
  }): Promise<boolean> => {
    if (!startupId || !user) {
      setError('Missing required data')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/startup/pending-edits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startup_id: startupId,
          user_id: user.id,
          ...editData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit changes')
      }

      setPendingEdit(data.pending_edit)
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to submit changes')
      console.error('Error submitting pending edits:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const cancelPendingEdits = async (): Promise<boolean> => {
    if (!pendingEdit) {
      setError('No pending edits to cancel')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/startup/pending-edits?pending_edit_id=${pendingEdit.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel pending edits')
      }

      setPendingEdit(null)
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to cancel pending edits')
      console.error('Error cancelling pending edits:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (startupId && user) {
      checkPendingEdits()
    }
  }, [startupId, user])

  return {
    pendingEdit,
    hasPendingEdits: !!pendingEdit && pendingEdit.status === 'pending',
    loading,
    error,
    submitPendingEdits,
    cancelPendingEdits,
    checkPendingEdits
  }
} 