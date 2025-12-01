import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";


export function DocumentUploadForm() {
  const [idFile, setIdFile] = useState<File | null>(null);
  const [fundsFile, setFundsFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [fundsAmount, setFundsAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [uploading, setUploading] = useState(false);

  const utils = trpc.useUtils();
  const uploadDocuments = trpc.verification.uploadDocuments.useMutation({
    onSuccess: () => {
      toast.success("Documents uploaded successfully!");
      utils.verification.getStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const submitForReview = trpc.verification.submitForReview.useMutation({
    onSuccess: () => {
      toast.success("Verification submitted for review!");
      utils.verification.getStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "id" | "funds") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and PDF files are allowed");
      return;
    }

    if (type === "id") {
      setIdFile(file);
    } else {
      setFundsFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idFile || !fundsFile) {
      toast.error("Please upload both ID and proof of funds");
      return;
    }

    if (!fullName || !dateOfBirth || !address || !fundsAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);

    try {
      // Upload ID document to S3
      const idBuffer = await idFile.arrayBuffer();
      const idKey = `verification-docs/${Date.now()}-id-${idFile.name}`;
      const idBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(idBuffer))));
      const { url: idUrl } = await utils.client.storage.upload.mutate({
        key: idKey,
        data: idBase64,
        contentType: idFile.type,
      });

      // Upload proof of funds to S3
      const fundsBuffer = await fundsFile.arrayBuffer();
      const fundsKey = `verification-docs/${Date.now()}-funds-${fundsFile.name}`;
      const fundsBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(fundsBuffer))));
      const { url: fundsUrl } = await utils.client.storage.upload.mutate({
        key: fundsKey,
        data: fundsBase64,
        contentType: fundsFile.type,
      });

      // Submit to backend
      await uploadDocuments.mutateAsync({
        idDocumentUrl: idUrl,
        proofOfFundsUrl: fundsUrl,
        fullName,
        dateOfBirth,
        address,
        fundsAmount: parseFloat(fundsAmount),
        bankName: bankName || undefined,
      });

      // Auto-submit for review
      await submitForReview.mutateAsync();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload documents. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Verification Documents</CardTitle>
        <CardDescription>
          Please provide your identification and proof of funds to complete verification
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Personal Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name (as shown on ID) *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State, ZIP"
                required
              />
            </div>
          </div>

          {/* ID Document Upload */}
          <div className="space-y-2">
            <Label htmlFor="idDocument">Government-Issued ID *</Label>
            <p className="text-sm text-muted-foreground">
              Upload a clear photo of your driver's license, passport, or government ID
            </p>
            <div className="flex items-center gap-4">
              <Input
                id="idDocument"
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={(e) => handleFileChange(e, "id")}
                className="cursor-pointer"
              />
              {idFile && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {idFile.name}
                </div>
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Financial Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="fundsAmount">Available Funds (USD) *</Label>
              <Input
                id="fundsAmount"
                type="number"
                value={fundsAmount}
                onChange={(e) => setFundsAmount(e.target.value)}
                placeholder="100000"
                min="0"
                step="1000"
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter the amount you have available for acquisition
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name (Optional)</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Chase, Bank of America, etc."
              />
            </div>
          </div>

          {/* Proof of Funds Upload */}
          <div className="space-y-2">
            <Label htmlFor="fundsDocument">Proof of Funds *</Label>
            <p className="text-sm text-muted-foreground">
              Upload a recent bank statement, investment account statement, or letter from your financial institution
            </p>
            <div className="flex items-center gap-4">
              <Input
                id="fundsDocument"
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={(e) => handleFileChange(e, "funds")}
                className="cursor-pointer"
              />
              {fundsFile && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {fundsFile.name}
                </div>
              )}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Privacy & Security:</strong> Your documents are encrypted and stored securely. 
              They will only be reviewed by our verification team and will not be shared with third parties.
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            disabled={uploading || !idFile || !fundsFile || !fullName || !dateOfBirth || !address || !fundsAmount}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading Documents...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit for Verification
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
