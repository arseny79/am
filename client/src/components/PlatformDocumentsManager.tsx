import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileText, Plus, Edit, Eye, Save, X, Calendar, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DocumentForm {
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
}

// Version badge colors based on version number
const getVersionColor = (version: number) => {
  const colors = [
    "bg-purple-100 text-purple-700",
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
  ];
  return colors[version % colors.length];
};

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
      setEditingDoc(null);
    },
    onError: (error) => {
      toast.error("Failed to delete document: " + error.message);
    },
  });

  const togglePublishMutation = trpc.platformDocuments.togglePublish.useMutation({
    onSuccess: (data) => {
      toast.success(data.isPublished ? "Document published" : "Document unpublished");
      refetch();
      // Update editing doc if currently editing
      if (editingDoc) {
        setEditingDoc({ ...editingDoc, isPublished: data.isPublished });
      }
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

  const handleDelete = () => {
    if (!editingDoc?.slug) return;
    if (confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate({ slug: editingDoc.slug });
    }
  };

  const handleTogglePublish = () => {
    if (!editingDoc?.slug) return;
    togglePublishMutation.mutate({ slug: editingDoc.slug });
  };

  const handleCancel = () => {
    setEditingDoc(null);
    setShowPreview(false);
  };

  const handleView = (slug: string) => {
    window.open(`/legal/${slug}`, "_blank");
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
              View and edit legal documents. Changes increment the version number automatically.
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

                <div className="flex items-center justify-between pt-4 border-t">
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
                  {documents?.find(d => d.slug === editingDoc.slug) && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTogglePublish}
                        disabled={togglePublishMutation.isPending}
                      >
                        {editingDoc.isPublished ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
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
          /* Document Grid */
          <div className="space-y-4">
            {!documents || documents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents yet. Create your first document to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <Card key={doc.id} className="relative hover:shadow-md transition-shadow">
                    {/* Version Badge */}
                    <div className="absolute top-4 right-4">
                      <Badge className={`${getVersionColor(doc.version)} font-semibold`}>
                        {doc.version}.0.{doc.version}
                      </Badge>
                    </div>

                    <CardContent className="pt-6 pb-4">
                      {/* Document Icon */}
                      <div className="flex justify-center mb-4">
                        <div className="p-4 rounded-lg bg-muted">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Document Title */}
                      <h3 className="font-semibold text-center mb-4 min-h-[3rem] flex items-center justify-center">
                        {doc.title}
                      </h3>

                      {/* Metadata */}
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Updated {new Date(doc.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Created {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(doc.slug)}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(doc)}
                          className="w-full"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
