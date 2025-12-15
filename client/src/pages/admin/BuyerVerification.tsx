/**
 * Admin Buyer Verification Page
 * Review and approve/reject buyer proof of funds submissions
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BuyerQualificationBadge } from '@/components/BuyerQualificationBadge';

export default function BuyerVerification() {
  const [selectedQualification, setSelectedQualification] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [verificationLevel, setVerificationLevel] = useState<'verified' | 'premium'>('verified');
  const [notes, setNotes] = useState('');
  
  const { data: pending, isLoading, refetch } = trpc.buyerQualification.getPending.useQuery();
  
  const approveMutation = trpc.buyerQualification.approve.useMutation({
    onSuccess: () => {
      toast.success('Buyer qualification approved');
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  
  const rejectMutation = trpc.buyerQualification.reject.useMutation({
    onSuccess: () => {
      toast.success('Buyer qualification rejected');
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  
  const closeDialog = () => {
    setSelectedQualification(null);
    setReviewAction(null);
    setNotes('');
    setVerificationLevel('verified');
  };
  
  const handleReview = (qualification: any, action: 'approve' | 'reject') => {
    setSelectedQualification(qualification);
    setReviewAction(action);
  };
  
  const handleSubmitReview = () => {
    if (!selectedQualification) return;
    
    if (reviewAction === 'approve') {
      approveMutation.mutate({
        userId: selectedQualification.userId,
        verificationLevel,
        verificationNotes: notes || undefined,
      });
    } else if (reviewAction === 'reject') {
      if (!notes.trim()) {
        toast.error('Please provide a reason for rejection');
        return;
      }
      rejectMutation.mutate({
        userId: selectedQualification.userId,
        verificationNotes: notes,
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Buyer Verification</h1>
        <p className="text-muted-foreground">
          Review and approve buyer proof of funds submissions
        </p>
      </div>
      
      {pending && pending.length > 0 ? (
        <div className="grid gap-4">
          {pending.map((qualification) => (
            <Card key={qualification.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>User ID: {qualification.userId}</CardTitle>
                    <CardDescription>
                      Submitted {new Date(qualification.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <BuyerQualificationBadge level={qualification.verificationLevel} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Proof of Funds Amount</div>
                    <div className="font-semibold text-lg">
                      ${qualification.proofOfFundsAmount?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Document Type</div>
                    <div className="font-medium">
                      {qualification.proofOfFundsType?.replace('_', ' ').toUpperCase() || 'N/A'}
                    </div>
                  </div>
                </div>
                
                {qualification.proofOfFundsUrl && (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => qualification.proofOfFundsUrl && window.open(qualification.proofOfFundsUrl, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Document
                    </Button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReview(qualification, 'approve')}
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReview(qualification, 'reject')}
                    className="gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Pending Verifications</h3>
            <p className="text-sm text-muted-foreground">
              All buyer qualification submissions have been reviewed
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Review Dialog */}
      <Dialog open={!!reviewAction} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Buyer Qualification
            </DialogTitle>
            <DialogDescription>
              User ID: {selectedQualification?.userId} - 
              ${selectedQualification?.proofOfFundsAmount?.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {reviewAction === 'approve' && (
              <div>
                <Label htmlFor="level">Verification Level</Label>
                <Select
                  value={verificationLevel}
                  onValueChange={(value: 'verified' | 'premium') => setVerificationLevel(value)}
                >
                  <SelectTrigger id="level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Premium: For high-value buyers with exceptional credentials
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="notes">
                {reviewAction === 'approve' ? 'Notes (Optional)' : 'Rejection Reason (Required)'}
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  reviewAction === 'approve'
                    ? 'Add any internal notes...'
                    : 'Explain why this submission was rejected...'
                }
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            >
              {(approveMutation.isPending || rejectMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {reviewAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
