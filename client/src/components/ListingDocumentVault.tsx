import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Lock,
  Unlock,
  Eye,
  Shield,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ListingDocumentVaultProps {
  listingId: number;
  isOwner: boolean;
}

type AccessLevel = "public" | "nda_gated" | "request_only";

const ACCESS_LEVEL_INFO = {
  public: {
    label: "Public",
    description: "Anyone can view this document",
    icon: Unlock,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  nda_gated: {
    label: "NDA Required",
    description: "Requires signed NDA to access",
    icon: Shield,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  request_only: {
    label: "Seller Approval Required",
    description: "Requires seller approval",
    icon: Lock,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
};

export function ListingDocumentVault({ listingId, isOwner }: ListingDocumentVaultProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("nda_gated");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: documents = [], refetch } = trpc.listingDocument.getByListing.useQuery(
    { listingId },
    { enabled: listingId > 0 }
  );

  const uploadMutation = trpc.listingDocument.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDescription("");
      setUploading(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to upload document: " + error.message);
      setUploading(false);
    },
  });

  const updateAccessMutation = trpc.listingDocument.updateAccessLevel.useMutation({
    onSuccess: () => {
      toast.success("Document visibility updated");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update document visibility: " + error.message);
    },
  });

  const deleteMutation = trpc.listingDocument.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete document: " + error.message);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result?.toString().split(",")[1];
        if (!base64) {
          setUploading(false);
          return;
        }

        uploadMutation.mutate({
          listingId,
          fileName: selectedFile.name,
          fileData: base64,
          accessLevel,
          category,
          description: description || undefined,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error("Failed to read file");
      setUploading(false);
    }
  };

  const handleAccessLevelChange = (documentId: number, newAccessLevel: AccessLevel) => {
    updateAccessMutation.mutate({
      documentId,
      accessLevel: newAccessLevel,
    });
  };

  const handleDelete = (documentId: number, fileName: string) => {
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      deleteMutation.mutate({ documentId });
    }
  };

  const getAccessBadge = (level: AccessLevel) => {
    const info = ACCESS_LEVEL_INFO[level];
    const Icon = info.icon;
    return (
      <Badge className={info.color} variant="secondary">
        <Icon className="h-3 w-3 mr-1" />
        {info.label}
      </Badge>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Vault
            </CardTitle>
            <CardDescription>
              {isOwner
                ? "Upload and manage documents with access control"
                : "View available documents for this listing"}
            </CardDescription>
          </div>
          {isOwner && (
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Add a document to your listing with visibility settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="file">File (max 10MB)</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="access-level">Document Visibility</Label>
                    <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v as AccessLevel)}>
                      <SelectTrigger id="access-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACCESS_LEVEL_INFO).map(([key, info]) => {
                          const Icon = info.icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{info.label}</div>
                                  <div className="text-xs text-muted-foreground">{info.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the document..."
                      rows={3}
                      disabled={uploading}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                    {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isOwner ? "No documents uploaded yet" : "No documents available"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="font-medium truncate">{doc.fileName}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <span>{formatFileSize(doc.fileSize || undefined)}</span>
                    <span>•</span>
                    <span className="capitalize">{doc.category}</span>
                    <span>•</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                  {doc.description && (
                    <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {isOwner ? (
                    <>
                      <Select
                        value={doc.accessLevel}
                        onValueChange={(v) => handleAccessLevelChange(doc.id, v as AccessLevel)}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ACCESS_LEVEL_INFO).map(([key, info]) => {
                            const Icon = info.icon;
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {info.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(doc.id, doc.fileName)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {getAccessBadge(doc.accessLevel)}
                      {doc.canAccess && doc.fileUrl ? (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      ) : (
                        <Button size="sm" variant="ghost" disabled>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
