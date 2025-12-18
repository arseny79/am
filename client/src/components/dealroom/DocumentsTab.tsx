import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { FileText, Upload, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DocumentsTabProps {
  dealId: number;
}

export function DocumentsTab({ dealId }: DocumentsTabProps) {
  const [uploadingFile, setUploadingFile] = useState(false);

  const { data: documents = [], refetch: refetchDocs } = trpc.document.getByDeal.useQuery(
    { dealId, latestOnly: true },
    { enabled: dealId > 0 }
  );

  const uploadDocMutation = trpc.document.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      refetchDocs();
      setUploadingFile(false);
    },
    onError: (error) => {
      toast.error("Failed to upload document: " + error.message);
      setUploadingFile(false);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result?.toString().split(",")[1];
        if (!base64) {
          setUploadingFile(false);
          return;
        }

        uploadDocMutation.mutate({
          dealId,
          fileName: file.name,
          fileData: base64,
          category: "general",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload document");
      setUploadingFile(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Vault
          </CardTitle>
          <CardDescription>
            Upload and manage deal documents with automatic version control
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Upload Area */}
          <div className="mb-6">
            <Label htmlFor="file-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                {uploadingFile ? (
                  <Loader2 className="h-10 w-10 mx-auto mb-3 text-primary animate-spin" />
                ) : (
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                )}
                <p className="text-sm font-medium mb-1">
                  {uploadingFile ? "Uploading..." : "Click to upload document"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, Word, Excel, or images up to 50MB
                </p>
              </div>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
              />
            </Label>
          </div>

          {/* Documents List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Uploaded Documents ({documents.length})
            </h3>
            
            {documents.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No documents uploaded yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload your first document to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        v{doc.version} • Uploaded by {doc.uploader?.name || "Unknown"} •{" "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4"
                    >
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
