import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  Briefcase,
  Scale,
  Calculator,
  FileSearch,
  UserCog,
  Users,
  CheckCircle,
  Crown,
  MapPin,
  ExternalLink,
} from "lucide-react";

const PROFESSIONAL_TYPES = [
  { value: "broker", label: "M&A Broker", icon: Briefcase },
  { value: "lawyer", label: "M&A Attorney", icon: Scale },
  { value: "accountant", label: "CPA / Financial Advisor", icon: Calculator },
  { value: "due_diligence", label: "Due Diligence Specialist", icon: FileSearch },
  { value: "valuation", label: "Valuation Expert", icon: Calculator },
  { value: "consultant", label: "M&A Consultant", icon: UserCog },
  { value: "other", label: "Other", icon: Users },
] as const;

interface InviteProfessionalDialogProps {
  dealId: number;
  onInvited?: () => void;
}

export function InviteProfessionalDialog({ dealId, onInvited }: InviteProfessionalDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [accessLevel, setAccessLevel] = useState<"view_only" | "participant" | "full_access">("view_only");
  const [invitationNote, setInvitationNote] = useState("");

  const { data, isLoading } = trpc.professional.list.useQuery({
    search: search || undefined,
    type: type === "all" ? undefined : type as any,
    limit: 10,
    offset: 0,
  }, {
    enabled: open,
  });

  const inviteMutation = trpc.dealProfessional.invite.useMutation({
    onSuccess: () => {
      toast.success("Professional invited to deal");
      setOpen(false);
      setSelectedProfessional(null);
      setInvitationNote("");
      onInvited?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleInvite = () => {
    if (!selectedProfessional) return;

    inviteMutation.mutate({
      dealId,
      professionalId: selectedProfessional.id,
      accessLevel,
      invitationNote: invitationNote || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Professional
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite a Professional</DialogTitle>
          <DialogDescription>
            Add a broker, lawyer, accountant, or other M&A professional to this deal.
          </DialogDescription>
        </DialogHeader>

        {!selectedProfessional ? (
          <div className="space-y-4">
            {/* Search & Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search professionals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[180px]">
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
            </div>

            {/* Results */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : data?.professionals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No professionals found</p>
                  <Link href="/professionals">
                    <Button variant="link" size="sm">
                      Browse Directory
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : (
                data?.professionals.map((pro) => {
                  const TypeIcon = PROFESSIONAL_TYPES.find(t => t.value === pro.type)?.icon || Users;
                  return (
                    <div
                      key={pro.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setSelectedProfessional(pro)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pro.tier === 'premium' ? 'bg-amber-100' : pro.tier === 'professional' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <TypeIcon className={`w-5 h-5 ${pro.tier === 'premium' ? 'text-amber-600' : pro.tier === 'professional' ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{pro.name}</span>
                          {pro.verified && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                          {pro.tier === 'premium' && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {PROFESSIONAL_TYPES.find(t => t.value === pro.type)?.label}
                          </Badge>
                          {pro.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3" />
                              {pro.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="text-center pt-2 border-t">
              <Link href="/professionals">
                <Button variant="link" size="sm">
                  View Full Directory
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Professional */}
            <div className="flex items-center gap-3 p-4 bg-accent rounded-lg">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedProfessional.tier === 'premium' ? 'bg-amber-100' : selectedProfessional.tier === 'professional' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {(() => {
                  const TypeIcon = PROFESSIONAL_TYPES.find(t => t.value === selectedProfessional.type)?.icon || Users;
                  return <TypeIcon className={`w-6 h-6 ${selectedProfessional.tier === 'premium' ? 'text-amber-600' : selectedProfessional.tier === 'professional' ? 'text-blue-600' : 'text-gray-600'}`} />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{selectedProfessional.name}</span>
                  {selectedProfessional.verified && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <div className="text-sm text-muted-foreground">
                  {PROFESSIONAL_TYPES.find(t => t.value === selectedProfessional.type)?.label}
                  {selectedProfessional.companyName && ` • ${selectedProfessional.companyName}`}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedProfessional(null)}>
                Change
              </Button>
            </div>

            {/* Access Level */}
            <div className="space-y-2">
              <Label>Access Level</Label>
              <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view_only">View Only - Can view deal info and documents</SelectItem>
                  <SelectItem value="participant">Participant - Can view and comment</SelectItem>
                  <SelectItem value="full_access">Full Access - Can view, comment, and upload</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Invitation Note */}
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                placeholder="Add a note to your invitation..."
                value={invitationNote}
                onChange={(e) => setInvitationNote(e.target.value)}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setSelectedProfessional(null)}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleInvite}
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
