import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2, Layers, DollarSign, Percent } from "lucide-react";

type CategoryWithPrice = {
  id: number;
  name: string;
  slug: string;
  type: "business" | "asset";
  description: string | null;
  isActive: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  priceStructure: {
    id: number;
    categoryId: number;
    feeType: "percentage" | "fixed";
    feeValue: string;
    currency: string;
    premiumUpgradePrice: number | null;
  } | null;
};

const emptyForm = {
  name: "",
  slug: "",
  type: "business" as "business" | "asset",
  description: "",
  isActive: true,
  sortOrder: 0,
  priceStructure: {
    feeType: "percentage" as "percentage" | "fixed",
    feeValue: "3",
    currency: "USD",
    premiumUpgradePrice: null as number | null,
  },
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function CategoryManagementTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: categories, refetch } = trpc.category.listAll.useQuery();
  const createMutation = trpc.category.create.useMutation();
  const updateMutation = trpc.category.update.useMutation();
  const toggleMutation = trpc.category.toggleActive.useMutation();
  const deleteMutation = trpc.category.delete.useMutation();

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (cat: CategoryWithPrice) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      type: cat.type,
      description: cat.description ?? "",
      isActive: cat.isActive === 1,
      sortOrder: cat.sortOrder,
      priceStructure: cat.priceStructure
        ? {
            feeType: cat.priceStructure.feeType,
            feeValue: cat.priceStructure.feeValue,
            currency: cat.priceStructure.currency,
            premiumUpgradePrice: cat.priceStructure.premiumUpgradePrice
              ? cat.priceStructure.premiumUpgradePrice / 100
              : null,
          }
        : emptyForm.priceStructure,
    });
    setIsDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: editingId ? f.slug : slugify(name),
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.slug) {
      toast.error("Name and slug are required");
      return;
    }

    const payload = {
      ...form,
      priceStructure: {
        ...form.priceStructure,
        feeValue: String(form.priceStructure.feeValue),
        premiumUpgradePrice: form.priceStructure.premiumUpgradePrice
          ? Math.round(form.priceStructure.premiumUpgradePrice * 100)
          : null,
      },
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload });
        toast.success("Category updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Category created");
      }
      setIsDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    }
  };

  const handleToggle = async (id: number, current: number) => {
    try {
      await toggleMutation.mutateAsync({ id, isActive: current !== 1 });
      refetch();
    } catch {
      toast.error("Failed to toggle category");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Category deleted");
      setDeleteConfirmId(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    }
  };

  const businessCats = categories?.filter((c) => c.type === "business") ?? [];
  const assetCats = categories?.filter((c) => c.type === "asset") ?? [];

  const renderCategory = (cat: CategoryWithPrice) => (
    <div
      key={cat.id}
      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Switch
          checked={cat.isActive === 1}
          onCheckedChange={() => handleToggle(cat.id, cat.isActive)}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{cat.name}</span>
            {cat.isActive !== 1 && (
              <Badge variant="secondary" className="text-xs">Inactive</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground font-mono">{cat.slug}</span>
            {cat.priceStructure && (
              <span className="text-xs text-muted-foreground">
                ·{" "}
                {cat.priceStructure.feeType === "percentage"
                  ? `${cat.priceStructure.feeValue}% success fee`
                  : `$${(Number(cat.priceStructure.feeValue) / 100).toFixed(0)} fixed`}
                {cat.priceStructure.premiumUpgradePrice && (
                  <> · ${(cat.priceStructure.premiumUpgradePrice / 100).toFixed(0)} premium</>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(cat)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => setDeleteConfirmId(cat.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Category Management</h2>
          <p className="text-muted-foreground">
            Add, edit, and configure categories and their pricing. Changes apply immediately to all listing forms.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Business Categories
            </CardTitle>
            <CardDescription>
              Success-based % fee — seller pays only when a deal closes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {businessCats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No business categories yet</p>
            ) : (
              businessCats.map(renderCategory)
            )}
          </CardContent>
        </Card>

        {/* Asset Categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-violet-500" />
              Asset Categories
            </CardTitle>
            <CardDescription>
              Fixed pre-paid listing fee — seller pays upfront to list
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {assetCats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No asset categories yet</p>
            ) : (
              assetCats.map(renderCategory)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Category" : "New Category"}</DialogTitle>
            <DialogDescription>
              Configure the category name, type, and pricing structure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., SaaS / Software"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">Slug *</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
                placeholder="e.g., saas-software"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only. Auto-generated from name.</p>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select
                value={form.type}
                onValueChange={(v: "business" | "asset") =>
                  setForm((f) => ({
                    ...f,
                    type: v,
                    priceStructure: {
                      ...f.priceStructure,
                      feeType: v === "business" ? "percentage" : "fixed",
                      feeValue: v === "business" ? "3" : "99",
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" /> Business (% success fee)
                    </span>
                  </SelectItem>
                  <SelectItem value="asset">
                    <span className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5" /> Asset (fixed listing fee)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description shown to sellers when selecting a category"
                rows={2}
              />
            </div>

            {/* Sort Order */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-sort">Sort Order</Label>
              <Input
                id="cat-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label>Active (visible to sellers)</Label>
            </div>

            {/* Price Structure */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <p className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Pricing
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Fee Type</Label>
                  <Select
                    value={form.priceStructure.feeType}
                    onValueChange={(v: "percentage" | "fixed") =>
                      setForm((f) => ({ ...f, priceStructure: { ...f.priceStructure, feeType: v } }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">% Success Fee</SelectItem>
                      <SelectItem value="fixed">Fixed Fee (pre-paid)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>
                    {form.priceStructure.feeType === "percentage" ? "Fee %" : "Fee (USD)"}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      value={form.priceStructure.feeValue}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, priceStructure: { ...f.priceStructure, feeValue: e.target.value } }))
                      }
                    />
                    <div className="absolute right-3 top-2.5 text-muted-foreground">
                      {form.priceStructure.feeType === "percentage" ? (
                        <Percent className="h-4 w-4" />
                      ) : (
                        <DollarSign className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="premium-price">Premium Upgrade Price (USD, optional)</Label>
                <Input
                  id="premium-price"
                  type="number"
                  step="1"
                  placeholder="e.g., 99"
                  value={form.priceStructure.premiumUpgradePrice ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      priceStructure: {
                        ...f.priceStructure,
                        premiumUpgradePrice: e.target.value ? Number(e.target.value) : null,
                      },
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Pre-paid fee for featured/premium exposure. Leave blank to disable premium upgrades for this category.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category?</DialogTitle>
            <DialogDescription>
              This will permanently delete the category and its pricing structure. Existing listings using this category will have their category cleared. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
