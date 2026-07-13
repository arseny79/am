import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  MapPin, 
  Calendar,
  Shield,
  Building2,
  CheckCircle2
} from "lucide-react";

interface OverviewTabProps {
  listing: any;
  isSeller: boolean;
  isAuthenticated: boolean;
  showConfidential: boolean;
  onExpressInterest: () => void;
  onSignNDA: () => void;
  formatCurrency: (value: number) => string;
}

export function OverviewTab({
  listing,
  isSeller,
  isAuthenticated,
  showConfidential,
  onExpressInterest,
  onSignNDA,
  formatCurrency,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Annual Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {showConfidential ? formatCurrency(listing.annualRevenue || 0) : "•••••••"}
            </div>
            {showConfidential && listing.mrr && (
              <p className="text-xs text-muted-foreground mt-1">
                MRR: {formatCurrency(listing.mrr)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              EBITDA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {showConfidential ? formatCurrency(listing.ebitda || 0) : "•••••••"}
            </div>
            {showConfidential && listing.annualRevenue && listing.ebitda && (
              <p className="text-xs text-muted-foreground mt-1">
                {((listing.ebitda / listing.annualRevenue) * 100).toFixed(1)}% margin
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {showConfidential ? (listing.clientCount || 0) : "••"}
            </div>
            {showConfidential && listing.clientRetentionRate && (
              <p className="text-xs text-muted-foreground mt-1">
                {listing.clientRetentionRate}% retention
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Asking Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {listing.askingPrice ? formatCurrency(listing.askingPrice) : "Contact"}
            </div>
            {listing.askingPrice && listing.annualRevenue && (
              <p className="text-xs text-muted-foreground mt-1">
                {(listing.askingPrice / listing.annualRevenue).toFixed(1)}x revenue
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business Description */}
      <Card>
        <CardHeader>
          <CardTitle>Business Overview</CardTitle>
          <CardDescription>Overview of this listing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            {listing.description || "No description provided."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{listing.location || "Not specified"}</p>
              </div>
            </div>

            {listing.yearFounded && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Founded</p>
                  <p className="text-sm text-muted-foreground">{listing.yearFounded}</p>
                </div>
              </div>
            )}

            {listing.employeeCount && showConfidential && (
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Employees</p>
                  <p className="text-sm text-muted-foreground">{listing.employeeCount} team members</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Business Type</p>
                <p className="text-sm text-muted-foreground">Digital Asset / Online Business</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Highlights */}
      {showConfidential && (
        <Card>
          <CardHeader>
            <CardTitle>Key Highlights</CardTitle>
            <CardDescription>What makes this business attractive</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {listing.annualRevenue && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Strong revenue base of {formatCurrency(listing.annualRevenue)} annually
                  </span>
                </li>
              )}
              {listing.clientCount && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Established client base of {listing.clientCount} active clients
                  </span>
                </li>
              )}
              {listing.ebitda && listing.annualRevenue && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Healthy profit margin of {((listing.ebitda / listing.annualRevenue) * 100).toFixed(1)}%
                  </span>
                </li>
              )}
              {listing.clientRetentionRate && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Excellent client retention rate of {listing.clientRetentionRate}%
                  </span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Trust Signals */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Protection</CardTitle>
          <CardDescription>Your deal is protected every step of the way</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Escrow Protected</p>
                <p className="text-xs text-muted-foreground">Funds held securely until closing</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Verified Listing</p>
                <p className="text-xs text-muted-foreground">Business details confirmed</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">NDA Protection</p>
                <p className="text-xs text-muted-foreground">Confidential information secured</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      {!isSeller && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Interested in this business?</h3>
                <p className="text-sm text-muted-foreground">
                  {isAuthenticated
                    ? showConfidential
                      ? "Start a conversation with the seller to discuss this opportunity."
                      : "Sign the NDA to view confidential information and start a conversation."
                    : "Sign in to express interest and start the acquisition process."}
                </p>
              </div>
              <div className="flex gap-3">
                {isAuthenticated ? (
                  showConfidential ? (
                    <Button onClick={onExpressInterest} size="lg" className="flex-1">
                      Express Interest
                    </Button>
                  ) : (
                    <Button onClick={onSignNDA} size="lg" className="flex-1">
                      <Shield className="h-4 w-4 mr-2" />
                      Sign NDA to Continue
                    </Button>
                  )
                ) : (
                  <Button asChild size="lg" className="flex-1">
                    <a href={`/auth/login?redirect=/listing/${listing.id}`}>
                      Sign In to Express Interest
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
