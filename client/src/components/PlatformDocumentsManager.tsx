import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileText, Plus, Edit, Trash2, Eye, EyeOff, Save, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DocumentForm {
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
}

export default function PlatformDocumentsManager() {
  const [editingDoc, setEditingDoc] = useState<DocumentForm | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch all documents
  const { data: documents, refetch } = trpc.platformDocuments.listAll.useQuery();

  // Mutations
  const upsertMutation = trpc.platformDocuments.upsert.useMutation({
    onSuccess: () => {
      toast.success("Document saved successfully");
      refetch();
      setEditingDoc(null);
    },
    onError: (error) => {
      toast.error("Failed to save document: " + error.message);
    },
  });

  const deleteMutation = trpc.platformDocuments.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete document: " + error.message);
    },
  });

  const togglePublishMutation = trpc.platformDocuments.togglePublish.useMutation({
    onSuccess: (data) => {
      toast.success(data.isPublished ? "Document published" : "Document unpublished");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to toggle publish status: " + error.message);
    },
  });

  const handleCreateNew = () => {
    setEditingDoc({
      slug: "",
      title: "",
      content: "",
      isPublished: false,
    });
    setShowPreview(false);
  };

  const handleEdit = (doc: any) => {
    setEditingDoc({
      slug: doc.slug,
      title: doc.title,
      content: doc.content,
      isPublished: doc.isPublished,
    });
    setShowPreview(false);
  };

  const handleSave = () => {
    if (!editingDoc) return;
    
    if (!editingDoc.slug || !editingDoc.title || !editingDoc.content) {
      toast.error("Please fill in all fields");
      return;
    }

    upsertMutation.mutate(editingDoc);
  };

  const handleDelete = (slug: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate({ slug });
    }
  };

  const handleTogglePublish = (slug: string) => {
    togglePublishMutation.mutate({ slug });
  };

  const handleCancel = () => {
    setEditingDoc(null);
    setShowPreview(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Platform Documents
            </CardTitle>
            <CardDescription>
              Manage legal documents (Terms of Service, Privacy Policy, etc.)
            </CardDescription>
          </div>
          {!editingDoc && (
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {editingDoc ? (
          /* Document Editor */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingDoc.slug ? "Edit Document" : "Create New Document"}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? "Edit" : "Preview"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={upsertMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>

            {!showPreview ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="slug">
                    URL Slug <span className="text-muted-foreground">(e.g., "terms-of-service")</span>
                  </Label>
                  <Input
                    id="slug"
                    value={editingDoc.slug}
                    onChange={(e) => setEditingDoc({ ...editingDoc, slug: e.target.value })}
                    placeholder="terms-of-service"
                    disabled={!!documents?.find(d => d.slug === editingDoc.slug)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Document will be available at /legal/{editingDoc.slug}
                  </p>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editingDoc.title}
                    onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                    placeholder="Terms of Service"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content (Markdown)</Label>
                  <Textarea
                    id="content"
                    value={editingDoc.content}
                    onChange={(e) => setEditingDoc({ ...editingDoc, content: e.target.value })}
                    placeholder="# Terms of Service&#10;&#10;Last updated: [Date]&#10;&#10;## 1. Acceptance of Terms..."
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={editingDoc.isPublished}
                    onChange={(e) => setEditingDoc({ ...editingDoc, isPublished: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isPublished" className="font-normal">
                    Publish document (make it publicly visible)
                  </Label>
                </div>
              </div>
            ) : (
              /* Preview Mode */
              <div className="border rounded-lg p-6 bg-background prose prose-sm max-w-none">
                <ReactMarkdown>{editingDoc.content}</ReactMarkdown>
              </div>
            )}
          </div>
        ) : (
          /* Document List */
          <div className="space-y-4">
            {!documents || documents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents yet. Create your first document to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{doc.title}</h4>
                        <Badge variant={doc.isPublished ? "default" : "secondary"}>
                          {doc.isPublished ? "Published" : "Draft"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          v{doc.version}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        /legal/{doc.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublish(doc.slug)}
                        disabled={togglePublishMutation.isPending}
                      >
                        {doc.isPublished ? (
                          <><EyeOff className="h-4 w-4 mr-2" /> Unpublish</>
                        ) : (
                          <><Eye className="h-4 w-4 mr-2" /> Publish</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(doc.slug)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
