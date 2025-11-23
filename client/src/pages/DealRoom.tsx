import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2, Upload, FileText, Download, MessageSquare, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { ActionItems } from "@/components/ActionItems";

const STAGE_ORDER = [
  { key: "initial_contact", label: "Initial Contact" },
  { key: "nda_signed", label: "NDA Signed" },
  { key: "due_diligence", label: "Due Diligence" },
  { key: "negotiation", label: "Negotiation" },
  { key: "closing", label: "Closing" },
  { key: "closed", label: "Closed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function DealRoom() {
  const { id } = useParams();
  const dealId = parseInt(id || "0");
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [message, setMessage] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  const { data: deal, isLoading: dealLoading, refetch: refetchDeal } = trpc.deal.getById.useQuery({ id: dealId }, {
    enabled: isAuthenticated && dealId > 0,
  });

  const { data: documents = [], refetch: refetchDocs } = trpc.document.getByDeal.useQuery({ dealId, latestOnly: true }, {
    enabled: isAuthenticated && dealId > 0,
  });

  const { data: messages = [], refetch: refetchMessages } = trpc.dealMessage.getByDeal.useQuery({ dealId }, {
    enabled: isAuthenticated && dealId > 0,
  });

  const updateStageMutation = trpc.deal.updateStage.useMutation({
    onSuccess: () => {
      toast.success("Deal stage updated");
      refetchDeal();
    },
    onError: (error) => {
      toast.error("Failed to update stage: " + error.message);
    },
  });

  const sendMessageMutation = trpc.dealMessage.send.useMutation({
    onSuccess: () => {
      setMessage("");
      refetchMessages();
    },
    onError: (error) => {
      toast.error("Failed to send message: " + error.message);
    },
  });

  const uploadDocMutation = trpc.document.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      refetchDocs();
      setUploadingFile(false);
    },
    onError: (error) => {
      toast.error("Failed to upload document: " + error.message);
      setUploadingFile(false);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result?.toString().split(",")[1];
        if (!base64) {
          setUploadingFile(false);
          return;
        }

        uploadDocMutation.mutate({
          dealId,
          fileName: file.name,
          fileData: base64,
          category: "general",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload document");
      setUploadingFile(false);
    }
  };

  if (authLoading || dealLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Please sign in to view this deal</p>
        <a href={getLoginUrl()}>
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Deal not found</p>
        <Link href="/deals">
          <Button>View All Deals</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">{APP_TITLE}</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/deals">
              <Button variant="ghost">My Deals</Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="ghost">Marketplace</Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container max-w-7xl">
          {/* Deal Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{deal.listing?.businessName}</h1>
                <p className="text-muted-foreground">
                  {deal.isBuyer ? `Seller: ${deal.seller?.name}` : `Buyer: ${deal.buyer?.name}`}
                </p>
              </div>
              <Badge variant={deal.stage === "closed" ? "default" : "secondary"} className="text-lg px-4 py-2">
                {STAGE_ORDER.find(s => s.key === deal.stage)?.label}
              </Badge>
            </div>

            {/* Kanban Progress Bar */}
            <Card>
              <CardHeader>
                <CardTitle>Deal Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {STAGE_ORDER.filter(s => s.key !== "cancelled").map((stage, index) => {
                    const currentIndex = STAGE_ORDER.findIndex(s => s.key === deal.stage);
                    const stageIndex = STAGE_ORDER.findIndex(s => s.key === stage.key);
                    const isActive = stageIndex === currentIndex;
                    const isComplete = stageIndex < currentIndex;

                    return (
                      <div key={stage.key} className="flex items-center flex-1">
                        <button
                          onClick={() => {
                            if (stageIndex > currentIndex) {
                              updateStageMutation.mutate({ dealId, stage: stage.key as any });
                            }
                          }}
                          disabled={updateStageMutation.isPending || stageIndex < currentIndex}
                          className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                            isActive
                              ? "border-primary bg-primary/10 font-semibold"
                              : isComplete
                              ? "border-green-500 bg-green-50 dark:bg-green-950"
                              : "border-border hover:border-primary/50"
                          } ${stageIndex > currentIndex ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <div className="text-sm">{stage.label}</div>
                        </button>
                        {index < STAGE_ORDER.length - 2 && (
                          <ArrowRight className="h-4 w-4 mx-1 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Items Section */}
          <ActionItems 
            dealId={dealId} 
            isBuyer={deal.isBuyer} 
            isSeller={deal.isOwner} 
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Vault
                </CardTitle>
                <CardDescription>
                  Upload and manage deal documents with automatic version control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploadingFile ? "Uploading..." : "Click to upload document"}
                        </p>
                      </div>
                      <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                    </Label>
                  </div>

                  <div className="space-y-2">
                    {documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No documents uploaded yet
                      </p>
                    ) : (
                      documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{doc.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              v{doc.version} • Uploaded by {doc.uploader?.name} •{" "}
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messages Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </CardTitle>
                <CardDescription>
                  Communicate directly with the {deal.isBuyer ? "seller" : "buyer"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No messages yet. Start the conversation!
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.isMine
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (message.trim()) {
                            sendMessageMutation.mutate({ dealId, content: message });
                          }
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        if (message.trim()) {
                          sendMessageMutation.mutate({ dealId, content: message });
                        }
                      }}
                      disabled={!message.trim() || sendMessageMutation.isPending}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listing Details */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Listing Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Annual Revenue</p>
                  <p className="text-lg font-semibold">
                    ${deal.listing?.annualRevenue?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">EBITDA</p>
                  <p className="text-lg font-semibold">
                    ${deal.listing?.ebitda?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clients</p>
                  <p className="text-lg font-semibold">{deal.listing?.clientCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-lg font-semibold">{deal.listing?.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
