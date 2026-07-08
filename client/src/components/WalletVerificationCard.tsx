import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Copy, Check, ShieldCheck, Wallet } from "lucide-react";

interface WalletVerificationCardProps {
  listingId: number;
}

export function WalletVerificationCard({ listingId }: WalletVerificationCardProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: chains } = trpc.chains.list.useQuery();
  const { data: verification, refetch } = trpc.listing.wallet.getVerification.useQuery(
    { listingId },
    { enabled: !!listingId }
  );

  const startMutation = trpc.listing.wallet.startVerification.useMutation({
    onSuccess: (data) => {
      setMessage(data.message);
      toast.success("Verification message generated. Sign it with your wallet.");
    },
    onError: (error) => {
      toast.error("Failed to start verification: " + error.message);
    },
  });

  const submitMutation = trpc.listing.wallet.submitSignature.useMutation({
    onSuccess: () => {
      toast.success("Wallet verified successfully!");
      setSignature("");
      setMessage("");
      refetch();
    },
    onError: (error) => {
      toast.error("Verification failed: " + error.message);
    },
  });

  const handleStart = () => {
    if (!walletAddress || !chainId) {
      toast.error("Please enter wallet address and select a chain");
      return;
    }
    startMutation.mutate({ listingId, walletAddress, chainId });
  };

  const handleSubmit = () => {
    if (!signature || !message || !walletAddress || !chainId) {
      toast.error("Please complete all steps first");
      return;
    }
    submitMutation.mutate({ listingId, walletAddress, chainId, signature, message });
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isVerified = !!verification;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Verification
        </CardTitle>
        <CardDescription>
          Verify wallet ownership to prove on-chain identity for this listing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isVerified ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-800 dark:text-green-400">Wallet Verified</p>
              <p className="text-sm text-muted-foreground font-mono">
                {verification.walletAddress.slice(0, 6)}…{verification.walletAddress.slice(-4)}
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              Verified
            </Badge>
          </div>
        ) : (
          <>
            {/* Step 1: Enter wallet info */}
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chain</Label>
                  <Select
                    value={chainId?.toString() ?? ""}
                    onValueChange={(val) => setChainId(val ? parseInt(val) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select chain..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(chains ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleStart}
                disabled={!walletAddress || !chainId || startMutation.isPending}
              >
                {startMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
                ) : (
                  "Generate Verification Message"
                )}
              </Button>
            </div>

            {/* Step 2: Sign message */}
            {message && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                <div>
                  <Label className="text-sm font-medium">Step 2: Sign this message with your wallet</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Copy the message below, sign it using your wallet's "Sign Message" feature, then paste the signature.
                  </p>
                </div>
                <div className="relative">
                  <pre className="text-xs bg-background p-3 rounded border overflow-x-auto whitespace-pre-wrap break-words pr-10">
                    {message}
                  </pre>
                  <button
                    type="button"
                    onClick={copyMessage}
                    className="absolute top-2 right-2 p-1 rounded hover:bg-muted"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Submit signature */}
            {message && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="signature">Signature</Label>
                  <Input
                    id="signature"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!signature || submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</>
                  ) : (
                    "Verify Wallet"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
