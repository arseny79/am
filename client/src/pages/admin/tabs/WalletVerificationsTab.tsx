import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldX, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function WalletVerificationsTab() {
  const utils = trpc.useUtils();
  const { data: verifications, isLoading } = trpc.adminWalletVerification.listVerifications.useQuery();
  const revokeMutation = trpc.adminWalletVerification.revokeVerification.useMutation({
    onSuccess: () => {
      toast.success("Wallet verification revoked");
      utils.adminWalletVerification.listVerifications.invalidate();
    },
    onError: (error) => toast.error("Error: " + error.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" /> Wallet Verifications
        </CardTitle>
        <CardDescription>
          Review and manage wallet ownership verifications across all listings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !verifications || verifications.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No wallet verifications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium">Listing ID</th>
                  <th className="pb-2 pr-4 font-medium">Wallet Address</th>
                  <th className="pb-2 pr-4 font-medium">Chain ID</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Verified At</th>
                  <th className="pb-2 pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((v: any) => (
                  <tr key={v.id} className="border-b">
                    <td className="py-3 pr-4">#{v.listingId}</td>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {v.walletAddress.slice(0, 6)}...{v.walletAddress.slice(-4)}
                    </td>
                    <td className="py-3 pr-4">{v.chainId}</td>
                    <td className="py-3 pr-4">
                      {v.verifiedAt ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <ShieldX className="h-3 w-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {v.verifiedAt ? new Date(v.verifiedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => revokeMutation.mutate({ id: v.id })}
                        disabled={revokeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
