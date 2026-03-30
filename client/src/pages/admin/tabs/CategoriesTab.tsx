import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Edit2, Trash2, Check, X, Tag } from "lucide-react";

type Category = {
  id: number;
  group: string;
  label: string;
  slug: string;
  sortOrder: number;
  isActive: number;
};

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function CategoriesTab() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({ group: "", label: "", slug: "", sortOrder: 0 });

  const { data: categories = [], isLoading, refetch } = trpc.category.listAll.useQuery();

  const createMutation = trpc.category.create.useMutation({
    onSuccess: () => {
      toast.success("Category created");
      refetch();
      setShowNewForm(false);
      setNewForm({ group: "", label: "", slug: "", sortOrder: 0 });
    },
    onError: (e) => toast.error("Failed to create: " + e.message),
  });

  const updateMutation = trpc.category.update.useMutation({
    onSuccess: () => {
      toast.success("Category updated");
      refetch();
      setEditingId(null);
    },
    onError: (e) => toast.error("Failed to update: " + e.message),
  });

  const deleteMutation = trpc.category.delete.useMutation({
    onSuccess: () => {
      toast.success("Category deleted");
      refetch();
    },
    onError: (e) => toast.error("Failed to delete: " + e.message),
  });

  // Auto-generate slug from label
  const toSlug = (label: string) =>
    label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Group categories by group name
  const grouped = categories.reduce<Record<string, Category[]>>((acc, cat) => {
    if (!acc[cat.group]) acc[cat.group] = [];
    acc[cat.group].push(cat);
    return acc;
  }, {});

  const allGroups = Array.from(new Set(categories.map((c) => c.group)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Listing Categories</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage iGaming listing categories shown to sellers
          </p>
        </div>
        <Button onClick={() => setShowNewForm(true)} disabled={showNewForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* New category form */}
      {showNewForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">New Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Group</Label>
                <Input
                  list="group-suggestions"
                  value={newForm.group}
                  onChange={(e) => setNewForm({ ...newForm, group: e.target.value })}
                  placeholder="e.g. Operations & Businesses"
                />
                <datalist id="group-suggestions">
                  {allGroups.map((g) => <option key={g} value={g} />)}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={newForm.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setNewForm({ ...newForm, label, slug: toSlug(label) });
                  }}
                  placeholder="e.g. B2C Business"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={newForm.slug}
                  onChange={(e) => setNewForm({ ...newForm, slug: e.target.value })}
                  placeholder="e.g. b2c-business"
                />
                <p className="text-xs text-muted-foreground">Lowercase letters, numbers, hyphens only</p>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={newForm.sortOrder}
                  onChange={(e) => setNewForm({ ...newForm, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => createMutation.mutate(newForm)}
                disabled={createMutation.isPending || !newForm.group || !newForm.label || !newForm.slug}
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category groups */}
      {Object.entries(grouped).map(([group, cats]) => (
        <Card key={group}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4 text-primary" />
              {group}
              <Badge variant="secondary" className="ml-auto">{cats.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cats.map((cat) =>
                editingId === cat.id ? (
                  <div key={cat.id} className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                    <Input
                      className="w-40"
                      value={editForm.group ?? cat.group}
                      onChange={(e) => setEditForm({ ...editForm, group: e.target.value })}
                      placeholder="Group"
                    />
                    <Input
                      className="flex-1"
                      value={editForm.label ?? cat.label}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                      placeholder="Label"
                    />
                    <Input
                      className="w-40"
                      value={editForm.slug ?? cat.slug}
                      onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                      placeholder="Slug"
                    />
                    <Input
                      type="number"
                      className="w-20"
                      value={editForm.sortOrder ?? cat.sortOrder}
                      onChange={(e) => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value) || 0 })}
                    />
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => updateMutation.mutate({ id: cat.id, ...editForm })}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditForm({}); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div key={cat.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm text-foreground">{cat.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">/{cat.slug}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">order: {cat.sortOrder}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={cat.isActive === 1}
                        onCheckedChange={(checked) =>
                          updateMutation.mutate({ id: cat.id, isActive: checked })
                        }
                      />
                      <span className="text-xs text-muted-foreground w-16">
                        {cat.isActive === 1 ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditingId(cat.id); setEditForm({}); }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Delete "${cat.label}"? This cannot be undone.`)) {
                            deleteMutation.mutate({ id: cat.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {categories.length === 0 && !showNewForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No categories yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Run the migration script (<code>node add-categories.mjs</code>) to seed iGaming categories, or add them manually.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
