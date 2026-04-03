import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, EyeOff, Eye, Building2, Layers } from "lucide-react";

type Category = {
  id: number;
  name: string;
  slug: string;
  group: "business" | "asset";
  description: string | null;
  displayOrder: number;
  isActive: number;
  relevantMetrics: unknown;
};

const METRIC_OPTIONS = [
  { value: "mrr", label: "MRR (Monthly Recurring Revenue)" },
  { value: "arr", label: "ARR (Annual Recurring Revenue)" },
  { value: "ebitda", label: "EBITDA" },
  { value: "annualRevenue", label: "Annual Revenue" },
  { value: "clientCount", label: "Client / Customer Count" },
  { value: "employeeCount", label: "Employee Count" },
  { value: "churnRate", label: "Churn Rate" },
  { value: "ggr", label: "GGR (Gross Gaming Revenue)" },
  { value: "mau", label: "MAU (Monthly Active Users/Players)" },
  { value: "licenseJurisdiction", label: "License Jurisdiction" },
  { value: "platformType", label: "Platform Type" },
  { value: "tvl", label: "TVL (Total Value Locked)" },
  { value: "tokenHolders", label: "Token Holders" },
  { value: "dailyActiveWallets", label: "Daily Active Wallets" },
  { value: "protocolRevenue", label: "Protocol Revenue" },
  { value: "treasurySize", label: "Treasury Size" },
  { value: "chain", label: "Blockchain / Chain" },
  { value: "floorPrice", label: "Floor Price" },
  { value: "totalVolume", label: "Total Volume" },
  { value: "holderCount", label: "Holder Count" },
  { value: "monthlyTraffic", label: "Monthly Traffic" },
  { value: "domainAuthority", label: "Domain Authority (DA)" },
  { value: "monetizationMethod", label: "Monetization Method" },
  { value: "licenseType", label: "License Type" },
  { value: "licenseExpiry", label: "License Expiry Date" },
  { value: "licenseStatus", label: "Current License Status" },
];

const emptyForm = {
  name: "",
  slug: "",
  group: "business" as "business" | "asset",
  description: "",
  displayOrder: 0,
  relevantMetrics: [] as string[],
};

export function CategoryManagerTab() {
  const { data: categories = [], refetch } = trpc.categories.list.useQuery({ includeInactive: true });
  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => { toast.success("Category created."); refetch(); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => { toast.success("Category updated."); refetch(); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const toggleMutation = trpc.categories.update.useMutation({
    onSuccess: () => { refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      group: cat.group,
      description: cat.description ?? "",
      displayOrder: cat.displayOrder,
      relevantMetrics: Array.isArray(cat.relevantMetrics) ? (cat.relevantMetrics as string[]) : [],
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required.");
      return;
    }
    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        name: form.name,
        group: form.group,
        description: form.description || undefined,
        displayOrder: form.displayOrder,
        relevantMetrics: form.relevantMetrics,
      });
    } else {
      createMutation.mutate({
        name: form.name,
        slug: form.slug,
        group: form.group,
        description: form.description || undefined,
        displayOrder: form.displayOrder,
        relevantMetrics: form.relevantMetrics,
      });
    }
  };

  const toggleActive = (cat: Category) => {
    toggleMutation.mutate({ id: cat.id, isActive: !cat.isActive });
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const businessCats = (categories as Category[]).filter(c => c.group === "business");
  const assetCats = (categories as Category[]).filter(c => c.group === "asset");

  const renderGroup = (title: string, icon: React.ReactNode, cats: Category[]) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon} {title}
          <Badge variant="secondary" className="ml-auto">{cats.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <div className="space-y-2">
            {cats.sort((a, b) => a.displayOrder - b.displayOrder).map(cat => (
              <div key={cat.id} className={`flex items-center gap-3 p-2 rounded-md border ${!cat.isActive ? "opacity-50 bg-muted/30" : "bg-background"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{cat.name}</span>
                    {!cat.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{cat.slug}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(cat)}>
                    {cat.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Listing Categories</h2>
          <p className="text-muted-foreground mt-1">
            Manage categories for both Business and Asset listings. You can move categories between groups or deactivate them at any time.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> New Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderGroup("Business", <Building2 className="w-4 h-4 text-blue-500" />, businessCats)}
        {renderGroup("Asset", <Layers className="w-4 h-4 text-purple-500" />, assetCats)}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({
                  ...f,
                  name: e.target.value,
                  slug: editing ? f.slug : autoSlug(e.target.value),
                }))}
                placeholder="e.g. iGaming Business"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Slug * {editing && <span className="text-xs text-muted-foreground">(cannot be changed)</span>}</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="e.g. igaming-business"
                disabled={!!editing}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers and hyphens only.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Group *</Label>
              <Select
                value={form.group}
                onValueChange={(v) => setForm(f => ({ ...f, group: v as "business" | "asset" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business — operating businesses being sold</SelectItem>
                  <SelectItem value="asset">Asset — digital or physical assets</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description shown to sellers when selecting this category"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">Lower number = shown first.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Relevant Metrics</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Select which metric fields are shown in the listing form for this category.
              </p>
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto border rounded-md p-2">
                {METRIC_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={form.relevantMetrics.includes(opt.value)}
                      onChange={(e) => {
                        setForm(f => ({
                          ...f,
                          relevantMetrics: e.target.checked
                            ? [...f.relevantMetrics, opt.value]
                            : f.relevantMetrics.filter(m => m !== opt.value),
                        }));
                      }}
                      className="w-3.5 h-3.5"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
