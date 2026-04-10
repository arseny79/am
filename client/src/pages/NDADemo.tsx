import { useState } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NDASigningModal } from "@/components/NDASigningModal";
import { FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

/**
 * NDA Demo Page
 * 
 * Demonstrates the NDA signing components and workflow
 * Shows both the signing modal and status display
 */
export default function NDADemo() {
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<"pending" | "partial" | "complete">("pending");

  // Mock NDA data for demo purposes
  const mockNDAData = {
    pending: {
      id: 1,
      dealId: 123,
      buyerSigned: false,
      sellerSigned: false,
      buyerSignedAt: null,
      sellerSignedAt: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "pending" as const,
      ndaTemplate: {
        id: 1,
        name: "Standard NDA",
        content: `# NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement (the "Agreement") is entered into as of {{current_date}} by and between:

**DISCLOSING PARTY:** {{seller_name}}
**RECEIVING PARTY:** {{buyer_name}}

## 1. CONFIDENTIAL INFORMATION

The Disclosing Party agrees to disclose certain confidential information regarding the business known as "{{business_name}}" to the Receiving Party for the purpose of evaluating a potential acquisition.

## 2. OBLIGATIONS

The Receiving Party agrees to:
- Keep all Confidential Information strictly confidential
- Use the information solely for evaluation purposes
- Not disclose to any third parties without prior written consent
- Return or destroy all materials upon request

## 3. TERM

This Agreement shall remain in effect for a period of two (2) years from the date of execution.

## 4. GOVERNING LAW

This Agreement shall be governed by the laws of the State of Delaware.

---

**By signing below, both parties acknowledge and agree to the terms of this Non-Disclosure Agreement.**`,
        variables: {
          seller_name: "Acme Holdings LLC",
          buyer_name: "Potential Buyer",
          business_name: "Acme Holdings",
          current_date: new Date().toLocaleDateString()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    partial: {
      id: 2,
      dealId: 124,
      buyerSigned: true,
      sellerSigned: false,
      buyerSignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      sellerSignedAt: null,
      expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      status: "partial" as const,
      ndaTemplate: {
        id: 1,
        name: "Standard NDA",
        content: "# NON-DISCLOSURE AGREEMENT\n\n[Full content here...]",
        variables: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    complete: {
      id: 3,
      dealId: 125,
      buyerSigned: true,
      sellerSigned: true,
      buyerSignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      sellerSignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      status: "complete" as const,
      ndaTemplate: {
        id: 1,
        name: "Standard NDA",
        content: "# NON-DISCLOSURE AGREEMENT\n\n[Full content here...]",
        variables: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  };

  const currentNDA = mockNDAData[selectedScenario];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-12 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <FileText className="h-10 w-10 text-primary" />
              NDA Module Demo
            </h1>
            <p className="text-lg text-muted-foreground">
              Interactive demonstration of the NDA signing workflow and components
            </p>
          </div>

          {/* Scenario Selector */}
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle>Select Demo Scenario</CardTitle>
              <CardDescription>
                Choose different NDA states to see how the components respond
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button
                  variant={selectedScenario === "pending" ? "default" : "outline"}
                  onClick={() => setSelectedScenario("pending")}
                  className="h-auto py-4 flex flex-col items-start gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">Pending</span>
                  </div>
                  <span className="text-xs text-left opacity-80">
                    No signatures yet
                  </span>
                </Button>

                <Button
                  variant={selectedScenario === "partial" ? "default" : "outline"}
                  onClick={() => setSelectedScenario("partial")}
                  className="h-auto py-4 flex flex-col items-start gap-2"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">Partial</span>
                  </div>
                  <span className="text-xs text-left opacity-80">
                    Buyer signed, awaiting seller
                  </span>
                </Button>

                <Button
                  variant={selectedScenario === "complete" ? "default" : "outline"}
                  onClick={() => setSelectedScenario("complete")}
                  className="h-auto py-4 flex flex-col items-start gap-2"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Complete</span>
                  </div>
                  <span className="text-xs text-left opacity-80">
                    Both parties signed
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Display */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Buyer Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Buyer Status</span>
                  {currentNDA.buyerSigned ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Signed
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentNDA.buyerSigned && currentNDA.buyerSignedAt ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Signed on {currentNDA.buyerSignedAt.toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      at {currentNDA.buyerSignedAt.toLocaleTimeString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Awaiting buyer signature
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Seller Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Seller Status</span>
                  {currentNDA.sellerSigned ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Signed
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentNDA.sellerSigned && currentNDA.sellerSignedAt ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Signed on {currentNDA.sellerSignedAt.toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      at {currentNDA.sellerSignedAt.toLocaleTimeString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Awaiting seller signature
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Try the Signing Modal</CardTitle>
              <CardDescription>
                Click below to open the interactive NDA signing modal with signature capture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                onClick={() => setShowSigningModal(true)}
                className="w-full md:w-auto"
              >
                <FileText className="h-5 w-5 mr-2" />
                Open NDA Signing Modal
              </Button>
            </CardContent>
          </Card>

          {/* Features List */}
          <Card>
            <CardHeader>
              <CardTitle>NDA Module Features</CardTitle>
              <CardDescription>
                Complete implementation with backend and frontend components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Backend Features
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>• tRPC procedures for NDA operations</li>
                    <li>• Multi-signature support (buyer + seller)</li>
                    <li>• Expiration tracking (30 days default)</li>
                    <li>• Access control and permissions</li>
                    <li>• Audit logging for compliance</li>
                    <li>• Variable substitution in templates</li>
                    <li>• 14/14 tests passing</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Frontend Features
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>• Document review with markdown rendering</li>
                    <li>• Three signature methods: drawn, typed, initials</li>
                    <li>• Clickwrap agreement checkbox</li>
                    <li>• Real-time signature preview</li>
                    <li>• Status tracking and progress indicators</li>
                    <li>• Expiration warnings</li>
                    <li>• Mobile-responsive design</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* NDA Signing Modal */}
      <NDASigningModal
        open={showSigningModal}
        onOpenChange={setShowSigningModal}
        ndaSigningId={currentNDA.id}
        dealId={currentNDA.dealId}
        onSigningComplete={() => {
          setShowSigningModal(false);
          toast.success("NDA signed successfully!");
        }}
      />
    </div>
  );
}
