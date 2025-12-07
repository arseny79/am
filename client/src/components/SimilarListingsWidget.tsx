import { trpc } from "@/lib/trpc";
import { SimilarListings } from "./SimilarListings";
import { Loader2 } from "lucide-react";

interface SimilarListingsWidgetProps {
  listingId: number;
}

export function SimilarListingsWidget({ listingId }: SimilarListingsWidgetProps) {
  const { data: similarListings, isLoading } = trpc.listing.getSimilar.useQuery({ id: listingId });

  if (isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If no similar listings (either none found OR premium_featured tier), don't render anything
  if (!similarListings || similarListings.length === 0) {
    return null;
  }

  return <SimilarListings listings={similarListings} />;
}
