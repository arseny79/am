import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { FileText, Upload, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface AcceptLoiTermsButtonProps {
  dealId: number;
  currentStage: string;
  onSuccess?: () => void;
}

export function AcceptLoiTermsButton({ dealId, currentStage, onSuccess }: AcceptLoiTermsButtonProps) {
  if (currentStage !== 'negotiation') return null;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadDocMutation = trpc.document.upload.useMutation();
  const acceptLoiMutation = trpc.deal.acceptLoiTerms.useMutation();

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setStep(1);
      setSelectedFile(null);
      setFileError(null);
      setNotes('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    setSelectedFile(null);
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are accepted for LOI submission');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File must be under 10MB');
      return;
    }
    setSelectedFile(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleAccept = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result?.toString().split(',')[1];
          if (result) resolve(result);
          else reject(new Error('Failed to read file'));
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      await uploadDocMutation.mutateAsync({
        dealId,
        fileName: selectedFile.name,
        fileData: base64,
        category: 'loi',
        description: 'Letter of Intent submitted by buyer',
      });

      await acceptLoiMutation.mutateAsync({
        dealId,
        notes: notes.trim() || undefined,
      });

      toast.success('LOI submitted and deal advanced to escrow stage.');
      setOpen(false);
      setStep(1);
      setSelectedFile(null);
      setNotes('');
      onSuccess?.();
    } catch (err: any) {
      toast.error('Failed to upload LOI document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        <FileText className="h-4 w-4 mr-2" />
        Accept LOI Terms
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">

          {/* Step indicator */}
          <div className="flex items-center justify-between mb-1">
            <div>
              <DialogTitle className="text-lg font-bold">
                {step === 1 ? 'Submit Your Letter of Intent (LOI)' : 'Confirm LOI Submission'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                {step === 1
                  ? 'Upload your prepared LOI document to proceed to escrow'
                  : "Review the commitment you're making before proceeding"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 1 ? 'bg-foreground text-background' : 'bg-green-600 text-white'
              }`}>
                {step === 1 ? '1' : <Check className="h-3 w-3" />}
              </div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 2 ? 'bg-foreground text-background' : 'bg-border text-muted-foreground'
              }`}>
                2
              </div>
            </div>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="space-y-4">

              {/* What is an LOI */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-700 flex-shrink-0" />
                  <p className="text-sm font-bold text-blue-700">What is a Letter of Intent?</p>
                </div>
                <p className="text-sm text-blue-800 leading-relaxed">
                  A Letter of Intent (LOI) is a non-binding document that outlines the key terms of your proposed acquisition — including the purchase price, payment structure, transition period, and any conditions. It signals your serious intent to proceed and gives the seller a clear picture of your offer before moving to the formal purchase agreement.
                </p>
              </div>

              {/* Checklist */}
              <div>
                <p className="text-sm font-semibold mb-2">Your LOI should include:</p>
                <ul className="space-y-1.5">
                  {[
                    'Proposed purchase price and payment structure (cash, earnout, seller financing, etc.)',
                    'Intended closing timeline',
                    'Exclusivity period requested (typically 30–60 days)',
                    'Key conditions or contingencies (e.g., financing, due diligence findings)',
                    'Transition support expectations',
                    'Any assumptions about the business (e.g., key staff retention, contracts)',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Upload zone */}
              <div>
                <label className="text-sm font-semibold block mb-2">Upload your LOI</label>
                <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-border rounded-lg p-7 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2.5" />
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PDF only · Max 10MB</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {fileError && (
                  <p className="text-sm text-destructive mt-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    {fileError}
                  </p>
                )}
              </div>

              {/* Legal disclaimer */}
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2.5 items-start">
                <AlertTriangle className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 leading-relaxed">
                  <strong>Important:</strong> We recommend consulting with a legal professional before submitting your LOI. The seller will review this document and may want to seek their own legal advice. You can discuss and negotiate the details of your LOI in the <strong>Messages</strong> tab before submitting.
                </p>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedFile}
                  className="bg-foreground text-background hover:opacity-90"
                >
                  Continue <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="space-y-4">

              {/* File confirmed banner */}
              {selectedFile && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-2.5">
                  <FileText className="h-4.5 w-4.5 text-green-700 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">📄 {selectedFile.name}</p>
                    <p className="text-xs text-green-700 mt-0.5">Will be added to the deal vault as your Letter of Intent</p>
                  </div>
                </div>
              )}

              {/* Exclusivity warning */}
              <div className="rounded-lg bg-amber-50 border border-amber-200 border-l-4 border-l-amber-600 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-700 flex-shrink-0" />
                  <p className="text-sm font-bold text-amber-700">Accepting the Letter of Intent means you agree to:</p>
                </div>
                <ul className="space-y-1">
                  {[
                    <span>Enter an <strong>exclusivity period</strong> (typically 30–60 days)</span>,
                    'Cease negotiations with other potential buyers',
                    'Proceed with finalizing the Asset Purchase Agreement',
                    'Move forward with escrow and closing processes',
                  ].map((item, i) => (
                    <li key={i} className="text-sm text-amber-700 pl-3 relative before:content-['•'] before:absolute before:left-0">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* What happens next */}
              <div>
                <p className="text-sm font-bold mb-2">What happens next:</p>
                <ul className="space-y-1.5">
                  {[
                    'Your LOI PDF is uploaded to the deal vault',
                    <span>Deal advances to <strong>Escrow</strong> stage</span>,
                    'Exclusivity period begins',
                    'Seller is notified and can review the document',
                    'Final agreement preparation starts',
                    'Escrow account setup initiated',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600 flex-shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Optional notes */}
              <div>
                <label className="text-sm font-semibold block mb-1.5">
                  Add a note to the seller <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please review the attached LOI. Happy to discuss any terms in the Messages tab."
                  rows={3}
                />
              </div>

              {/* Footer */}
              <div className="flex justify-between pt-1">
                <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span> Submitting…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1.5" /> Accept LOI Terms
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </>
  );
}
