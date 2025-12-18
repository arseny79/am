import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, Briefcase, Lock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientsTeamTabProps {
  listing: any;
  showConfidential: boolean;
  onSignNDA: () => void;
  formatCurrency: (value: number) => string;
}

export function ClientsTeamTab({
  listing,
  showConfidential,
  onSignNDA,
  formatCurrency,
}: ClientsTeamTabProps) {
  if (!showConfidential) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Client & Team Information Protected
          </CardTitle>
          <CardDescription>
            Sign the NDA to view client and team details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Confidential Information</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>
                Client and team information is protected by a Non-Disclosure Agreement. Once signed, you'll gain access to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Client count and industry breakdown</li>
                <li>Contract terms and retention metrics</li>
                <li>Average contract value analysis</li>
                <li>Team structure and employee information</li>
                <li>Key personnel details (anonymized)</li>
              </ul>
              <Button onClick={onSignNDA} className="w-full mt-4">
                Sign NDA to View Client & Team Details
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Client Portfolio
          </CardTitle>
          <CardDescription>Client base metrics and characteristics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Clients</p>
              <p className="text-3xl font-bold">{listing.clientCount || 0}</p>
            </div>
            {listing.clientRetentionRate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Retention Rate</p>
                <p className="text-3xl font-bold text-green-600">{listing.clientRetentionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">Annual retention</p>
              </div>
            )}
            {listing.annualRevenue && listing.clientCount && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Client Value</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(listing.annualRevenue / listing.clientCount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Per year</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Client Industry Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Industry Verticals</CardTitle>
          <CardDescription>Client distribution across industries</CardDescription>
        </CardHeader>
        <CardContent>
          {listing.industryBreakdown ? (
            <div className="space-y-4">
              {/* This would be populated from actual data */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Healthcare</span>
                  <span className="font-medium">30%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: "30%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Professional Services</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: "25%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Financial Services</span>
                  <span className="font-medium">20%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: "20%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Manufacturing</span>
                  <span className="font-medium">15%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: "15%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Other</span>
                  <span className="font-medium">10%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: "10%" }} />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Industry breakdown available in due diligence documents
            </p>
          )}
        </CardContent>
      </Card>

      {/* Contract Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Structure</CardTitle>
          <CardDescription>Client contract terms and commitment levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-2">Contract Length</p>
              <p className="text-sm text-muted-foreground">
                {listing.averageContractLength || "Typically 1-3 year terms"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Contract Type</p>
              <p className="text-sm text-muted-foreground">
                {listing.contractType || "Mix of fixed and per-user pricing"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Renewal Rate</p>
              <p className="text-sm text-muted-foreground">
                {listing.renewalRate || "High renewal rate (details in DD)"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Payment Terms</p>
              <p className="text-sm text-muted-foreground">
                {listing.paymentTerms || "Monthly/quarterly billing"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Concentration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Concentration
          </CardTitle>
          <CardDescription>How revenue is distributed across clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Top 10 Clients</p>
              <p className="text-sm text-muted-foreground">
                Represent approximately {listing.top10ClientPercentage || "35"}% of total revenue
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Largest Single Client</p>
              <p className="text-sm text-muted-foreground">
                Accounts for {listing.largestClientPercentage || "8"}% of revenue
              </p>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Detailed client list with revenue breakdown available in due diligence
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Team Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Structure
          </CardTitle>
          <CardDescription>Employee count and organizational structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {listing.employeeCount && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Employees</p>
                <p className="text-3xl font-bold">{listing.employeeCount}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Technical Staff</p>
              <p className="text-3xl font-bold">
                {listing.technicalStaffCount || Math.floor((listing.employeeCount || 10) * 0.7)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Support Staff</p>
              <p className="text-3xl font-bold">
                {listing.supportStaffCount || Math.floor((listing.employeeCount || 10) * 0.3)}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Key Roles</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">Technical Leadership</p>
                <p className="text-xs text-muted-foreground">CTO, Technical Director, Lead Engineers</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">Service Delivery</p>
                <p className="text-xs text-muted-foreground">Service Manager, Engineers, Technicians</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">Client Success</p>
                <p className="text-xs text-muted-foreground">Account Managers, Support Team</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">Operations</p>
                <p className="text-xs text-muted-foreground">Finance, HR, Administrative</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Detailed org chart and employee information available in due diligence
          </p>
        </CardContent>
      </Card>

      {/* Key Personnel */}
      <Card>
        <CardHeader>
          <CardTitle>Key Personnel Considerations</CardTitle>
          <CardDescription>Important team transition information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <p className="text-sm font-medium mb-1">Seller Transition</p>
              <p className="text-xs text-muted-foreground">
                Seller willing to provide transition support for {listing.transitionPeriod || "3-6 months"}
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm font-medium mb-1">Key Employee Retention</p>
              <p className="text-xs text-muted-foreground">
                Key technical staff have expressed willingness to stay post-acquisition
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm font-medium mb-1">Employment Agreements</p>
              <p className="text-xs text-muted-foreground">
                Standard employment contracts in place, available for review in due diligence
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
