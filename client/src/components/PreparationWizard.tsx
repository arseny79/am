/**
 * Preparation Wizard - Guides sellers through sales packet preparation
 * Multi-step wizard with checklist, templates, and readiness scoring
 */

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle2, 
  Circle, 
  Upload, 
  FileText, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface PreparationWizardProps {
  listingId: number;
  onComplete?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  financial: '💰',
  clients: '👥',
  technical: '🔧',
  operational: '⚙️',
  legal: '⚖️',
};

export function PreparationWizard({ listingId, onComplete }: PreparationWizardProps) {
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);
  const [uploadFiles, setUploadFiles] = useState<Record<number, File | null>>({});
  const [accessLevels, setAccessLevels] = useState<Record<number, string>>({});
  
  // Initialize checklist
  const initMutation = trpc.preparation.initializeChecklist.useMutation();
  
  // Get checklist data
  const { data: checklistData, isLoading, refetch } = trpc.preparation.getChecklist.useQuery(
    { listingId },
    { enabled: !!listingId }
  );
  
  // Update item mutation
  const updateItemMutation = trpc.preparation.updateItem.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Progress saved');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  
  // Initialize checklist on mount if needed
  useEffect(() => {
    if (checklistData && checklistData.items.length === 0) {
      initMutation.mutate({ listingId }, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  }, [checklistData, listingId]);
  
  // Set first category as current when data loads
  useEffect(() => {
    if (checklistData && !currentCategory && checklistData.itemsByCategory.length > 0) {
      setCurrentCategory(checklistData.itemsByCategory[0]!.category);
    }
  }, [checklistData, currentCategory]);
  
  const handleToggleItem = (itemId: number, completed: boolean) => {
    updateItemMutation.mutate({ itemId, completed });
  };
  
  // Upload document mutation
  const uploadDocumentMutation = trpc.listingDocument.upload.useMutation({
    onSuccess: (data) => {
      toast.success('Document uploaded successfully');
      setUploadingItemId(null);
      setUploadFiles({});
      setAccessLevels({});
      refetch();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploadingItemId(null);
    },
  });
  
  const handleFileSelect = (itemId: number, file: File | null) => {
    setUploadFiles(prev => ({ ...prev, [itemId]: file }));
    if (!accessLevels[itemId]) {
      setAccessLevels(prev => ({ ...prev, [itemId]: 'nda' }));
    }
  };
  
  const handleAccessLevelChange = (itemId: number, level: string) => {
    setAccessLevels(prev => ({ ...prev, [itemId]: level }));
  };
  
  const handleUploadDocument = async (itemId: number, itemName: string) => {
    const file = uploadFiles[itemId];
    const accessLevel = accessLevels[itemId] || 'nda';
    
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    setUploadingItemId(itemId);
    
    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      
      uploadDocumentMutation.mutate({
        listingId,
        fileName: file.name,
        fileData: base64.split(',')[1] || base64, // Remove data:mime;base64, prefix
        accessLevel: accessLevel === 'public' ? 'public' : accessLevel === 'nda' ? 'nda_gated' : 'request_only',
        category: 'sales_packet',
        description: itemName,
      });
    };
    reader.readAsDataURL(file);
  };
  
  const getTemplateId = (filename: string | null): string | null => {
    if (!filename) return null;
    const map: Record<string, string> = {
      'financial-statement-template.xlsx': 'financial-statement',
      'client-list-template.xlsx': 'client-list',
      'tech-stack-inventory-template.xlsx': 'tech-stack',
      'employee-information-template.xlsx': 'employee-info',
      'vendor-contract-summary-template.xlsx': 'vendor-contracts',
      'asset-list-template.xlsx': 'asset-list',
    };
    return map[filename] || null;
  };
  
  if (isLoading || !checklistData) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const currentCategoryData = checklistData.itemsByCategory.find(c => c.category === currentCategory);
  const currentCategoryIndex = checklistData.itemsByCategory.findIndex(c => c.category === currentCategory);
  
  const readinessColor = {
    gray: 'bg-gray-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  }[checklistData.readinessLevel.color] || 'bg-gray-500';
  
  return (
    <div className="space-y-6">
      {/* Readiness Score Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sales Packet Preparation</CardTitle>
              <CardDescription>
                Complete the checklist to prepare your listing for buyers
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {checklistData.readinessScore}%
              </div>
              <Badge className={readinessColor}>
                {checklistData.readinessLevel.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={checklistData.readinessScore} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {checklistData.readinessLevel.description}
          </p>
          <div className="flex gap-4 mt-4 text-sm">
            <div>
              <span className="font-medium">{checklistData.completedItems}</span>
              <span className="text-muted-foreground"> / {checklistData.totalItems} items completed</span>
            </div>
            <div>
              <span className="font-medium">{checklistData.completedRequiredItems}</span>
              <span className="text-muted-foreground"> / {checklistData.requiredItems} required</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Category Navigation */}
      <div className="grid grid-cols-5 gap-2">
        {checklistData.itemsByCategory.map((category) => {
          const isActive = category.category === currentCategory;
          const progress = category.totalCount > 0 
            ? Math.round((category.completedCount / category.totalCount) * 100)
            : 0;
          
          return (
            <button
              key={category.category}
              onClick={() => setCurrentCategory(category.category)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <div className="font-medium text-sm mb-1">{category.label}</div>
              <div className="text-xs text-muted-foreground mb-2">
                {category.completedCount} / {category.totalCount}
              </div>
              <Progress value={progress} className="h-1" />
            </button>
          );
        })}
      </div>
      
      {/* Current Category Content */}
      {currentCategoryData && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{currentCategoryData.icon}</span>
              <div>
                <CardTitle>{currentCategoryData.label}</CardTitle>
                <CardDescription>{currentCategoryData.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentCategoryData.items.map((item) => {
                const templateId = getTemplateId(item.templateFileName);
                
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      item.completed 
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={(checked) => 
                          handleToggleItem(item.id, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {item.itemName}
                          </h4>
                          {item.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                          {item.recommended && !item.required && (
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.description}
                        </p>
                        {item.hasTemplate && (
                          <div className="space-y-3">
                            {/* File Upload */}
                            <div>
                              <Label htmlFor={`file-${item.id}`} className="text-sm font-medium">
                                Upload Document
                              </Label>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  id={`file-${item.id}`}
                                  type="file"
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                                  onChange={(e) => handleFileSelect(item.id, e.target.files?.[0] || null)}
                                  className="hidden"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => document.getElementById(`file-${item.id}`)?.click()}
                                  className="gap-2"
                                >
                                  <Upload className="w-4 h-4" />
                                  Choose File
                                </Button>
                                {uploadFiles[item.id] && (
                                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    {uploadFiles[item.id]!.name}
                                    <button
                                      onClick={() => handleFileSelect(item.id, null)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Access Level Selector */}
                            {uploadFiles[item.id] && (
                              <div>
                                <Label htmlFor={`access-${item.id}`} className="text-sm font-medium">
                                  Access Level
                                </Label>
                                <Select
                                  value={accessLevels[item.id] || 'nda'}
                                  onValueChange={(value) => handleAccessLevelChange(item.id, value)}
                                >
                                  <SelectTrigger id={`access-${item.id}`} className="w-full mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="public">Public - Anyone can view</SelectItem>
                                    <SelectItem value="nda">NDA Required - Buyers must sign NDA</SelectItem>
                                    <SelectItem value="request">Request Only - Requires your approval</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            {/* Upload Button */}
                            {uploadFiles[item.id] && (
                              <Button
                                size="sm"
                                onClick={() => handleUploadDocument(item.id, item.itemName)}
                                disabled={uploadingItemId === item.id}
                                className="gap-2"
                              >
                                {uploadingItemId === item.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4" />
                                    Upload Document
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {item.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentCategoryIndex > 0) {
                    setCurrentCategory(checklistData.itemsByCategory[currentCategoryIndex - 1]!.category);
                  }
                }}
                disabled={currentCategoryIndex === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              {currentCategoryIndex < checklistData.itemsByCategory.length - 1 ? (
                <Button
                  onClick={() => {
                    setCurrentCategory(checklistData.itemsByCategory[currentCategoryIndex + 1]!.category);
                  }}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={onComplete}
                  disabled={checklistData.readinessScore < 60}
                  className="gap-2"
                >
                  {checklistData.readinessScore >= 60 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Continue to Listing
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Complete Required Items
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Help Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Need Help?
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Upload your business documents for each item and set the appropriate access level for buyers. 
                You need to complete all required items (60% of readiness score) before publishing your listing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
