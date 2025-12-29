import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Scale,
  Calculator,
  FileSearch,
  UserCog,
  Users,
  CheckCircle,
  Crown,
  Star,
  Zap,
} from "lucide-react";
import Footer from "@/components/Footer";
import { Building2 } from "lucide-react";
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

const TIERS = [
  {
    id: "basic",
    name: "Basic",
    price: "Free",
    description: "Get started with a free directory listing",
    features: [
      "Basic profile listing",
      "Contact information display",
      "Specialty tags",
      "Service area listing",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: "$99/mo",
    description: "Enhanced visibility and lead generation",
    features: [
      "Everything in Basic",
      "Priority placement in search",
      "Lead notifications",
      "Profile analytics",
      "Verified badge eligibility",
    ],
    cta: "Go Professional",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$249/mo",
    description: "Maximum exposure and premium features",
    features: [
      "Everything in Professional",
      "Featured placement on homepage",
      "Premium badge",
      "Direct deal invitations",
      "Priority support",
      "Custom profile branding",
    ],
    cta: "Go Premium",
    popular: false,
  },
];

export default function ProfessionalJoin() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    website: "",
    type: "" as string,
    profilePhotoUrl: "",
    specialties: "",
    bio: "",
    yearsExperience: "",
    dealsCompleted: "",
    location: "",
    serviceAreas: "",
    feeStructure: "",
  });

  const { data: existingProfile, isLoading: profileLoading } = trpc.professional.getMyProfile.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createProfile = trpc.professional.create.useMutation({
    onSuccess: () => {
      toast.success("Profile submitted for review!");
      navigate("/professionals");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.type) {
      toast.error("Please fill in all required fields");
      return;
    }

    createProfile.mutate({
      name: formData.name,
      companyName: formData.companyName || undefined,
      email: formData.email,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
      type: formData.type as any,
      profilePhotoUrl: formData.profilePhotoUrl || undefined,
      specialties: formData.specialties ? formData.specialties.split(",").map(s => s.trim()) : undefined,
      bio: formData.bio || undefined,
      yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : undefined,
      dealsCompleted: formData.dealsCompleted ? parseInt(formData.dealsCompleted) : undefined,
      location: formData.location || undefined,
      serviceAreas: formData.serviceAreas ? formData.serviceAreas.split(",").map(s => s.trim()) : undefined,
      feeStructure: formData.feeStructure || undefined,
    });
  };

  // Show login prompt if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header */}
      <PublicHeader />
        <div className="flex-1 flex items-center justify-center py-16">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle>Join the Professional Directory</CardTitle>
              <CardDescription>
                Sign in to create your professional profile and connect with MSP buyers and sellers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" asChild>
                <a href={getLoginUrl()}>
                  Sign In to Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Link href="/professionals">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Directory
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Show existing profile message
  if (existingProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header */}
      <PublicHeader />
        <div className="flex-1 flex items-center justify-center py-16">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <CardTitle>You Already Have a Profile</CardTitle>
              <CardDescription>
                Your professional profile is {existingProfile.status === "active" ? "active" : "pending review"}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href={`/professionals/${existingProfile.id}`}>
                <Button className="w-full">
                  View My Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/professionals">
                <Button variant="outline" className="w-full">
                  Back to Directory
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-12">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Join Our Professional Directory</h1>
            <p className="text-slate-300">
              Connect with MSP buyers and sellers looking for expert guidance on their M&A transactions.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-12 bg-white">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-8">Choose Your Plan</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TIERS.map((tier) => (
              <Card key={tier.id} className={`relative ${tier.popular ? 'ring-2 ring-blue-600 shadow-lg' : ''}`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="flex items-center justify-center gap-2">
                    {tier.id === 'premium' && <Crown className="w-5 h-5 text-amber-500" />}
                    {tier.id === 'professional' && <Star className="w-5 h-5 text-blue-500" />}
                    {tier.name}
                  </CardTitle>
                  <div className="text-3xl font-bold">{tier.price}</div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${tier.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={tier.popular ? "default" : "outline"}
                    onClick={() => setStep(2)}
                  >
                    {tier.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            All plans start with a free Basic listing. Upgrade anytime to unlock premium features.
          </p>
        </div>
      </section>

      {/* Registration Form */}
      {step === 2 && (
        <section className="py-12" id="register">
          <div className="container">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Create Your Profile</CardTitle>
                <CardDescription>
                  Fill in your details to create your professional listing. Your profile will be reviewed before going live.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Basic Information</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Smith M&A Advisors"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.example.com"
                    />
                  </div>
                </div>

                {/* Professional Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Professional Details</h3>
                  
                  {/* Profile Photo */}
                  <ImageUpload
                    label="Profile Photo"
                    currentImageUrl={formData.profilePhotoUrl}
                    onImageUploaded={(url) => setFormData({ ...formData, profilePhotoUrl: url })}
                  />
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Professional Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROFESSIONAL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="yearsExperience">Years of Experience</Label>
                      <Input
                        id="yearsExperience"
                        type="number"
                        value={formData.yearsExperience}
                        onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                        placeholder="15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dealsCompleted">MSP Deals Completed</Label>
                      <Input
                        id="dealsCompleted"
                        type="number"
                        value={formData.dealsCompleted}
                        onChange={(e) => setFormData({ ...formData, dealsCompleted: e.target.value })}
                        placeholder="25"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialties">Specialties (comma-separated)</Label>
                    <Input
                      id="specialties"
                      value={formData.specialties}
                      onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                      placeholder="MSP, IT Services, SaaS, Cybersecurity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio / Description</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell potential clients about your experience and approach..."
                      rows={4}
                    />
                  </div>
                </div>

                {/* Location & Service Areas */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Location & Service Areas</h3>
                  <div className="space-y-2">
                    <Label htmlFor="location">Primary Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="New York, NY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceAreas">Service Areas (comma-separated)</Label>
                    <Input
                      id="serviceAreas"
                      value={formData.serviceAreas}
                      onChange={(e) => setFormData({ ...formData, serviceAreas: e.target.value })}
                      placeholder="Northeast US, California, Nationwide"
                    />
                  </div>
                </div>

                {/* Fee Structure */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Fee Structure</h3>
                  <div className="space-y-2">
                    <Label htmlFor="feeStructure">How do you charge?</Label>
                    <Textarea
                      id="feeStructure"
                      value={formData.feeStructure}
                      onChange={(e) => setFormData({ ...formData, feeStructure: e.target.value })}
                      placeholder="Describe your fee structure (e.g., hourly rate, success fee percentage, retainer, etc.)"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={createProfile.isPending}
                  >
                    {createProfile.isPending ? "Submitting..." : "Submit Profile"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
