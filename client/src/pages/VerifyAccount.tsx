import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, CheckCircle2, FileText, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
// Storage handled via tRPC

interface UploadedFile {
  file: File;
  preview: string;
}

function VerifyAccountContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [governmentId, setGovernmentId] = useState<UploadedFile | null>(null);
  const [proofOfAddress, setProofOfAddress] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: kycStatus, isLoading: statusLoading } = trpc.kyc.getMyStatus.useQuery();
  const { data: myDocuments } = trpc.kyc.getMyDocuments.useQuery();

  const submitMutation = trpc.kyc.submitDocuments.useMutation({
    onSuccess: () => {
      toast.success("KYC documents submitted successfully! We'll review them within 24-48 hours.");
      setTimeout(() => setLocation("/profile"), 2000);
    },
    onError: (error) => {
      toast.error("Failed to submit documents: " + error.message);
      setIsUploading(false);
    },
  });

  const handleFileSelect = (type: "government_id" | "proof_of_address", file: File) => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload JPG, PNG, or PDF files only");
      return;
    }

    const preview = URL.createObjectURL(file);
    const uploadedFile = { file, preview };

    if (type === "government_id") {
      setGovernmentId(uploadedFile);
    } else {
      setProofOfAddress(uploadedFile);
    }
  };

  const handleSubmit = async () => {
    if (!governmentId || !proofOfAddress) {
      toast.error("Please upload both documents");
      return;
    }

    setIsUploading(true);

    try {
      // Convert files to base64 for upload via tRPC
      const documents = [];

      // Upload Government ID
      const idBuffer = await governmentId.file.arrayBuffer();
      const idBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(idBuffer))));
      const idKey = `kyc/${user?.id}/government-id-${Date.now()}.${governmentId.file.name.split('.').pop()}`;
      
      // Upload via tRPC storage router
      const idUploadResult = await fetch('/api/trpc/storage.upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: idKey,
          data: idBase64,
          contentType: governmentId.file.type,
        }),
      });
      const idResult = await idUploadResult.json();
      
      documents.push({
        documentType: "government_id" as const,
        fileName: governmentId.file.name,
        fileUrl: idResult.result.data.url,
        fileSize: governmentId.file.size,
        mimeType: governmentId.file.type,
      });

      // Upload Proof of Address
      const addressBuffer = await proofOfAddress.file.arrayBuffer();
      const addressBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(addressBuffer))));
      const addressKey = `kyc/${user?.id}/proof-of-address-${Date.now()}.${proofOfAddress.file.name.split('.').pop()}`;
      
      const addressUploadResult = await fetch('/api/trpc/storage.upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: addressKey,
          data: addressBase64,
          contentType: proofOfAddress.file.type,
        }),
      });
      const addressResult = await addressUploadResult.json();
      
      documents.push({
        documentType: "proof_of_address" as const,
        fileName: proofOfAddress.file.name,
        fileUrl: addressResult.result.data.url,
        fileSize: proofOfAddress.file.size,
        mimeType: proofOfAddress.file.type,
      });

      // Submit to backend
      await submitMutation.mutateAsync({ documents });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload documents. Please try again.");
      setIsUploading(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Already verified
  if (kycStatus?.kycVerified) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">{APP_TITLE}</span>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <CardTitle>Account Verified</CardTitle>
              </div>
              <CardDescription>
                Your account has been successfully verified on{" "}
                {kycStatus.kycReviewedAt ? new Date(kycStatus.kycReviewedAt).toLocaleDateString() : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/create-listing">
                <Button className="w-full">Create Your First Listing</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Pending review
  if (kycStatus?.kycSubmittedAt && !kycStatus?.kycRejectionReason) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">{APP_TITLE}</span>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 text-orange-600 animate-spin" />
                <CardTitle>Verification Pending</CardTitle>
              </div>
              <CardDescription>
                Your documents are under review. We'll notify you within 24-48 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Submitted documents:</p>
                <ul className="space-y-1">
                  {myDocuments?.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{doc.documentType === "government_id" ? "Government ID" : "Proof of Address"}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/profile">
                <Button variant="outline" className="w-full">Back to Profile</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Show upload form
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">{APP_TITLE}</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Verify Your Account</h1>
            <p className="text-muted-foreground">
              Complete FREE verification to list your MSP or access confidential listing details.
            </p>
          </div>

          {kycStatus?.kycRejectionReason && (
            <Card className="mb-6 border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Verification Rejected</CardTitle>
                <CardDescription>{kycStatus.kycRejectionReason}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Please upload new documents below.</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Upload Verification Documents</CardTitle>
              <CardDescription>
                We need two documents to verify your identity. All information is kept confidential.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Government ID */}
              <div className="space-y-2">
                <Label>Government-Issued ID</Label>
                <p className="text-sm text-muted-foreground">
                  Passport, driver's license, or national ID card
                </p>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {governmentId ? (
                    <div className="space-y-2">
                      <FileText className="h-12 w-12 mx-auto text-green-600" />
                      <p className="text-sm font-medium">{governmentId.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(governmentId.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGovernmentId(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, or PDF (max 5MB)
                      </p>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect("government_id", file);
                        }}
                        className="hidden"
                        id="government-id-upload"
                      />
                      <label htmlFor="government-id-upload">
                        <Button variant="outline" size="sm" asChild>
                          <span>Select File</span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Proof of Address */}
              <div className="space-y-2">
                <Label>Proof of Address</Label>
                <p className="text-sm text-muted-foreground">
                  Utility bill, bank statement, or government correspondence (issued within last 3 months)
                </p>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {proofOfAddress ? (
                    <div className="space-y-2">
                      <FileText className="h-12 w-12 mx-auto text-green-600" />
                      <p className="text-sm font-medium">{proofOfAddress.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(proofOfAddress.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProofOfAddress(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, or PDF (max 5MB)
                      </p>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect("proof_of_address", file);
                        }}
                        className="hidden"
                        id="proof-of-address-upload"
                      />
                      <label htmlFor="proof-of-address-upload">
                        <Button variant="outline" size="sm" asChild>
                          <span>Select File</span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!governmentId || !proofOfAddress || isUploading}
                  className="flex-1"
                >
                  {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit for Review
                </Button>
                <Link href="/profile">
                  <Button variant="outline">Cancel</Button>
                </Link>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>✓ Your documents are encrypted and stored securely</p>
                <p>✓ We review submissions within 24-48 hours</p>
                <p>✓ Verification is valid for 12 months</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function VerifyAccount() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Please sign in to verify your account</p>
        <a href={getLoginUrl()}>
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  return <VerifyAccountContent />;
}
