import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Server, Shield, Lock, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TechnicalTabProps {
  listing: any;
  showConfidential: boolean;
  onSignNDA: () => void;
}

export function TechnicalTab({ listing, showConfidential, onSignNDA }: TechnicalTabProps) {
  if (!showConfidential) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Technical Information Protected
          </CardTitle>
          <CardDescription>
            Sign the NDA to view platform and technology details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Confidential Information</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>
                Platform and technology details are protected by a Non-Disclosure Agreement. Once signed, you'll gain access to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Gambling platform and back-office system details</li>
                <li>Payment processor integrations</li>
                <li>Licensing and jurisdiction information</li>
                <li>Tech stack inventory and third-party dependencies</li>
                <li>Vendor and supplier relationships</li>
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
            Core Platform
          </CardTitle>
          <CardDescription>Gambling platform, back-office, and key infrastructure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Gambling / Gaming Platform</p>
              <p className="text-sm text-muted-foreground">
                {listing.primaryRmm || "Information available in due diligence"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Back-Office / CRM System</p>
              <p className="text-sm text-muted-foreground">
                {listing.primaryPsa || "Information available in due diligence"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Other Tools & Integrations</p>
              <p className="text-sm text-muted-foreground">
                {listing.otherTools || "Information available in due diligence"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Offerings / Product Mix */}
      {listing.serviceMix && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Product & Service Mix
            </CardTitle>
            <CardDescription>Revenue breakdown by product or service type</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{listing.serviceMix}</p>
          </CardContent>
        </Card>
      )}

      {/* Licensing & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Licensing & Compliance
          </CardTitle>
          <CardDescription>Regulatory licenses and compliance posture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Gambling Licenses</p>
              <p className="text-sm text-muted-foreground">
                {listing.securityCertifications || "License details available in due diligence"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Jurisdictions Operated</p>
              <p className="text-sm text-muted-foreground">
                {listing.complianceStandards || "Details available in due diligence"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card>
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
          <CardDescription>Full stack inventory available in due diligence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-2">Payments & Fraud</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Payment processors & PSPs</li>
                <li>• Fraud detection tools</li>
                <li>• KYC / AML providers</li>
                <li>• Chargeback management</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Content & Data</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Odds / data feed providers</li>
                <li>• Game content aggregators</li>
                <li>• Analytics & BI platforms</li>
                <li>• CDN / hosting infrastructure</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Marketing Tech</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Affiliate tracking platform</li>
                <li>• CRM & retention tools</li>
                <li>• Email / SMS providers</li>
                <li>• Attribution & tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Responsible Gambling</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Self-exclusion integration</li>
                <li>• RG tools and controls</li>
                <li>• Regulatory reporting</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Complete tech stack inventory with contracts and licensing details available in due diligence
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
