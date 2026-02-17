import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BuyerRequestData {
  id: number;
  title: string;
  description: string;
  minRevenue: number | null;
  maxRevenue: number | null;
  minEbitda: number | null;
  maxEbitda: number | null;
  preferredLocations: string | null;
  requiredServiceMix: string | null;
  budget: number | null;
  timeline: string | null;
  additionalRequirements: string | null;
  isAnonymous: number;
}

interface BuyerRequestEditFormProps {
  request: BuyerRequestData;
  onCancel: () => void;
  onSaved: () => void;
}

export function BuyerRequestEditForm({ request, onCancel, onSaved }: BuyerRequestEditFormProps) {
  const [formData, setFormData] = useState({
    title: request.title,
    description: request.description,
    minRevenue: request.minRevenue?.toString() || "",
    maxRevenue: request.maxRevenue?.toString() || "",
    minEbitda: request.minEbitda?.toString() || "",
    maxEbitda: request.maxEbitda?.toString() || "",
    preferredLocations: request.preferredLocations || "",
    requiredServiceMix: request.requiredServiceMix || "",
    budget: request.budget?.toString() || "",
    timeline: request.timeline || "",
    additionalRequirements: request.additionalRequirements || "",
    isAnonymous: request.isAnonymous === 1,
  });

  const updateMutation = trpc.buyerRequest.update.useMutation({
    onSuccess: () => {
      toast.success("Request updated successfully!");
      onSaved();
    },
    onError: (error) => {
      toast.error("Failed to update request: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateMutation.mutate({
      id: request.id,
      title: formData.title,
      description: formData.description,
      minRevenue: formData.minRevenue ? parseInt(formData.minRevenue) : undefined,
      maxRevenue: formData.maxRevenue ? parseInt(formData.maxRevenue) : undefined,
      minEbitda: formData.minEbitda ? parseInt(formData.minEbitda) : undefined,
      maxEbitda: formData.maxEbitda ? parseInt(formData.maxEbitda) : undefined,
      preferredLocations: formData.preferredLocations || undefined,
      requiredServiceMix: formData.requiredServiceMix || undefined,
      budget: formData.budget ? parseInt(formData.budget) : undefined,
      timeline: formData.timeline || undefined,
      additionalRequirements: formData.additionalRequirements || undefined,
      isAnonymous: formData.isAnonymous,
    });
  };

  const titleValid = formData.title.length >= 10;
  const descriptionValid = formData.description.length >= 50;
  const formValid = titleValid && descriptionValid;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor={`edit-title-${request.id}`}>
          Request Title *{" "}
          <span className="text-xs font-normal text-muted-foreground">(minimum 10 characters)</span>
        </Label>
        <Input
          id={`edit-title-${request.id}`}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Seeking MSP in Texas with $1M+ revenue"
          maxLength={200}
          required
        />
        <p
          className={`text-xs mt-1 ${
            formData.title.length >= 10
              ? "text-green-600"
              : formData.title.length > 0
                ? "text-amber-500"
                : "text-muted-foreground"
          }`}
        >
          {formData.title.length}/200 characters (
          {formData.title.length >= 10
            ? "requirement met"
            : `${10 - formData.title.length} more needed`}
          )
        </p>
      </div>

      <div>
        <Label htmlFor={`edit-description-${request.id}`}>
          Investment Thesis *{" "}
          <span className="text-xs font-normal text-muted-foreground">(minimum 50 characters)</span>
        </Label>
        <Textarea
          id={`edit-description-${request.id}`}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your ideal acquisition target in detail..."
          rows={5}
          maxLength={1000}
          required
        />
        <p
          className={`text-xs mt-1 ${
            formData.description.length >= 50
              ? "text-green-600"
              : formData.description.length > 0
                ? "text-amber-500"
                : "text-muted-foreground"
          }`}
        >
          {formData.description.length}/1000 characters (
          {formData.description.length >= 50
            ? "requirement met"
            : `${50 - formData.description.length} more needed`}
          )
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`edit-minRevenue-${request.id}`}>Min Annual Revenue ($)</Label>
          <Input
            id={`edit-minRevenue-${request.id}`}
            type="number"
            min="0"
            max="999999999"
            step="10000"
            value={formData.minRevenue}
            onChange={(e) => setFormData({ ...formData, minRevenue: e.target.value })}
            placeholder="500000"
          />
        </div>
        <div>
          <Label htmlFor={`edit-maxRevenue-${request.id}`}>Max Annual Revenue ($)</Label>
          <Input
            id={`edit-maxRevenue-${request.id}`}
            type="number"
            min="0"
            max="999999999"
            step="10000"
            value={formData.maxRevenue}
            onChange={(e) => setFormData({ ...formData, maxRevenue: e.target.value })}
            placeholder="2000000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`edit-minEbitda-${request.id}`}>Min EBITDA ($)</Label>
          <Input
            id={`edit-minEbitda-${request.id}`}
            type="number"
            min="0"
            max="999999999"
            step="10000"
            value={formData.minEbitda}
            onChange={(e) => setFormData({ ...formData, minEbitda: e.target.value })}
            placeholder="150000"
          />
        </div>
        <div>
          <Label htmlFor={`edit-maxEbitda-${request.id}`}>Max EBITDA ($)</Label>
          <Input
            id={`edit-maxEbitda-${request.id}`}
            type="number"
            min="0"
            max="999999999"
            step="10000"
            value={formData.maxEbitda}
            onChange={(e) => setFormData({ ...formData, maxEbitda: e.target.value })}
            placeholder="600000"
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`edit-preferredLocations-${request.id}`}>Preferred Locations</Label>
        <Input
          id={`edit-preferredLocations-${request.id}`}
          value={formData.preferredLocations}
          onChange={(e) => setFormData({ ...formData, preferredLocations: e.target.value })}
          placeholder="Texas, California, Remote"
        />
      </div>

      <div>
        <Label htmlFor={`edit-requiredServiceMix-${request.id}`}>Required Service Mix</Label>
        <Textarea
          id={`edit-requiredServiceMix-${request.id}`}
          value={formData.requiredServiceMix}
          onChange={(e) => setFormData({ ...formData, requiredServiceMix: e.target.value })}
          placeholder="e.g., Must include cybersecurity and cloud services"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`edit-budget-${request.id}`}>Budget ($)</Label>
          <Input
            id={`edit-budget-${request.id}`}
            type="number"
            min="0"
            max="999999999"
            step="10000"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            placeholder="2500000"
          />
        </div>
        <div>
          <Label htmlFor={`edit-timeline-${request.id}`}>Timeline</Label>
          <Input
            id={`edit-timeline-${request.id}`}
            value={formData.timeline}
            onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
            placeholder="3-6 months"
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`edit-additionalRequirements-${request.id}`}>Additional Requirements</Label>
        <Textarea
          id={`edit-additionalRequirements-${request.id}`}
          value={formData.additionalRequirements}
          onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
          placeholder="Any other specific requirements..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
        <input
          type="checkbox"
          id={`edit-isAnonymous-${request.id}`}
          checked={formData.isAnonymous}
          onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <div>
          <Label htmlFor={`edit-isAnonymous-${request.id}`} className="font-medium cursor-pointer">
            Post Anonymously
          </Label>
          <p className="text-sm text-muted-foreground">
            Your name will be hidden from sellers until you choose to reveal it
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={updateMutation.isPending || !formValid} className="flex-1">
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={updateMutation.isPending}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
      {!formValid && (formData.title.length > 0 || formData.description.length > 0) && (
        <p className="text-xs text-amber-500 text-center mt-2">
          {!titleValid && !descriptionValid
            ? "Title needs at least 10 characters and Investment Thesis needs at least 50 characters"
            : !titleValid
              ? "Title needs at least 10 characters"
              : "Investment Thesis needs at least 50 characters"}
        </p>
      )}
    </form>
  );
}
