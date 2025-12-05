import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { DollarSign, Loader2, Star, Eye, EyeOff, Edit2, Check, X } from "lucide-react";

export function PricingTab() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Fetch all price plans
  const { data: plans = [], isLoading, refetch } = trpc.pricePlan.getAll.useQuery();

  // Update plan mutation
  const updatePlanMutation = trpc.pricePlan.update.useMutation({
    onSuccess: () => {
      toast.success("Price plan updated successfully");
      refetch();
      setEditingId(null);
      setEditForm({});
    },
    onError: (error) => {
      toast.error("Failed to update plan: " + error.message);
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = trpc.pricePlan.toggleActive.useMutation({
    onSuccess: (data) => {
      toast.success(`Plan ${data.isActive ? "activated" : "deactivated"}`);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to toggle plan: " + error.message);
    },
  });

  const handleEdit = (plan: any) => {
    setEditingId(plan.id);
    setEditForm({
      name: plan.name,
      description: plan.description || "",
      price: plan.price / 100, // Convert cents to dollars for display
      features: plan.features.join("\n"), // One feature per line
      isFeatured: plan.isFeatured,
      allowsThumbnail: plan.allowsThumbnail,
      carouselPlacement: plan.carouselPlacement,
      prioritySupport: plan.prioritySupport,
    });
  };

  const handleSave = (planId: number) => {
    updatePlanMutation.mutate({
      id: planId,
      name: editForm.name,
      description: editForm.description,
      price: Math.round(editForm.price * 100), // Convert dollars to cents
      features: editForm.features.split("\n").filter((f: string) => f.trim()),
      isFeatured: editForm.isFeatured,
      allowsThumbnail: editForm.allowsThumbnail,
      carouselPlacement: editForm.carouselPlacement,
      prioritySupport: editForm.prioritySupport,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const formatPrice = (cents: number, period: string) => {
    if (cents === 0) return "FREE";
    const dollars = cents / 100;
    const periodText = period === "weekly" ? "/week" : period === "monthly" ? "/month" : "";
    return `$${dollars.toFixed(0)}${periodText}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Price Plans Management</h2>
        <p className="text-muted-foreground">
          Configure pricing tiers for listing upgrades. Changes take effect immediately on the pricing page and throughout the platform.
        </p>
      </div>

      <div className="grid gap-6">
        {plans.map((plan) => {
          const isEditing = editingId === plan.id;

          return (
            <Card key={plan.id} className={plan.isActive ? "" : "opacity-60"}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Label>Plan Name</Label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="e.g., Premium Featured"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {plan.tier.replace("_", " ")}
                        </Badge>
                        {plan.isFeatured && (
                          <Badge className="bg-yellow-500 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Most Popular
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {isEditing ? (
                      <div className="space-y-2 mt-4">
                        <Label>Description</Label>
                        <Input
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Short description"
                        />
                      </div>
                    ) : (
                      <CardDescription className="mt-2">{plan.description}</CardDescription>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActiveMutation.mutate({ id: plan.id })}
                        >
                          {plan.isActive ? (
                            <><Eye className="h-4 w-4 mr-2" /> Active</>
                          ) : (
                            <><EyeOff className="h-4 w-4 mr-2" /> Inactive</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </>
                    )}
                    {isEditing && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSave(plan.id)}
                          disabled={updatePlanMutation.isPending}
                        >
                          {updatePlanMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <><Check className="h-4 w-4 mr-2" /> Save</>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancel}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Pricing */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pricing
                    </h4>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Label>Price (USD)</Label>
                        <Input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          step="1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Billing: {plan.billingPeriod.replace("_", " ")}
                        </p>
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-primary">
                        {formatPrice(plan.price, plan.billingPeriod)}
                      </div>
                    )}
                  </div>

                  {/* Feature Flags */}
                  <div>
                    <h4 className="font-semibold mb-3">Feature Flags</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`featured-${plan.id}`}>Mark as "Most Popular"</Label>
                        <Switch
                          id={`featured-${plan.id}`}
                          checked={isEditing ? editForm.isFeatured : plan.isFeatured}
                          onCheckedChange={(checked) => {
                            if (isEditing) {
                              setEditForm({ ...editForm, isFeatured: checked });
                            }
                          }}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`thumbnail-${plan.id}`}>Allow Thumbnail Upload</Label>
                        <Switch
                          id={`thumbnail-${plan.id}`}
                          checked={isEditing ? editForm.allowsThumbnail : plan.allowsThumbnail}
                          onCheckedChange={(checked) => {
                            if (isEditing) {
                              setEditForm({ ...editForm, allowsThumbnail: checked });
                            }
                          }}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`carousel-${plan.id}`}>Carousel Placement</Label>
                        <Switch
                          id={`carousel-${plan.id}`}
                          checked={isEditing ? editForm.carouselPlacement : plan.carouselPlacement}
                          onCheckedChange={(checked) => {
                            if (isEditing) {
                              setEditForm({ ...editForm, carouselPlacement: checked });
                            }
                          }}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`support-${plan.id}`}>Priority Support</Label>
                        <Switch
                          id={`support-${plan.id}`}
                          checked={isEditing ? editForm.prioritySupport : plan.prioritySupport}
                          onCheckedChange={(checked) => {
                            if (isEditing) {
                              setEditForm({ ...editForm, prioritySupport: checked });
                            }
                          }}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Features Included</h4>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label>Features (one per line)</Label>
                      <Textarea
                        value={editForm.features}
                        onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                        placeholder="Enter features, one per line"
                        rows={6}
                      />
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {plan.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
