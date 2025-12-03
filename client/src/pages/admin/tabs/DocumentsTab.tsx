import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PlatformDocumentsManager from "@/components/PlatformDocumentsManager";

export function DocumentsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Platform Documents</h2>
        <p className="text-muted-foreground">
          Manage legal documents and platform policies
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Legal Documents</CardTitle>
          <CardDescription>
            Terms of Service, Privacy Policy, and other legal documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformDocumentsManager />
        </CardContent>
      </Card>
    </div>
  );
}
