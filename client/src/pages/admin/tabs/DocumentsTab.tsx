import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, FileSignature, Shield } from "lucide-react";
import PlatformDocumentsManager from "@/components/PlatformDocumentsManager";
import { AdminNDATemplateManager } from "@/components/AdminNDATemplateManager";
import { NDAManagementTab } from "./NDAManagementTab";

export function DocumentsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Documents & Legal</h2>
        <p className="text-muted-foreground">
          Manage platform documents, NDA templates, and NDA signings
        </p>
      </div>

      <Tabs defaultValue="platform-docs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="platform-docs" className="gap-2">
            <FileText className="h-4 w-4" />
            Platform Documents
          </TabsTrigger>
          <TabsTrigger value="nda-templates" className="gap-2">
            <FileSignature className="h-4 w-4" />
            NDA Templates
          </TabsTrigger>
          <TabsTrigger value="nda-management" className="gap-2">
            <Shield className="h-4 w-4" />
            NDA Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform-docs" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="nda-templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NDA Templates</CardTitle>
              <CardDescription>
                Create and manage NDA templates with dynamic variables. Use <code className="bg-muted px-1 py-0.5 rounded">{"{{variableName}}"}</code> format for automatic data substitution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminNDATemplateManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nda-management" className="space-y-4">
          <NDAManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
