import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  Briefcase,
  CheckCircle,
  Star,
  Users,
  Building2,
  Scale,
  Calculator,
  FileSearch,
  UserCog,
  ArrowRight,
  Filter,
  Crown,
} from "lucide-react";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useSiteLogo } from "@/hooks/useSiteLogo";
import { PublicHeader } from "@/components/PublicHeader";

const PROFESSIONAL_TYPES = [
  { value: "broker", label: "M&A Broker", icon: Briefcase },
  { value: "lawyer", label: "M&A Attorney", icon: Scale },
  { value: "accountant", label: "CPA / Financial Advisor", icon: Calculator },
  { value: "due_diligence", label: "Due Diligence Specialist", icon: FileSearch },
  { value: "valuation", label: "Valuation Expert", icon: Calculator },
  { value: "consultant", label: "M&A Consultant", icon: UserCog },
  { value: "other", label: "Other", icon: Users },
] as const;

const TIER_BADGES = {
  premium: { label: "Premium", className: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0" },
  professional: { label: "Pro", className: "bg-blue-600 text-white border-0" },
  basic: { label: "", className: "" },
};

function ProfessionalCard({ professional }: { professional: any }) {
  const TypeIcon = PROFESSIONAL_TYPES.find(t => t.value === professional.type)?.icon || Users;
  const tierBadge = TIER_BADGES[professional.tier as keyof typeof TIER_BADGES];

  return (
    <Card className={`hover:shadow-lg transition-shadow ${professional.tier === 'premium' ? 'ring-2 ring-amber-400' : professional.tier === 'professional' ? 'ring-1 ring-blue-400' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {professional.profilePhotoUrl ? (
              <img
                src={professional.profilePhotoUrl}
                alt={professional.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${professional.tier === 'premium' ? 'bg-amber-100' : professional.tier === 'professional' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <TypeIcon className={`w-6 h-6 ${professional.tier === 'premium' ? 'text-amber-600' : professional.tier === 'professional' ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{professional.name}</CardTitle>
                {professional.verified && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
              {professional.companyName && (
                <CardDescription className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {professional.companyName}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {tierBadge.label && (
              <Badge className={tierBadge.className}>
                {professional.tier === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                {tierBadge.label}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge variant="outline" className="text-xs">
          {PROFESSIONAL_TYPES.find(t => t.value === professional.type)?.label || professional.type}
        </Badge>

        {professional.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {professional.location}
          </div>
        )}

        {professional.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {professional.bio}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {professional.yearsExperience && (
            <span>{professional.yearsExperience}+ years</span>
          )}
          {professional.dealsCompleted && (
            <span>{professional.dealsCompleted} deals</span>
          )}
        </div>

        {professional.specialties && professional.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(professional.specialties as string[]).slice(0, 3).map((specialty, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {professional.specialties.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{professional.specialties.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="pt-2">
          <Link href={`/professionals/${professional.id}`}>
            <Button variant="outline" className="w-full group">
              View Profile
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfessionalCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export default function ProfessionalDirectory() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [location, setLocation] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { data, isLoading } = trpc.professional.list.useQuery({
    search: search || undefined,
    type: (type && type !== "all" ? type : undefined) as any,
    location: location || undefined,
    verified: verifiedOnly || undefined,
    limit: 20,
    offset: 0,
  });

  const { data: stats } = trpc.professional.getStats.useQuery();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <PublicHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">
              Find M&A Professionals
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Connect with experienced brokers, lawyers, accountants, and due diligence specialists who specialize in MSP transactions.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">{stats?.active || 0}</div>
                <div className="text-sm text-slate-400">Active Professionals</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">{stats?.verified || 0}</div>
                <div className="text-sm text-slate-400">Verified</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">{stats?.brokers || 0}</div>
                <div className="text-sm text-slate-400">M&A Brokers</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">{stats?.lawyers || 0}</div>
                <div className="text-sm text-slate-400">Attorneys</div>
              </div>
            </div>

            {/* CTA */}
            <Link href="/professionals/join">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                Join as a Professional
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-white border-b sticky top-0 z-10">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {PROFESSIONAL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-full md:w-[200px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant={verifiedOnly ? "default" : "outline"}
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Verified Only
            </Button>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8 flex-1">
        <div className="container">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ProfessionalCardSkeleton key={i} />
              ))}
            </div>
          ) : data?.professionals.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No professionals found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search terms.
              </p>
              <Link href="/professionals/join">
                <Button>
                  Be the first to join
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  Showing {data?.professionals.length} of {data?.total} professionals
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.professionals.map((professional) => (
                  <ProfessionalCard key={professional.id} professional={professional} />
                ))}
              </div>

              {data?.hasMore && (
                <div className="text-center mt-8">
                  <Button variant="outline" size="lg">
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Are You an M&A Professional?</h2>
            <p className="text-slate-300 mb-8">
              Join our directory to connect with MSP buyers and sellers. Get leads, build your reputation, and grow your practice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/professionals/join">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  Join the Directory
                </Button>
              </Link>
              <Link href="/professionals/pricing">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
