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
import { Loader2, Plus, Pencil, PowerOff } from "lucide-react";

const FIELD_TYPES = [
  'text', 'textarea', 'number', 'currency', 'percentage', 'url',
  'dropdown', 'multi_select', 'boolean', 'date', 'wallet_address', 'contract_address',
] as const;

type FieldType = typeof FIELD_TYPES[number];

type FieldDefinition = {
  id: number;
  fieldKey: string;
  label: string;
  fieldType: string;
  required: number;
  isActive: number;
  isPublic: number;
  showOnCard: number;
  filterable: number;
  sortable: number;
  sortOrder: number;
  description: string | null;
  helpText: string | null;
  options: string | null;
  verticalId: number | null;
  assetTypeId: number | null;
};

type FormState = {
  fieldKey: string;
  label: string;
  fieldType: FieldType;
  description: string;
  helpText: string;
  options: string;
  required: boolean;
  isPublic: boolean;
  showOnCard: boolean;
  filterable: boolean;
  sortable: boolean;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  fieldKey: "",
  label: "",
  fieldType: "text",
  description: "",
  helpText: "",
  options: "",
  required: false,
  isPublic: true,
  showOnCard: false,
  filterable: false,
  sortable: false,
  sortOrder: "0",
  isActive: true,
};

function toKey(label: string) {
  return label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export function ListingFieldsTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const utils = trpc.useUtils();

  const { data: fields = [], isLoading } = trpc.adminFieldDefinitions.list.useQuery();

  const createMutation = trpc.adminFieldDefinitions.create.useMutation({
    onSuccess: () => {
      toast.success("Field created");
      utils.adminFieldDefinitions.list.invalidate();
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.adminFieldDefinitions.update.useMutation({
    onSuccess: () => {
      toast.success("Field updated");
      utils.adminFieldDefinitions.list.invalidate();
      setDialogOpen(false);
      setEditingId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deactivateMutation = trpc.adminFieldDefinitions.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Field deactivated");
      utils.adminFieldDefinitions.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (f: FieldDefinition) => {
    setEditingId(f.id);
    setForm({
      fieldKey: f.fieldKey,
      label: f.label,
      fieldType: f.fieldType as FieldType,
      description: f.description ?? "",
      helpText: f.helpText ?? "",
      options: f.options ?? "",
      required: f.required === 1,
      isPublic: f.isPublic === 1,
      showOnCard: f.showOnCard === 1,
      filterable: f.filterable === 1,
      sortable: f.sortable === 1,
      sortOrder: String(f.sortOrder),
      isActive: f.isActive === 1,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      fieldKey: form.fieldKey,
      label: form.label,
      fieldType: form.fieldType,
      description: form.description || undefined,
      helpText: form.helpText || undefined,
      options: form.options || undefined,
      required: form.required ? 1 : 0,
      isPublic: form.isPublic ? 1 : 0,
      showOnCard: form.showOnCard ? 1 : 0,
      filterable: form.filterable ? 1 : 0,
      sortable: form.sortable ? 1 : 0,
      sortOrder: parseInt(form.sortOrder) || 0,
      isActive: form.isActive ? 1 : 0,
    } as const;

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
            <CardTitle>Listing Field Definitions</CardTitle>
            <CardDescription>Dynamic fields that appear on listing forms per vertical / asset type.</CardDescription>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Field
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No field definitions yet.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-sm">{f.fieldKey}</TableCell>
                      <TableCell className="font-medium">{f.label}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{f.fieldType}</Badge>
                      </TableCell>
                      <TableCell>
                        {f.required ? <Badge variant="destructive" className="text-xs">Required</Badge> : <span className="text-muted-foreground text-sm">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {f.isPublic ? <Badge variant="secondary" className="text-xs">Public</Badge> : null}
                          {f.showOnCard ? <Badge variant="secondary" className="text-xs">Card</Badge> : null}
                          {f.filterable ? <Badge variant="secondary" className="text-xs">Filter</Badge> : null}
                          {f.sortable ? <Badge variant="secondary" className="text-xs">Sort</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={f.isActive ? "default" : "secondary"}>
                          {f.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(f)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {f.isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deactivateMutation.mutate({ id: f.id })}
                              disabled={deactivateMutation.isPending}
                              title="Deactivate"
                            >
                              <PowerOff className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : null}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Field" : "Add Field Definition"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update field definition details." : "Define a new dynamic field for listing forms."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={form.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setForm((f) => ({
                      ...f,
                      label,
                      fieldKey: editingId ? f.fieldKey : toKey(label),
                    }));
                  }}
                  placeholder="Monthly Revenue"
                />
              </div>
              <div className="space-y-2">
                <Label>Field Key</Label>
                <Input
                  value={form.fieldKey}
                  onChange={(e) => setForm((f) => ({ ...f, fieldKey: e.target.value }))}
                  placeholder="monthly_revenue"
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select
                value={form.fieldType}
                onValueChange={(v) => setForm((f) => ({ ...f, fieldType: v as FieldType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description shown to sellers"
              />
            </div>
            {(form.fieldType === 'dropdown' || form.fieldType === 'multi_select') && (
              <div className="space-y-2">
                <Label>Options (JSON array)</Label>
                <Input
                  value={form.options}
                  onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                  placeholder='["Option A", "Option B"]'
                  className="font-mono text-sm"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  { key: "required", label: "Required" },
                  { key: "isPublic", label: "Public" },
                  { key: "showOnCard", label: "Show on Card" },
                  { key: "filterable", label: "Filterable" },
                  { key: "sortable", label: "Sortable" },
                  { key: "isActive", label: "Active" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`field-${key}`}
                    checked={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <label htmlFor={`field-${key}`} className="text-sm">{label}</label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending || !form.label || !form.fieldKey}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
