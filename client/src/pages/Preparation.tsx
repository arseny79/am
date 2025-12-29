/**
 * Preparation Page - Sales packet preparation for a specific listing
 * Accessed from seller dashboard or listing creation flow
 */

import { useParams, useLocation } from 'wouter';
import Footer from "@/components/Footer";
import { PreparationWizard } from '@/components/PreparationWizard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';

export default function Preparation() {
  const params = useParams<{ listingId: string }>();
  const [, setLocation] = useLocation();
  
  const listingId = params.listingId ? parseInt(params.listingId) : null;
  
  // Get listing to show title
  const { data: listing, isLoading } = trpc.listing.getById.useQuery(
    { id: listingId! },
    { enabled: !!listingId }
  );
  
  const handleComplete = () => {
    // Navigate back to listing or dashboard
    setLocation(`/my-listings`);
  };
  
  if (!listingId) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Listing</h1>
          <p className="text-muted-foreground mb-6">
            No listing ID provided.
          </p>
          <Button onClick={() => setLocation('/my-listings')}>
            Go to My Listings
          </Button>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (!listing) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The listing you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => setLocation('/my-listings')}>
            Go to My Listings
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/my-listings')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Listings
          </Button>
          <h1 className="text-3xl font-bold mb-2">
            Prepare Your Sales Packet
          </h1>
          <p className="text-muted-foreground">
            For: <span className="font-medium text-foreground">{listing.businessName}</span>
          </p>
        </div>
      </div>
      
      {/* Content */}
      <div className="container py-8">
        <PreparationWizard 
          listingId={listingId} 
          onComplete={handleComplete}
        />
      </div>
      <Footer />
    </div>
  );
}
