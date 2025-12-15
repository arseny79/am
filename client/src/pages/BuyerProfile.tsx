/**
 * Buyer Profile Page
 * Manage buyer qualification and proof of funds
 */

import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { ProofOfFundsUpload } from '@/components/ProofOfFundsUpload';
import { BuyerQualificationBadge } from '@/components/BuyerQualificationBadge';
import { trpc } from '@/lib/trpc';
import { APP_TITLE, getLoginUrl } from '@/const';

export default function BuyerProfile() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: qualificationData, isLoading } = trpc.buyerQualification.getMyQualification.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to manage your buyer profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const qualification = qualificationData?.qualification;
  const level = qualification?.verificationLevel || 'basic';
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Buyer Profile</h1>
            <BuyerQualificationBadge level={level} />
          </div>
          <p className="text-muted-foreground">
            Manage your buyer qualification and access to listings
          </p>
        </div>
        
        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{user?.name || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{user?.email || 'Not provided'}</div>
              </div>
            </CardContent>
          </Card>
          
          {/* Proof of Funds */}
          <ProofOfFundsUpload />
          
          {/* Benefits by Level */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Benefits</CardTitle>
              <CardDescription>
                Higher verification levels unlock more access and features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <BuyerQualificationBadge level="basic" showTooltip={false} />
                  <div className="flex-1">
                    <div className="font-medium">Basic</div>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      <li>Browse public listings</li>
                      <li>Limited contact information</li>
                      <li>No direct access to financials</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <BuyerQualificationBadge level="verified" showTooltip={false} />
                  <div className="flex-1">
                    <div className="font-medium">Verified</div>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      <li>Full access to all listings</li>
                      <li>Direct seller contact</li>
                      <li>Access to financial documents</li>
                      <li>Initiate deals and negotiations</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <BuyerQualificationBadge level="premium" showTooltip={false} />
                  <div className="flex-1">
                    <div className="font-medium">Premium</div>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      <li>All Verified benefits</li>
                      <li>Priority support</li>
                      <li>Early access to new listings</li>
                      <li>Dedicated account manager</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/marketplace">Browse Listings</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/my-deals">My Deals</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
