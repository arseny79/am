import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

type Chain = {
  id: number;
  name: string;
  slug: string;
  chainId: number | null;
  rpcUrl: string | null;
  logoUrl: string | null;
  isActive: number;
};

type FormState = {
  name: string;
  slug: string;
  chainId: string;
  rpcUrl: string;
  logoUrl: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  chainId: "",
  rpcUrl: "",
  logoUrl: "",
  isActive: true,
};

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function ChainsTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const utils = trpc.useUtils();

  const { data: chains = [], isLoading } = trpc.chains.list.useQuery();

  const createMutation = trpc.adminChains.create.useMutation({
    onSuccess: () => {
      toast.success("Chain created");
      utils.chains.list.invalidate();
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.adminChains.update.useMutation({
    onSuccess: () => {
      toast.success("Chain updated");
      utils.chains.list.invalidate();
      setDialogOpen(false);
      setEditingId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.adminChains.delete.useMutation({
    onSuccess: () => {
      toast.success("Chain deleted");
      utils.chains.list.invalidate();
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Chain) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      chainId: c.chainId !== null ? String(c.chainId) : "",
      rpcUrl: c.rpcUrl ?? "",
      logoUrl: c.logoUrl ?? "",
      isActive: c.isActive === 1,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      slug: form.slug,
      chainId: form.chainId ? parseInt(form.chainId) : undefined,
      rpcUrl: form.rpcUrl || undefined,
      logoUrl: form.logoUrl || undefined,
      isActive: form.isActive ? 1 : 0,
    };
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Supported Chains</CardTitle>
            <CardDescription>Manage blockchain networks for wallet verification.</CardDescription>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Chain
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : chains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No chains yet.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Chain ID</TableHead>
                    <TableHead>RPC URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chains.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {c.logoUrl && (
                            <img src={c.logoUrl} alt={c.name} className="h-5 w-5 rounded-full" />
                          )}
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{c.slug}</TableCell>
                      <TableCell className="text-sm">{c.chainId ?? "—"}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate text-muted-foreground">
                        {c.rpcUrl ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.isActive ? "default" : "secondary"}>
                          {c.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDeleteId(c.id)}>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Chain" : "Add Chain"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update chain details." : "Add a new supported blockchain network."}
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
                placeholder="Ethereum"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="ethereum"
              />
            </div>
            <div className="space-y-2">
              <Label>Chain ID (EVM)</Label>
              <Input
                type="number"
                value={form.chainId}
                onChange={(e) => setForm((f) => ({ ...f, chainId: e.target.value }))}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label>RPC URL</Label>
              <Input
                value={form.rpcUrl}
                onChange={(e) => setForm((f) => ({ ...f, rpcUrl: e.target.value }))}
                placeholder="https://mainnet.infura.io/v3/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={form.logoUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chainIsActive"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4"
              />
              <label htmlFor="chainIsActive" className="text-sm">Active</label>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chain</DialogTitle>
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
