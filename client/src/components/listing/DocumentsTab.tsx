import { ListingDocumentVault } from "@/components/ListingDocumentVault";

interface DocumentsTabProps {
  listingId: number;
  isOwner: boolean;
}

export function DocumentsTab({ listingId, isOwner }: DocumentsTabProps) {
  return (
    <div>
      <ListingDocumentVault listingId={listingId} isOwner={isOwner} />
    </div>
  );
}
