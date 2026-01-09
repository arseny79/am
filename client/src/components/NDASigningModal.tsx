import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, Pen, Type } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface NDASigningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ndaSigningId: number;
  dealId: number;
  onSigningComplete?: () => void;
  ndaExists?: boolean;
}

type SignatureType = "drawn" | "typed" | "initials";

export function NDASigningModal({
  open,
  onOpenChange,
  ndaSigningId,
  dealId,
  onSigningComplete,
  ndaExists = true,
}: NDASigningModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedSignature, setTypedSignature] = useState("");
  const [initials, setInitials] = useState("");
  const [signatureType, setSignatureType] = useState<SignatureType>("drawn");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [currentTab, setCurrentTab] = useState("document");

  // State to track the actual NDA signing ID (may be different from prop if we create one)
  const [actualNdaSigningId, setActualNdaSigningId] = useState<number | null>(ndaSigningId || null);
  const [isCreatingNDA, setIsCreatingNDA] = useState(false);

  // Reset actual ID when prop changes
  useEffect(() => {
    if (ndaSigningId && ndaExists) {
      setActualNdaSigningId(ndaSigningId);
    }
  }, [ndaSigningId, ndaExists]);

  // Fetch NDA details
  const { data: ndaSigning, isLoading: isLoadingNDA, refetch: refetchNDA } = trpc.ndaSigning.getNDASigning.useQuery(
    { ndaSigningId: actualNdaSigningId || 0 },
    { enabled: open && !!actualNdaSigningId && actualNdaSigningId > 0 }
  );

  // Create NDA mutation (if NDA doesn't exist)
  const createNDAMutation = trpc.ndaSigning.createNDASigning.useMutation({
    onSuccess: (data) => {
      toast.success("NDA created. Please review and sign.");
      setActualNdaSigningId(data.ndaSigningId);
      setIsCreatingNDA(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to create NDA: ${error.message}`);
      setIsCreatingNDA(false);
    },
  });

  // Handle creating NDA with default template
  const handleCreateNDA = async () => {
    setIsCreatingNDA(true);
    createNDAMutation.mutate({
      dealId,
      templateId: 1, // Default template
      variableValues: {
        effectiveDate: new Date().toLocaleDateString(),
      },
    });
  };

  // Sign NDA mutation
  const signMutation = trpc.ndaSigning.signNDA.useMutation({
    onSuccess: () => {
      toast.success("NDA signed successfully!");
      clearSignature();
      setAgreedToTerms(false);
      onOpenChange(false);
      onSigningComplete?.();
    },
    onError: (error: any) => {
      toast.error(`Failed to sign NDA: ${error.message}`);
    },
  });

  // Initialize canvas
  useEffect(() => {
    if (open && canvasRef.current && signatureType === "drawn") {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
      }
    }
  }, [open, signatureType]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (signatureType !== "drawn") return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signatureType !== "drawn") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setTypedSignature("");
    setInitials("");
  };

  const getSignatureBase64 = (): string => {
    if (signatureType === "drawn" && canvasRef.current) {
      return canvasRef.current.toDataURL("image/png");
    } else if (signatureType === "typed") {
      // Create a canvas with typed signature
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "italic 48px cursive";
        ctx.fillStyle = "#000";
        ctx.fillText(typedSignature, 20, 60);
      }
      return canvas.toDataURL("image/png");
    } else {
      // Create a canvas with initials
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "bold 48px Arial";
        ctx.fillStyle = "#000";
        ctx.fillText(initials.toUpperCase(), 20, 60);
      }
      return canvas.toDataURL("image/png");
    }
  };

  const isSignatureValid = (): boolean => {
    if (signatureType === "drawn") {
      // Check if canvas has any drawing
      if (!canvasRef.current) return false;
      const imageData = canvasRef.current
        .getContext("2d")
        ?.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (!imageData) return false;
      const data = imageData.data;
      // Check if any pixel is not white
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 255 || data[i + 1] < 255 || data[i + 2] < 255) {
          return true;
        }
      }
      return false;
    } else if (signatureType === "typed") {
      return typedSignature.trim().length > 0;
    } else {
      return initials.trim().length > 0;
    }
  };

  const handleSign = async () => {
    if (!isSignatureValid()) {
      toast.error("Please provide a valid signature");
      return;
    }

    if (!agreedToTerms) {
      toast.error("You must agree to the terms to sign");
      return;
    }

    const signatureBase64 = getSignatureBase64();
    signMutation.mutate({
      ndaSigningId: actualNdaSigningId || ndaSigningId,
      signature: signatureBase64,
      signatureType,
    });
  };

  if (isLoadingNDA || isCreatingNDA) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading NDA...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!ndaSigning && !isCreatingNDA) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign NDA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">An NDA needs to be created for this deal before you can sign it. Click below to create and review the NDA.</p>
            <Button 
              onClick={handleCreateNDA}
              disabled={isCreatingNDA}
            >
              {isCreatingNDA ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                "Create NDA"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isExpired = ndaSigning.expiresAt && new Date() > new Date(ndaSigning.expiresAt);
  const isAlreadySigned = ndaSigning.isBuyer ? ndaSigning.buyerSignedAt : ndaSigning.sellerSignedAt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sign NDA</DialogTitle>
          <DialogDescription>
            Please review and sign the Non-Disclosure Agreement
          </DialogDescription>
        </DialogHeader>

        {isExpired && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This NDA signing window has expired. No further signatures can be added.
            </AlertDescription>
          </Alert>
        )}

        {isAlreadySigned && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              You have already signed this NDA on {format(new Date(isAlreadySigned), "PPpp")}
            </AlertDescription>
          </Alert>
        )}

        {ndaSigning.status === "fully_signed" && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              This NDA has been fully signed by both parties.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="document">NDA Document</TabsTrigger>
            <TabsTrigger value="signature">Sign Document</TabsTrigger>
          </TabsList>

          <TabsContent value="document" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>NDA Document</CardTitle>
                <CardDescription>
                  Review the complete NDA before signing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-6 prose prose-sm max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: ndaSigning.renderedContent,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signature" className="space-y-4">
            {!isExpired && !isAlreadySigned && ndaSigning.status !== "fully_signed" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Signature Method</CardTitle>
                    <CardDescription>
                      Choose how you would like to sign this NDA
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs value={signatureType} onValueChange={(v) => setSignatureType(v as SignatureType)}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="drawn" className="gap-2">
                          <Pen className="h-4 w-4" />
                          <span className="hidden sm:inline">Draw</span>
                        </TabsTrigger>
                        <TabsTrigger value="typed" className="gap-2">
                          <Type className="h-4 w-4" />
                          <span className="hidden sm:inline">Type</span>
                        </TabsTrigger>
                        <TabsTrigger value="initials" className="gap-2">
                          <Type className="h-4 w-4" />
                          <span className="hidden sm:inline">Initials</span>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="drawn" className="space-y-4">
                        <div className="space-y-2">
                          <Label>Draw Your Signature</Label>
                          <canvas
                            ref={canvasRef}
                            width={400}
                            height={150}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair bg-white"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearSignature}
                            className="w-full"
                          >
                            Clear Signature
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="typed" className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="typed-sig">Type Your Full Name</Label>
                          <input
                            id="typed-sig"
                            type="text"
                            value={typedSignature}
                            onChange={(e) => setTypedSignature(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full px-3 py-2 border rounded-lg font-italic text-lg"
                          />
                          {typedSignature && (
                            <div className="border rounded-lg p-4 bg-gray-50">
                              <p className="text-gray-600 text-sm mb-2">Preview:</p>
                              <p style={{ fontStyle: "italic", fontSize: "24px" }}>
                                {typedSignature}
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="initials" className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="initials">Your Initials</Label>
                          <input
                            id="initials"
                            type="text"
                            value={initials}
                            onChange={(e) => setInitials(e.target.value.slice(0, 3))}
                            placeholder="e.g., JDM"
                            maxLength={3}
                            className="w-full px-3 py-2 border rounded-lg font-bold text-lg uppercase"
                          />
                          {initials && (
                            <div className="border rounded-lg p-4 bg-gray-50">
                              <p className="text-gray-600 text-sm mb-2">Preview:</p>
                              <p style={{ fontWeight: "bold", fontSize: "24px" }}>
                                {initials.toUpperCase()}
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Clickwrap Agreement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        By signing this NDA, you acknowledge that you have read, understood, and agree to be bound by all terms and conditions contained herein.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="agree-terms"
                          checked={agreedToTerms}
                          onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                        />
                        <Label
                          htmlFor="agree-terms"
                          className="text-sm font-normal cursor-pointer"
                        >
                          I have read and agree to the terms of this NDA. I understand that this is a legally binding agreement and that by signing, I am committing to maintain confidentiality as outlined.
                        </Label>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p>
                        <strong>Effective Date:</strong> {format(new Date(), "PPP")}
                      </p>
                      {ndaSigning.expiresAt && (
                        <p>
                          <strong>Signing Expires:</strong> {format(new Date(ndaSigning.expiresAt), "PPP")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSign}
                    disabled={
                      !isSignatureValid() ||
                      !agreedToTerms ||
                      signMutation.isPending
                    }
                  >
                    {signMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      "Sign NDA"
                    )}
                  </Button>
                </div>
              </>
            )}

            {(isExpired || isAlreadySigned || ndaSigning.status === "fully_signed") && (
              <div className="flex justify-end">
                <Button onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
