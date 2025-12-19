import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";

const CREDENTIAL_TYPES = [
  { value: "license", label: "Professional License" },
  { value: "certification", label: "Industry Certification" },
  { value: "degree", label: "Educational Degree" },
  { value: "insurance", label: "Professional Liability Insurance" },
  { value: "other", label: "Other" },
] as const;

export function CredentialUpload() {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    credentialType: "",
    title: "",
    issuingOrganization: "",
    issueDate: "",
    expiryDate: "",
    credentialNumber: "",
  });

  const { data: credentials, refetch } = trpc.professional.getMyCredentials.useQuery();

  const uploadCredential = trpc.professional.uploadCredential.useMutation({
    onSuccess: () => {
      toast.success("Credential uploaded successfully!");
      setFormData({
        credentialType: "",
        title: "",
        issuingOrganization: "",
        issueDate: "",
        expiryDate: "",
        credentialNumber: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload credential");
    },
  });

  const deleteCredential = trpc.professional.deleteCredential.useMutation({
    onSuccess: () => {
      toast.success("Credential deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete credential");
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type (PDF, images)
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF and image files are allowed");
      return;
    }

    setUploading(true);

    try {
      // Upload to server
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/upload/document", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await response.json();

      // Submit credential with file URL
      uploadCredential.mutate({
        credentialType: formData.credentialType as any,
        title: formData.title,
        issuingOrganization: formData.issuingOrganization || undefined,
        issueDate: formData.issueDate ? new Date(formData.issueDate) : undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        credentialNumber: formData.credentialNumber || undefined,
        fileUrl: url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
    }
  };

  const canUpload = formData.credentialType && formData.title;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Credential</CardTitle>
          <CardDescription>
            Upload professional credentials for verification. Verified credentials will display a badge on your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="credentialType">Credential Type *</Label>
            <Select
              value={formData.credentialType}
              onValueChange={(value) => setFormData({ ...formData, credentialType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select credential type" />
              </SelectTrigger>
              <SelectContent>
                {CREDENTIAL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Credential Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., CPA License, M&A Certification"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issuingOrganization">Issuing Organization</Label>
              <Input
                id="issuingOrganization"
                value={formData.issuingOrganization}
                onChange={(e) => setFormData({ ...formData, issuingOrganization: e.target.value })}
                placeholder="e.g., State Bar of California"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credentialNumber">Credential Number</Label>
              <Input
                id="credentialNumber"
                value={formData.credentialNumber}
                onChange={(e) => setFormData({ ...formData, credentialNumber: e.target.value })}
                placeholder="License/Certificate number"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload Document (PDF or Image, max 10MB) *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={!canUpload || uploading}
                className="cursor-pointer"
              />
              <Button type="button" disabled={!canUpload || uploading}>
                {uploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
            {!canUpload && (
              <p className="text-sm text-muted-foreground">
                Please fill in credential type and title before uploading
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Existing Credentials */}
      {credentials && credentials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Credentials</CardTitle>
            <CardDescription>
              Manage your uploaded credentials and view verification status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{credential.title}</h4>
                        {getStatusBadge(credential.verificationStatus)}
                      </div>
                      {credential.issuingOrganization && (
                        <p className="text-sm text-muted-foreground">
                          {credential.issuingOrganization}
                        </p>
                      )}
                      {credential.credentialNumber && (
                        <p className="text-sm text-muted-foreground">
                          #{credential.credentialNumber}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {credential.issueDate && (
                          <span>
                            Issued: {new Date(credential.issueDate).toLocaleDateString()}
                          </span>
                        )}
                        {credential.expiryDate && (
                          <span>
                            Expires: {new Date(credential.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {credential.rejectionReason && (
                        <p className="text-sm text-destructive mt-2">
                          Rejection reason: {credential.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(credential.fileUrl, "_blank")}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this credential?")) {
                          deleteCredential.mutate({ credentialId: credential.id });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
