import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Link2, Link2Off } from "lucide-react";

type AssetType = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: number;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  sortOrder: "0",
  isActive: true,
};

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function AssetTypesTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningAssetTypeId, setAssigningAssetTypeId] = useState<number | null>(null);
  const [selectedVerticalId, setSelectedVerticalId] = useState<string>("");
  const [form, setForm] = useState<FormState>(emptyForm);

  const utils = trpc.useUtils();

  const { data: assetTypes = [], isLoading } = trpc.taxonomy.listAssetTypes.useQuery({});
  const { data: verticals = [] } = trpc.taxonomy.listVerticals.useQuery();

  const createMutation = trpc.adminTaxonomy.createAssetType.useMutation({
    onSuccess: () => {
      toast.success("Asset type created");
      utils.taxonomy.listAssetTypes.invalidate();
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.adminTaxonomy.updateAssetType.useMutation({
    onSuccess: () => {
      toast.success("Asset type updated");
      utils.taxonomy.listAssetTypes.invalidate();
      setDialogOpen(false);
      setEditingId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.adminTaxonomy.deleteAssetType.useMutation({
    onSuccess: () => {
      toast.success("Asset type deleted");
      utils.taxonomy.listAssetTypes.invalidate();
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const assignMutation = trpc.adminTaxonomy.assignAssetType.useMutation({
    onSuccess: () => {
      toast.success("Asset type assigned to vertical");
      utils.taxonomy.listAssetTypes.invalidate();
      setAssignDialogOpen(false);
      setAssigningAssetTypeId(null);
      setSelectedVerticalId("");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMutation = trpc.adminTaxonomy.removeAssetType.useMutation({
    onSuccess: () => {
      toast.success("Assignment removed");
      utils.taxonomy.listAssetTypes.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (at: AssetType) => {
    setEditingId(at.id);
    setForm({
      name: at.name,
      slug: at.slug,
      description: at.description ?? "",
      icon: at.icon ?? "",
      sortOrder: String(at.sortOrder),
      isActive: at.isActive === 1,
    });
    setDialogOpen(true);
  };

  const openAssign = (id: number) => {
    setAssigningAssetTypeId(id);
    setSelectedVerticalId("");
    setAssignDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      icon: form.icon || undefined,
      sortOrder: parseInt(form.sortOrder) || 0,
      isActive: form.isActive ? 1 : 0,
    };
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleAssign = () => {
    if (!assigningAssetTypeId || !selectedVerticalId) return;
    assignMutation.mutate({
      assetTypeId: assigningAssetTypeId,
      verticalId: parseInt(selectedVerticalId),
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Asset Types</CardTitle>
            <CardDescription>Manage asset types and assign them to verticals.</CardDescription>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Asset Type
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : assetTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No asset types yet.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assetTypes.map((at) => (
                    <TableRow key={at.id}>
                      <TableCell className="font-medium">{at.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{at.slug}</TableCell>
                      <TableCell className="text-sm">{at.icon ?? "—"}</TableCell>
                      <TableCell>{at.sortOrder}</TableCell>
                      <TableCell>
                        <Badge variant={at.isActive ? "default" : "secondary"}>
                          {at.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openAssign(at.id)} title="Assign to vertical">
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEdit(at)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDeleteId(at.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vertical Assignments section */}
      {verticals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vertical Assignments</CardTitle>
            <CardDescription>Asset types currently assigned to each vertical.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verticals.map((v) => (
              <VerticalAssetTypeList
                key={v.id}
                verticalId={v.id}
                verticalName={v.name}
                onRemove={(assetTypeId) =>
                  removeMutation.mutate({ verticalId: v.id, assetTypeId })
                }
                isRemoving={removeMutation.isPending}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Asset Type" : "Add Asset Type"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update asset type details." : "Create a new asset type."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: editingId ? f.slug : slugify(name),
                  }));
                }}
                placeholder="BTC Spot ETF"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="btc-spot-etf"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Input
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="e.g. bitcoin"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="atIsActive"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <label htmlFor="atIsActive" className="text-sm">Active</label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending || !form.name || !form.slug}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to Vertical Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Vertical</DialogTitle>
            <DialogDescription>Select a vertical to associate this asset type with.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Vertical</Label>
              <Select value={selectedVerticalId} onValueChange={setSelectedVerticalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vertical" />
                </SelectTrigger>
                <SelectContent>
                  {verticals.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedVerticalId || assignMutation.isPending}>
              {assignMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset Type</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VerticalAssetTypeList({
  verticalId,
  verticalName,
  onRemove,
  isRemoving,
}: {
  verticalId: number;
  verticalName: string;
  onRemove: (assetTypeId: number) => void;
  isRemoving: boolean;
}) {
  const { data: assigned = [] } = trpc.taxonomy.listAssetTypes.useQuery({ verticalId });

  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-medium mb-3">{verticalName}</h4>
      {assigned.length === 0 ? (
        <p className="text-sm text-muted-foreground">No asset types assigned.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {assigned.map((at) => (
            <div key={at.id} className="flex items-center gap-1 bg-secondary rounded-md px-2 py-1 text-sm">
              <span>{at.name}</span>
              <button
                onClick={() => onRemove(at.id)}
                disabled={isRemoving}
                className="ml-1 text-muted-foreground hover:text-destructive"
              >
                <Link2Off className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
