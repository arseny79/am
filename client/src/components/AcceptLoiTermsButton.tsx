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
import { Upload, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

interface UploadLoiButtonProps {
  dealId: number;
  currentStage: string;
  label?: string;
  onSuccess?: () => void;
}

export function UploadLoiButton({ dealId, currentStage, label = 'Upload LOI', onSuccess }: UploadLoiButtonProps) {
  if (currentStage !== 'negotiation') return null;

  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadDocMutation = trpc.document.upload.useMutation();

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
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
    const isValidType = file.type === 'application/pdf'
      || file.type === 'application/msword'
      || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      || /\.(pdf|doc|docx)$/i.test(file.name);
    if (!isValidType) {
      setFileError('Only PDF, DOC, or DOCX files are accepted');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setFileError('File must be under 50MB');
      return;
    }
    setSelectedFile(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
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
        description: notes.trim() || 'Letter of Intent',
      });

      toast.success('LOI uploaded to the deal vault. The other party has been notified.');
      handleOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Failed to upload LOI. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full bg-green-600 hover:bg-green-700 text-white">
        <Upload className="h-4 w-4 mr-2" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{label}</DialogTitle>
            <DialogDescription>
              Upload your prepared LOI document. The platform does not create LOI documents — your own file is uploaded as-is.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Platform disclaimer */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-700 flex-shrink-0" />
                <p className="text-sm font-bold text-blue-700">Prepare your LOI externally</p>
              </div>
              <p className="text-sm text-blue-800 leading-relaxed">
                msp.investments does not provide legal advice or create LOI documents. Please prepare your Letter of Intent with your own legal counsel or using your own template, then upload the final file here.
              </p>
            </div>

            {/* Checklist */}
            <div>
              <p className="text-sm font-semibold mb-2">A typical LOI includes:</p>
              <ul className="space-y-1.5">
                {[
                  'Proposed purchase price and payment structure',
                  'Intended closing timeline',
                  'Exclusivity period (typically 30–60 days)',
                  'Key conditions or contingencies',
                  'Transition support expectations',
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
              <label className="text-sm font-semibold block mb-2">Upload your LOI document</label>
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
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, or DOCX · Max 50MB</p>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
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

            {/* Optional note */}
            <div>
              <label className="text-sm font-semibold block mb-1.5">
                Add a note <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please review the attached LOI. Happy to discuss any terms in the Messages tab."
                rows={3}
              />
            </div>

            {/* Legal disclaimer */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2.5 items-start">
              <AlertTriangle className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 leading-relaxed">
                <strong>Disclaimer:</strong> msp.investments is not a legal advisor or broker. We recommend consulting a legal professional before submitting or accepting any LOI.
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? (
                  <><span className="animate-spin mr-2">⏳</span> Uploading…</>
                ) : (
                  <><Upload className="h-4 w-4 mr-1.5" /> Upload</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Backward-compatible alias
export { UploadLoiButton as AcceptLoiTermsButton };
