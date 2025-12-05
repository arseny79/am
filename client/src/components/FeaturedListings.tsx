import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingUp, Users, MapPin, ArrowRight, ChevronLeft, ChevronRight, Star, Crown } from "lucide-react";
import { Link } from "wouter";
import { SERVICE_CATEGORIES, INDUSTRY_VERTICALS } from "@shared/mspCategories";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";

export default function FeaturedListings() {
  // Fetch active listings and take first 9 for carousel
  const { data: listings, isLoading } = trpc.listing.search.useQuery({});
  
  const featuredListings = listings?.slice(0, 9) || [];

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: "start",
      slidesToScroll: 1,
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  );

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading || featuredListings.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Opportunities</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover MSP businesses available for acquisition right now
          </p>
        </div>

        <div className="relative">
          {/* Carousel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {featuredListings.map((listing: any) => (
                <div key={listing.id} className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-6 first:pl-0">
                  <Link href={`/listing/${listing.id}`}>
                    {/* Premium listings with thumbnails get special treatment */}
                    {listing.tier === "premium_featured" && listing.thumbnailUrl ? (
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden">
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={listing.thumbnailUrl}
                            alt={listing.isAnonymous ? "Anonymous Listing" : listing.businessName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                              <Crown className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          </div>
                        </div>
                        <CardHeader>
                          <CardTitle className="text-xl">
                            {listing.isAnonymous ? "Anonymous Listing" : listing.businessName}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {listing.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Key Metrics */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Asking Price</p>
                                <p className="font-semibold">{formatCurrency(listing.askingPrice)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">MRR</p>
                                <p className="font-semibold">{formatCurrency(listing.monthlyRecurringRevenue)}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-xl">
                            {listing.isAnonymous ? "Anonymous Listing" : listing.businessName}
                          </CardTitle>
                          <div className="flex flex-col gap-1">
                            {listing.tier === "premium_featured" && (
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                            {listing.tier === "featured" && (
                              <Badge className="bg-blue-600 text-white border-0">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            {listing.confidentialityLevel === "public" && (
                              <Badge variant="secondary">Public</Badge>
                            )}
                            {listing.confidentialityLevel === "nda" && (
                              <Badge variant="outline">NDA Required</Badge>
                            )}
                            {listing.confidentialityLevel === "private" && (
                              <Badge>Private</Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {listing.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Asking Price</p>
                              <p className="font-semibold">{formatCurrency(listing.askingPrice)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">MRR</p>
                              <p className="font-semibold">{formatCurrency(listing.monthlyRecurringRevenue)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Clients</p>
                              <p className="font-semibold">{listing.clientCount || "N/A"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Location</p>
                              <p className="font-semibold">{listing.location}</p>
                            </div>
                          </div>
                        </div>

                        {/* Categories */}
                        <div className="flex flex-wrap gap-2">
                          {listing.serviceCategory && (
                            <Badge variant="secondary" className="text-xs">
                              {SERVICE_CATEGORIES[listing.serviceCategory as keyof typeof SERVICE_CATEGORIES]}
                            </Badge>
                          )}
                          {listing.industryVertical && (
                            <Badge variant="outline" className="text-xs">
                              {INDUSTRY_VERTICALS[listing.industryVertical as keyof typeof INDUSTRY_VERTICALS]}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {featuredListings.length > 3 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full shadow-lg"
                onClick={scrollPrev}
                disabled={prevBtnDisabled}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full shadow-lg"
                onClick={scrollNext}
                disabled={nextBtnDisabled}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Dots Indicator */}
        {featuredListings.length > 3 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: Math.ceil(featuredListings.length / 3) }).map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all ${
                  Math.floor(selectedIndex / 3) === index
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30"
                }`}
                onClick={() => emblaApi?.scrollTo(index * 3)}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/marketplace">
            <Button size="lg" variant="outline">
              View All Listings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
