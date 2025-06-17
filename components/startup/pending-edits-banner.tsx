"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Clock, CheckCircle, XCircle, AlertCircle, Eye, Trash2 } from "lucide-react"
import { usePendingEdits } from "@/lib/hooks/usePendingEdits"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface PendingEditsBannerProps {
  startupId: string
  className?: string
}

export default function PendingEditsBanner({ startupId, className }: PendingEditsBannerProps) {
  const { pendingEdit, hasPendingEdits, loading, cancelPendingEdits } = usePendingEdits(startupId)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const { toast } = useToast()

  const handleCancelPendingEdits = async () => {
    setCancelling(true)
    const success = await cancelPendingEdits()
    
    if (success) {
      toast({
        title: "Pending Changes Cancelled",
        description: "Your pending changes have been cancelled. You can now make new edits.",
        variant: "default"
      })
      setShowCancelDialog(false)
    } else {
      toast({
        title: "Error",
        description: "Failed to cancel pending changes. Please try again.",
        variant: "destructive"
      })
    }
    setCancelling(false)
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-16 bg-muted rounded-lg"></div>
      </div>
    )
  }

  if (!pendingEdit) {
    return null
  }

  const getStatusIcon = () => {
    switch (pendingEdit.status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = () => {
    switch (pendingEdit.status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Review</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Needs Revision</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusMessage = () => {
    switch (pendingEdit.status) {
      case 'pending':
        return "Your profile changes are pending admin review. Your current profile remains live and functional."
      case 'approved':
        return "Your profile changes have been approved and applied to your live profile."
      case 'rejected':
        return "Your profile changes need revision before they can be approved."
      default:
        return "Unknown status"
    }
  }

  return (
    <Card className={`border-l-4 ${
      pendingEdit.status === 'pending' ? 'border-l-amber-500 bg-amber-50/50' :
      pendingEdit.status === 'approved' ? 'border-l-green-500 bg-green-50/50' :
      'border-l-red-500 bg-red-50/50'
    } ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Profile Changes {getStatusBadge()}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Submitted {new Date(pendingEdit.submitted_at).toLocaleDateString()} at{' '}
                {new Date(pendingEdit.submitted_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          {pendingEdit.status === 'pending' && (
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Cancel Changes
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Pending Changes?</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel your pending changes? This action cannot be undone, 
                    and you'll need to resubmit any changes you want to make.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCancelDialog(false)}
                    disabled={cancelling}
                  >
                    Keep Changes
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelPendingEdits}
                    disabled={cancelling}
                  >
                    {cancelling ? "Cancelling..." : "Cancel Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground">{getStatusMessage()}</p>
        
        {pendingEdit.changes_summary && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Changes Summary:</h4>
            <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg border">
              {pendingEdit.changes_summary}
            </p>
          </div>
        )}

        {pendingEdit.status === 'rejected' && pendingEdit.rejection_reason && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Revision Required:</strong> {pendingEdit.rejection_reason}
            </AlertDescription>
          </Alert>
        )}

        {pendingEdit.admin_notes && pendingEdit.status !== 'rejected' && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Admin Notes:</h4>
            <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg border">
              {pendingEdit.admin_notes}
            </p>
          </div>
        )}

        {pendingEdit.reviewed_at && (
          <p className="text-xs text-muted-foreground">
            Reviewed on {new Date(pendingEdit.reviewed_at).toLocaleDateString()} at{' '}
            {new Date(pendingEdit.reviewed_at).toLocaleTimeString()}
          </p>
        )}

        {pendingEdit.status === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your current profile remains live and fully functional</li>
                  <li>• Admins will review your changes within 24-48 hours</li>
                  <li>• You'll receive an email notification when your changes are reviewed</li>
                  <li>• You cannot make new changes until these are processed</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 