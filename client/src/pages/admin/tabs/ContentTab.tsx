import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function ContentTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Content Management</h2>
        <p className="text-muted-foreground">
          Customize homepage and page content
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Visual content editor for homepage and landing pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Content Editor</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              A visual content management system is coming soon. You'll be able to customize
              homepage sections, hero text, feature descriptions, and more without touching code.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planned Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Edit homepage hero section (headline, subheadline, CTA)</li>
            <li>• Customize feature highlights and benefits</li>
            <li>• Manage testimonials and social proof</li>
            <li>• Update "How It Works" steps</li>
            <li>• Configure footer links and content</li>
            <li>• Add/edit FAQ sections</li>
            <li>• Customize email templates</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
