import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useRef } from "react";

export function ContentTab() {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: settings, refetch } = trpc.admin.getSiteSettings.useQuery();
  const updateLogo = trpc.admin.updateLogo.useMutation({
    onSuccess: () => {
      toast.success("Logo updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update logo");
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        // Upload via tRPC
        await updateLogo.mutateAsync({
          fileData: base64,
          fileName: file.name,
          mimeType: file.type,
        });
        
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload logo");
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Content Management</h2>
        <p className="text-muted-foreground">
          Customize site branding and homepage content
        </p>
      </div>

      {/* Logo Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Site Logo</CardTitle>
          <CardDescription>
            Upload your site logo (PNG, JPG, or SVG recommended). Max size: 2MB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Logo Preview */}
          {settings?.logoUrl && (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="w-16 h-16 flex items-center justify-center border rounded bg-white">
                <img
                  src={settings.logoUrl}
                  alt="Current logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Current Logo</p>
                <p className="text-xs text-muted-foreground">
                  Displayed in header and throughout the site
                </p>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {settings?.logoUrl ? "Change Logo" : "Upload Logo"}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Recommended: Square image, transparent background, minimum 200x200px
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for Future Features */}
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Additional content management features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Visual Content Editor</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              More content management features coming soon, including homepage customization,
              feature sections, testimonials, and email templates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
