import { CheckCircle2, MapPin, Calendar, Users, Building2 } from "lucide-react";

interface OverviewTabProps {
  listing: any;
  isSeller: boolean;
  isAuthenticated: boolean;
  showConfidential: boolean;
  onExpressInterest: () => void;
  onSignNDA: () => void;
  formatCurrency: (value: number) => string;
}

export function OverviewTab({ listing, showConfidential, formatCurrency }: OverviewTabProps) {
  const metaItems = [
    { icon: <MapPin className="h-5 w-5 text-primary" />, label: "Location", value: listing.location },
    listing.yearFounded ? { icon: <Calendar className="h-5 w-5 text-primary" />, label: "Founded", value: String(listing.yearFounded) } : null,
    showConfidential && listing.employeeCount ? { icon: <Users className="h-5 w-5 text-primary" />, label: "Employees", value: `${listing.employeeCount} team members` } : null,
    { icon: <Building2 className="h-5 w-5 text-primary" />, label: "Business Type", value: listing.serviceCategory || "Managed Service Provider" },
  ].filter(Boolean) as { icon: JSX.Element; label: string; value: string }[];

  const highlights = [
    listing.annualRevenue ? {
      title: "Strong Revenue Base",
      desc: `Annual revenue of ${formatCurrency(listing.annualRevenue)}${listing.mrr ? ` (MRR: ${formatCurrency(listing.mrr)})` : ""}.`,
    } : null,
    listing.ebitda && listing.annualRevenue ? {
      title: "Healthy Profit Margin",
      desc: `EBITDA of ${formatCurrency(listing.ebitda)} — a ${((listing.ebitda / listing.annualRevenue) * 100).toFixed(1)}% margin.`,
    } : null,
    listing.clientRetentionRate ? {
      title: "Excellent Client Retention",
      desc: `${listing.clientRetentionRate}% retention rate with a stable recurring revenue base.`,
    } : null,
    listing.clientCount ? {
      title: "Established Client Base",
      desc: `${listing.clientCount} active accounts with long-term contracted relationships.`,
    } : null,
  ].filter(Boolean) as { title: string; desc: string }[];

  return (
    <div className="space-y-12">
      {/* Business Overview */}
      <section>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-6">Business Overview</h2>
        <p className="text-muted-foreground leading-relaxed text-[15px]">
          {listing.description || "No description provided."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-border">
          {metaItems.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{item.icon}</div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Investment Highlights — bento grid */}
      {showConfidential && highlights.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-8">Investment Highlights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map((item) => (
              <div key={item.title} className="bg-secondary p-6 rounded-xl flex gap-4 border border-border/20">
                <div className="shrink-0 mt-0.5 bg-primary/10 p-2 rounded-lg h-fit">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
