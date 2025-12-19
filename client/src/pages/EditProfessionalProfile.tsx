import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  ArrowLeft,
  Save,
  Briefcase,
  Scale,
  Calculator,
  FileSearch,
  UserCog,
  Users,
  Loader2,
} from "lucide-react";
import Footer from "@/components/Footer";
import { Building2 } from "lucide-react";
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

export default function EditProfessionalProfile() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: professional, isLoading: profileLoading } = trpc.professional.getMyProfile.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    website: "",
    type: "",
    profilePhotoUrl: "",
    specialties: "",
    bio: "",
    yearsExperience: "",
    dealsCompleted: "",
    location: "",
    serviceAreas: "",
    feeStructure: "",
  });

  // Populate form when professional data loads
  useEffect(() => {
    if (professional) {
      setFormData({
        name: professional.name || "",
        companyName: professional.companyName || "",
        email: professional.email || "",
        phone: professional.phone || "",
        website: professional.website || "",
        type: professional.type || "",
        profilePhotoUrl: professional.profilePhotoUrl || "",
        specialties: (professional.specialties as string[] || []).join(", "),
        bio: professional.bio || "",
        yearsExperience: professional.yearsExperience?.toString() || "",
        dealsCompleted: professional.dealsCompleted?.toString() || "",
        location: professional.location || "",
        serviceAreas: (professional.serviceAreas as string[] || []).join(", "),
        feeStructure: professional.feeStructure || "",
      });
    }
  }, [professional]);

  const updateProfile = trpc.professional.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      navigate("/professional-dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.type) {
      toast.error("Please fill in all required fields");
      return;
    }

    updateProfile.mutate({
      name: formData.name,
      companyName: formData.companyName || undefined,
      email: formData.email,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
      type: formData.type as any,
      profilePhotoUrl: formData.profilePhotoUrl || undefined,
      specialties: formData.specialties ? formData.specialties.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      bio: formData.bio || undefined,
      yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : undefined,
      dealsCompleted: formData.dealsCompleted ? parseInt(formData.dealsCompleted) : undefined,
      location: formData.location || undefined,
      serviceAreas: formData.serviceAreas ? formData.serviceAreas.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      feeStructure: formData.feeStructure || undefined,
    });
  };

  // Show login prompt if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">Please log in to edit your professional profile.</p>
          <Button asChild>
            <a href={getLoginUrl()}>Log In</a>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Loading state
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="container py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  // No profile found
  if (!professional) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">No Professional Profile Found</h1>
          <p className="text-muted-foreground mb-6">
            You don't have a professional profile yet. Create one to get started.
          </p>
          <Link href="/professionals/join">
            <Button>Create Profile</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container py-8 max-w-3xl">
        {/* Back Button */}
        <Link href="/professional-dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Edit Professional Profile</CardTitle>
            <CardDescription>
              Update your professional information and credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Smith"
                    required
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

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      required
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
                <h3 className="text-lg font-semibold">Professional Details</h3>

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
                    <Label htmlFor="dealsCompleted">Deals Completed</Label>
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
                  <Label htmlFor="bio">Bio</Label>
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
                <h3 className="text-lg font-semibold">Location & Service Areas</h3>

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
                <h3 className="text-lg font-semibold">Fee Structure</h3>

                <div className="space-y-2">
                  <Label htmlFor="feeStructure">Fee Structure</Label>
                  <Textarea
                    id="feeStructure"
                    value={formData.feeStructure}
                    onChange={(e) => setFormData({ ...formData, feeStructure: e.target.value })}
                    placeholder="Describe your fee structure (e.g., hourly rate, success fee percentage, retainer, etc.)"
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="flex-1"
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/professional-dashboard")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
