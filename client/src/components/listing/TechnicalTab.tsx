import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Server, Shield, Lock, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TechnicalTabProps {
  listing: any;
  showConfidential: boolean;
  onSignNDA: () => void;
}

export function TechnicalTab({
  listing,
  showConfidential,
  onSignNDA,
}: TechnicalTabProps) {
  if (!showConfidential) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Technical Information Protected
          </CardTitle>
          <CardDescription>
            Sign the NDA to view technical infrastructure details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Confidential Information</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>
                Technical infrastructure details are protected by a Non-Disclosure Agreement. Once signed, you'll gain access to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>RMM and PSA platform details</li>
                <li>Complete tech stack inventory</li>
                <li>Service offerings and capabilities</li>
                <li>Security and compliance certifications</li>
                <li>Vendor relationships and contracts</li>
              </ul>
              <Button onClick={onSignNDA} className="w-full mt-4">
                Sign NDA to View Technical Details
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Core Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Core Platforms
          </CardTitle>
          <CardDescription>RMM, PSA, and essential management tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Remote Monitoring & Management (RMM)</p>
              <p className="text-sm text-muted-foreground">
                {listing.rmmPlatform || "Information available in due diligence"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Professional Services Automation (PSA)</p>
              <p className="text-sm text-muted-foreground">
                {listing.psaPlatform || "Information available in due diligence"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Documentation Platform</p>
              <p className="text-sm text-muted-foreground">
                {listing.documentationPlatform || "Information available in due diligence"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Offerings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Service Offerings
          </CardTitle>
          <CardDescription>What this MSP provides to clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Managed Services</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 24/7 Network Monitoring</li>
                <li>• Help Desk Support</li>
                <li>• Patch Management</li>
                <li>• Backup & Disaster Recovery</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Professional Services</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Network Design & Implementation</li>
                <li>• Cloud Migration</li>
                <li>• Security Assessments</li>
                <li>• IT Consulting</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Detailed service catalog available in due diligence documents
          </p>
        </CardContent>
      </Card>

      {/* Security & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Compliance
          </CardTitle>
          <CardDescription>Certifications and security posture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Security Certifications</p>
              <p className="text-sm text-muted-foreground">
                {listing.securityCertifications || "Details available in due diligence"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Compliance Standards</p>
              <p className="text-sm text-muted-foreground">
                {listing.complianceStandards || "Details available in due diligence"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Insurance Coverage</p>
              <p className="text-sm text-muted-foreground">
                Cyber liability, E&O, and general liability policies in place
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card>
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
          <CardDescription>Tools and platforms used to deliver services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-2">Security Tools</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Endpoint Protection</li>
                <li>• Email Security</li>
                <li>• Firewall Management</li>
                <li>• SIEM/Log Management</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Backup & Recovery</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Cloud Backup Solution</li>
                <li>• Business Continuity Platform</li>
                <li>• Disaster Recovery Testing</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Cloud Services</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Microsoft 365 Management</li>
                <li>• Azure/AWS Services</li>
                <li>• Cloud Application Support</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Communication</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• VoIP/UCaaS Platform</li>
                <li>• Video Conferencing</li>
                <li>• Collaboration Tools</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Complete tech stack inventory with licensing details available in due diligence
          </p>
        </CardContent>
      </Card>

      {/* Vendor Relationships */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Partnerships</CardTitle>
          <CardDescription>Key technology partnerships and vendor relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Microsoft Partner Status</p>
                <p className="text-xs text-muted-foreground">Cloud Solution Provider</p>
              </div>
              <span className="text-xs text-green-600 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Security Vendor Partnerships</p>
                <p className="text-xs text-muted-foreground">Multiple tier-1 vendors</p>
              </div>
              <span className="text-xs text-green-600 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Hardware Distributors</p>
                <p className="text-xs text-muted-foreground">Established accounts</p>
              </div>
              <span className="text-xs text-green-600 font-medium">Active</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Detailed vendor contracts and terms available in due diligence
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
