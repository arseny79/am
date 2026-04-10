import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Upload, Edit2, Trash2, Eye, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface NDATemplate {
  id: number;
  name: string;
  description: string | null;
  isDefault: number | boolean;
  isActive: number | boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export function AdminNDATemplateManager() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NDATemplate | null>(null);
  
  // Form state
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Get available variables
  const availableVariables = trpc.ndaTemplate.getAvailableVariables.useQuery();

  // Get templates list
  const templatesList = trpc.ndaTemplate.listTemplates.useQuery({ includeInactive: true });

  // Get template details
  const templateDetails = trpc.ndaTemplate.getTemplate.useQuery(
    { templateId: selectedTemplate?.id || 0 },
    { enabled: !!selectedTemplate?.id }
  );

  // Upload mutation
  const uploadMutation = trpc.ndaTemplate.uploadTemplate.useMutation({
    onSuccess: () => {
      toast.success("NDA template uploaded successfully");
      setShowUploadDialog(false);
      setTemplateName("");
      setTemplateDescription("");
      setTemplateContent("");
      setIsDefault(false);
      templatesList.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload template");
    },
  });

  // Delete mutation
  const deleteMutation = trpc.ndaTemplate.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      setSelectedTemplate(null);
      templatesList.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete template");
    },
  });

  const handleUpload = () => {
    if (!templateName.trim()) {
      toast.error("Template name is required");
      return;
    }
    if (!templateContent.trim()) {
      toast.error("Template content is required");
      return;
    }

    uploadMutation.mutate({
      name: templateName,
      description: templateDescription,
      content: templateContent,
      isDefault,
    });
  };

  const handleDelete = (templateId: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate({ templateId });
    }
  };

  const insertVariable = (variableName: string) => {
    setTemplateContent((prev) => prev + `{{${variableName}}}`);
  };

  if (templatesList.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  const templates = templatesList.data || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>NDA Template Manager</CardTitle>
              <CardDescription>
                Manage NDA templates with variable placeholders for deals
              </CardDescription>
            </div>
            <Button onClick={() => setShowUploadDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Available Variables Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Available Variables</CardTitle>
          <CardDescription>
            Use these variables in your NDA templates. The system will automatically populate them with real data when generating NDAs for deals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <strong>Variable Format:</strong> Use double curly braces like <code className="bg-white px-1 py-0.5 rounded">{`{{buyerName}}`}</code> or <code className="bg-white px-1 py-0.5 rounded">{`{{currentDate}}`}</code>
            </AlertDescription>
          </Alert>

          {availableVariables.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold">Variable</th>
                    <th className="text-left py-2 px-3 font-semibold">Format</th>
                    <th className="text-left py-2 px-3 font-semibold">Description</th>
                    <th className="text-center py-2 px-3 font-semibold">Required</th>
                  </tr>
                </thead>
                <tbody>
                  {availableVariables.data?.map((variable, index) => (
                    <tr key={variable.variableName} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-2 px-3 font-medium">{variable.variableName}</td>
                      <td className="py-2 px-3">
                        <code className="bg-white px-2 py-1 rounded border text-xs">{`{{${variable.variableName}}}`}</code>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">{variable.description}</td>
                      <td className="py-2 px-3 text-center">
                        {variable.required ? (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>Note:</strong> When a deal is created, the system automatically generates an NDA using your template and populates these variables with actual buyer, seller, and listing information.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No NDA templates yet. Create one to get started.
            </AlertDescription>
          </Alert>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      {template.isDefault && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                      {!template.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Updated {new Date(template.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowPreviewDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(template.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create NDA Template</DialogTitle>
            <DialogDescription>
              Upload or paste your NDA template. Use <code className="bg-muted px-1 py-0.5 rounded">{`{{variableName}}`}</code> format for dynamic content.
            </DialogDescription>
          </DialogHeader>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <strong>Variable Format:</strong> Use double curly braces like <code className="bg-white px-1 py-0.5 rounded">{`{{buyerName}}`}</code> or <code className="bg-white px-1 py-0.5 rounded">{`{{currentDate}}`}</code>. Click any variable below to insert it into your template.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {/* Template Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  placeholder="e.g., Standard Acquisition NDA"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="templateDescription">Description (Optional)</Label>
                <Textarea
                  id="templateDescription"
                  placeholder="When to use this template..."
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="min-h-20"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                  Set as default template
                </Label>
              </div>
            </div>

            {/* Available Variables */}
            <div>
              <Label className="mb-3 block">Available Variables</Label>
              <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {availableVariables.data?.map((variable) => (
                    <Button
                      key={variable.variableName}
                      size="sm"
                      variant="outline"
                      onClick={() => insertVariable(variable.variableName)}
                      className="justify-start text-xs"
                      title={variable.description}
                    >
                      <span className="font-mono">{`{{${variable.variableName}}}`}</span>
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click to insert variable. Required variables marked with *
              </p>
            </div>

            {/* Template Content */}
            <div>
              <Label htmlFor="templateContent">Template Content (HTML)</Label>
              <Textarea
                id="templateContent"
                placeholder="Paste your NDA template HTML here..."
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                className="min-h-64 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Use {`{{variable}}`} format for placeholders. Example: {`{{buyerName}}`}, {`{{currentDate}}`}
              </p>
            </div>

            {/* Preview */}
            {templateContent && (
              <div>
                <Label>Preview</Label>
                <div className="border rounded-lg p-4 bg-white max-h-40 overflow-y-auto">
                  <div
                    dangerouslySetInnerHTML={{ __html: templateContent }}
                    className="prose prose-sm max-w-none"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending || !templateName.trim() || !templateContent.trim()}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Create Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          {templateDetails.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : templateDetails.data ? (
            <div className="space-y-4">
              {/* Variables Used */}
              {templateDetails.data.variables.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Variables Used</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {templateDetails.data.variables.map((variable) => (
                      <div key={variable.id} className="text-sm p-2 bg-gray-50 rounded">
                        <p className="font-mono text-xs">{`{{${variable.variableName}}}`}</p>
                        <p className="text-xs text-muted-foreground">{variable.displayName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Content */}
              <div>
                <h4 className="font-semibold mb-2">Template Content</h4>
                <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
                  <div
                    dangerouslySetInnerHTML={{ __html: templateDetails.data.content }}
                    className="prose prose-sm max-w-none"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
