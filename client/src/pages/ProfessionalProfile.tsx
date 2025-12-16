import { Link, useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  Globe,
  Briefcase,
  CheckCircle,
  Building2,
  Scale,
  Calculator,
  FileSearch,
  UserCog,
  Users,
  Crown,
  Calendar,
  Award,
  ExternalLink,
  Star,
  MessageSquare,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import Footer from "@/components/Footer";
import { APP_TITLE } from "@/const";

const PROFESSIONAL_TYPES = [
  { value: "broker", label: "M&A Broker", icon: Briefcase },
  { value: "lawyer", label: "M&A Attorney", icon: Scale },
  { value: "accountant", label: "CPA / Financial Advisor", icon: Calculator },
  { value: "due_diligence", label: "Due Diligence Specialist", icon: FileSearch },
  { value: "valuation", label: "Valuation Expert", icon: Calculator },
  { value: "consultant", label: "M&A Consultant", icon: UserCog },
  { value: "other", label: "Other", icon: Users },
] as const;

const TIER_INFO = {
  premium: { 
    label: "Premium Partner", 
    className: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0",
    description: "Featured placement, priority support, and enhanced visibility"
  },
  professional: { 
    label: "Professional", 
    className: "bg-blue-600 text-white border-0",
    description: "Enhanced profile and lead notifications"
  },
  basic: { 
    label: "Basic", 
    className: "bg-gray-500 text-white border-0",
    description: "Standard directory listing"
  },
};

function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">{APP_TITLE}</span>
          </div>
        </Link>
        <nav className="flex items-center gap-8">
          <Link href="/marketplace" className="text-foreground hover:text-primary font-medium transition-colors">Browse</Link>
          <Link href="/professionals" className="text-foreground hover:text-primary font-medium transition-colors">Professionals</Link>
        </nav>
        <div>
          <Link href="/profile">
            <Button variant="default">Dashboard</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function ProfessionalProfile() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const professionalId = parseInt(params.id || "0");

  const { data: professional, isLoading, error } = trpc.professional.getById.useQuery(
    { id: professionalId },
    { enabled: !!professionalId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="container py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Professional Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The professional profile you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/professionals">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Directory
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const TypeIcon = PROFESSIONAL_TYPES.find(t => t.value === professional.type)?.icon || Users;
  const typeLabel = PROFESSIONAL_TYPES.find(t => t.value === professional.type)?.label || professional.type;
  const tierInfo = TIER_INFO[professional.tier as keyof typeof TIER_INFO];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container py-8">
        {/* Back Button */}
        <Link href="/professionals">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Directory
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card className={professional.tier === 'premium' ? 'ring-2 ring-amber-400' : professional.tier === 'professional' ? 'ring-1 ring-blue-400' : ''}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${professional.tier === 'premium' ? 'bg-amber-100' : professional.tier === 'professional' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <TypeIcon className={`w-10 h-10 ${professional.tier === 'premium' ? 'text-amber-600' : professional.tier === 'professional' ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-2xl">{professional.name}</CardTitle>
                      {professional.verified && (
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {tierInfo.label && (
                        <Badge className={tierInfo.className}>
                          {professional.tier === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                          {tierInfo.label}
                        </Badge>
                      )}
                    </div>
                    {professional.companyName && (
                      <CardDescription className="flex items-center gap-1 text-base mt-1">
                        <Building2 className="w-4 h-4" />
                        {professional.companyName}
                      </CardDescription>
                    )}
                    <Badge variant="outline" className="mt-2">
                      {typeLabel}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  {professional.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {professional.location}
                    </div>
                  )}
                  {professional.yearsExperience && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {professional.yearsExperience}+ years experience
                    </div>
                  )}
                  {professional.dealsCompleted && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="w-4 h-4" />
                      {professional.dealsCompleted} deals completed
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* About */}
            {professional.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{professional.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Specialties */}
            {professional.specialties && (professional.specialties as string[]).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Specialties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(professional.specialties as string[]).map((specialty, i) => (
                      <Badge key={i} variant="secondary" className="text-sm">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Areas */}
            {professional.serviceAreas && (professional.serviceAreas as string[]).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Service Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(professional.serviceAreas as string[]).map((area, i) => (
                      <Badge key={i} variant="outline">
                        <MapPin className="w-3 h-3 mr-1" />
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fee Structure */}
            {professional.feeStructure && (
              <Card>
                <CardHeader>
                  <CardTitle>Fee Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{professional.feeStructure}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {professional.email && (
                  <a
                    href={`mailto:${professional.email}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {professional.email}
                  </a>
                )}
                {professional.phone && (
                  <a
                    href={`tel:${professional.phone}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {professional.phone}
                  </a>
                )}
                {professional.website && (
                  <a
                    href={professional.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Visit Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <div className="pt-4 border-t">
                  <Button className="w-full" asChild>
                    <a href={`mailto:${professional.email}?subject=Inquiry from MSP Marketplace`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Message
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profile Views</span>
                  <span className="font-medium">{professional.profileViews}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deal Invitations</span>
                  <span className="font-medium">{professional.dealInvitations}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">
                    {new Date(professional.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Summary */}
            <ReviewsSummary professionalId={professional.id} />

            {/* Tier Info */}
            <Card className={professional.tier === 'premium' ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200' : professional.tier === 'professional' ? 'bg-blue-50 border-blue-200' : ''}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Badge className={tierInfo.className + " mb-2"}>
                    {professional.tier === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                    {tierInfo.label}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{tierInfo.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Reviews Summary Component
function ReviewsSummary({ professionalId }: { professionalId: number }) {
  const { user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  
  const { data: reviewsData, isLoading } = trpc.professional.getReviews.useQuery({
    professionalId,
    limit: 5,
  });

  const submitReview = trpc.professional.submitReview.useMutation({
    onSuccess: () => {
      toast.success("Review submitted for approval");
      setShowReviewForm(false);
      setReviewText("");
      setRating(5);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const avgRating = reviewsData?.averageRating || 0;
  const totalReviews = reviewsData?.totalReviews || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating Summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${star <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="font-medium">{avgRating.toFixed(1)}</span>
          <span className="text-muted-foreground">({totalReviews} reviews)</span>
        </div>

        {/* Recent Reviews */}
        {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
          <div className="space-y-3 pt-2 border-t">
            {reviewsData.reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="text-sm">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground line-clamp-2">{review.review}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No reviews yet</p>
        )}

        {/* Write Review Button */}
        {user && !showReviewForm && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => setShowReviewForm(true)}
          >
            Write a Review
          </Button>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <div className="space-y-3 pt-3 border-t">
            <div>
              <label className="text-sm font-medium mb-1 block">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 cursor-pointer transition-colors ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Your Review</label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience working with this professional..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => submitReview.mutate({
                  professionalId,
                  rating,
                  review: reviewText,
                })}
                disabled={submitReview.isPending || reviewText.length < 10}
              >
                {submitReview.isPending ? "Submitting..." : "Submit Review"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowReviewForm(false)}
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Reviews are moderated before being published.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
