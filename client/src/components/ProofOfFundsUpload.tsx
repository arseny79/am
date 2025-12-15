/**
 * Proof of Funds Upload Component
 * Allows buyers to upload bank statements or financial verification
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
// Storage upload via tRPC

export function ProofOfFundsUpload() {
  const [uploading, setUploading] = useState(false);
  const [amount, setAmount] = useState('');
  const [docType, setDocType] = useState<'bank_statement' | 'credit_line' | 'investor_letter' | 'other'>('bank_statement');
  
  const { data: qualificationData, refetch } = trpc.buyerQualification.getMyQualification.useQuery();
  const submitMutation = trpc.buyerQualification.submitProofOfFunds.useMutation({
    onSuccess: () => {
      toast.success('Proof of funds submitted successfully!');
      refetch();
      setAmount('');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF and image files are allowed');
      return;
    }
    
    try {
      setUploading(true);
      
      // Upload to S3
      const fileBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(fileBuffer);
      const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array) as any));
      
      // Use tRPC storage upload
      const uploadResult = await new Promise<{ url: string }>((resolve, reject) => {
        // Call tRPC storage router
        fetch('/api/trpc/storage.upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: `proof-of-funds/${Date.now()}-${file.name}`,
            data: base64,
            contentType: file.type,
          }),
        })
          .then(res => res.json())
          .then(data => resolve(data.result.data))
          .catch(reject);
      });
      
      const url = uploadResult.url;
      
      // Submit to backend
      const amountNum = parseInt(amount.replace(/,/g, ''));
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error('Please enter a valid amount');
        setUploading(false);
        return;
      }
      
      await submitMutation.mutateAsync({
        proofOfFundsUrl: url,
        proofOfFundsAmount: amountNum,
        proofOfFundsType: docType,
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };
  
  const qualification = qualificationData?.qualification;
  const status = qualification?.status;
  const level = qualification?.verificationLevel || 'basic';
  
  // Status display
  const getStatusDisplay = () => {
    if (!qualification) {
      return {
        icon: Upload,
        color: 'text-gray-500',
        title: 'Not Submitted',
        description: 'Upload proof of funds to get verified',
      };
    }
    
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          title: 'Under Review',
          description: 'Our team is reviewing your submission (24-48 hours)',
        };
      case 'approved':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          title: 'Verified',
          description: `Verified as ${level} buyer with $${qualification.proofOfFundsAmount?.toLocaleString()} capacity`,
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-500',
          title: 'Rejected',
          description: qualification.verificationNotes || 'Please submit updated documentation',
        };
      case 'expired':
        return {
          icon: Clock,
          color: 'text-orange-500',
          title: 'Expired',
          description: 'Your verification has expired. Please submit updated proof of funds',
        };
      default:
        return {
          icon: Upload,
          color: 'text-gray-500',
          title: 'Not Submitted',
          description: 'Upload proof of funds to get verified',
        };
    }
  };
  
  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;
  const canUpload = !qualification || status === 'rejected' || status === 'expired';
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-6 h-6 ${statusDisplay.color}`} />
          <div>
            <CardTitle>{statusDisplay.title}</CardTitle>
            <CardDescription>{statusDisplay.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {status === 'approved' && qualification?.expiresAt && (
          <Alert className="mb-4">
            <AlertDescription>
              Verification expires on {new Date(qualification.expiresAt).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        )}
        
        {canUpload && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Available Funds (USD)</Label>
              <Input
                id="amount"
                type="text"
                placeholder="e.g., 500,000"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setAmount(value ? parseInt(value).toLocaleString() : '');
                }}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the total amount you can deploy for an acquisition
              </p>
            </div>
            
            <div>
              <Label htmlFor="docType">Document Type</Label>
              <Select
                value={docType}
                onValueChange={(value: any) => setDocType(value)}
                disabled={uploading}
              >
                <SelectTrigger id="docType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_statement">Bank Statement</SelectItem>
                  <SelectItem value="credit_line">Credit Line Letter</SelectItem>
                  <SelectItem value="investor_letter">Investor Commitment Letter</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="file">Upload Document (PDF or Image)</Label>
              <div className="mt-2">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading || !amount}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Max file size: 10MB. Accepted formats: PDF, JPG, PNG
              </p>
            </div>
            
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading and submitting...
              </div>
            )}
          </div>
        )}
        
        {status === 'pending' && (
          <Alert>
            <FileText className="w-4 h-4" />
            <AlertDescription>
              Your proof of funds is being reviewed. You'll receive an email notification once verified.
            </AlertDescription>
          </Alert>
        )}
        
        {!canUpload && status !== 'pending' && (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              You're all set! You now have full access to all listings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
